import bcrypt
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.models.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.auth import create_access_token, get_current_user
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


class PhotoUpload(BaseModel):
    photo: str  # base64 data URL


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = ""
    username: Optional[str] = ""


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    db = get_db()
    if len(request.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    existing_email = await db.users.find_one({"email": request.email})
    if existing_email:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    existing_username = await db.users.find_one({"username": request.username})
    if existing_username:
        raise HTTPException(status_code=409, detail="This username is already taken.")

    hashed = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt())

    user_doc = {
        "username": request.username,
        "email": request.email,
        "full_name": request.full_name or "",
        "password_hash": hashed.decode("utf-8"),
        "created_at": datetime.utcnow(),
        "total_reviews": 0,
        "photo": None,
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id, request.email)

    return TokenResponse(
        access_token=token,
        user={
            "id": user_id,
            "username": request.username,
            "email": request.email,
            "full_name": request.full_name or "",
            "photo": None,
        },
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    db = get_db()
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=401, detail="No account found with this email.")

    valid = bcrypt.checkpw(
        request.password.encode("utf-8"),
        user["password_hash"].encode("utf-8"),
    )
    if not valid:
        raise HTTPException(status_code=401, detail="Incorrect password.")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["email"])

    return TokenResponse(
        access_token=token,
        user={
            "id": user_id,
            "username": user["username"],
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "photo": user.get("photo"),
        },
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "full_name": user.get("full_name", ""),
        "total_reviews": user.get("total_reviews", 0),
        "created_at": user["created_at"],
        "photo": user.get("photo"),
    }


@router.post("/upload-photo")
async def upload_photo(
    body: PhotoUpload,
    current_user: dict = Depends(get_current_user),
):
    """Stores base64 profile photo in MongoDB."""
    db = get_db()

    # Validate it's a base64 image
    if not body.photo.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Invalid image format.")

    # Limit size to ~2MB base64 (~2.7MB string)
    if len(body.photo) > 3_000_000:
        raise HTTPException(status_code=400, detail="Image too large. Max 2MB.")

    await db.users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$set": {"photo": body.photo}},
    )
    return {"message": "Photo updated successfully."}


@router.patch("/update-profile")
async def update_profile(
    body: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Updates username and/or full_name."""
    db = get_db()
    updates = {}

    if body.username:
        if len(body.username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
        # Check username not taken by someone else
        existing = await db.users.find_one({
            "username": body.username,
            "_id": {"$ne": ObjectId(current_user["user_id"])},
        })
        if existing:
            raise HTTPException(status_code=409, detail="Username already taken.")
        updates["username"] = body.username

    if body.full_name is not None:
        updates["full_name"] = body.full_name

    if updates:
        await db.users.update_one(
            {"_id": ObjectId(current_user["user_id"])},
            {"$set": updates},
        )

    return {"message": "Profile updated.", **updates}
