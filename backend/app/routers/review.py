from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
from app.models.schemas import ReviewRequest, ReviewResponse, ReviewHistoryItem
from app.auth import get_current_user
from app.database import get_db
from app.services import github_service, llm_service
router = APIRouter(prefix="/api", tags=["review"])


@router.post("/review", response_model=ReviewResponse)
async def review_pr(
    request: ReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()

    # Check if this PR was already reviewed by this user
    existing = await db.reviews.find_one({
        "user_id": current_user["user_id"],
        "repo": request.repo,
        "pr_number": request.pr_number,
    })
    if existing:
        print(f"[Cache] Returning saved review for {request.repo}#{request.pr_number}")
        return _format_review(existing)

    # Fetch PR from GitHub
    try:
        pr_data = await github_service.fetch_pr_data(
            repo=request.repo,
            pr_number=request.pr_number,
            token=request.github_token,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"GitHub API error: {str(e)}")

    if not pr_data["diff"].strip():
        raise HTTPException(status_code=400, detail="This PR has no diff.")

    # Run AI analysis
    try:
        analysis = await llm_service.analyze_code(pr_data["diff"])
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    # Save to MongoDB
    review_doc = {
        "user_id": current_user["user_id"],
        "repo": request.repo,
        "pr_number": request.pr_number,
        "pr_title": pr_data["title"],
        "author": pr_data["author"],
        "overall_score": analysis.get("overall_score", 50),
        "summary": analysis.get("summary", ""),
        "bugs": analysis.get("bugs", []),
        "security": analysis.get("security", []),
        "complexity": analysis.get("complexity", []),
        "style": analysis.get("style", []),
        "created_at": datetime.utcnow(),
    }

    result = await db.reviews.insert_one(review_doc)
    review_doc["_id"] = result.inserted_id

    # Increment user's total_reviews counter
    await db.users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$inc": {"total_reviews": 1}},
    )

    return _format_review(review_doc)


@router.get("/history", response_model=list[ReviewHistoryItem])
async def get_history(current_user: dict = Depends(get_current_user)):
    """Returns all reviews for the logged-in user, newest first."""
    db = get_db()
    cursor = db.reviews.find(
        {"user_id": current_user["user_id"]}
    ).sort("created_at", -1)

    reviews = []
    async for doc in cursor:
        total_issues = (
            len(doc.get("bugs", [])) +
            len(doc.get("security", [])) +
            len(doc.get("complexity", [])) +
            len(doc.get("style", []))
        )
        reviews.append(ReviewHistoryItem(
            id=str(doc["_id"]),
            pr_title=doc["pr_title"],
            repo=doc["repo"],
            pr_number=doc["pr_number"],
            overall_score=doc["overall_score"],
            summary=doc["summary"],
            total_issues=total_issues,
            created_at=doc["created_at"],
        ))

    return reviews


@router.get("/review/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Fetch a single saved review by ID."""
    db = get_db()
    doc = await db.reviews.find_one({
        "_id": ObjectId(review_id),
        "user_id": current_user["user_id"],
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Review not found.")
    return _format_review(doc)


@router.delete("/review/{review_id}")
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a review from history."""
    db = get_db()
    result = await db.reviews.delete_one({
        "_id": ObjectId(review_id),
        "user_id": current_user["user_id"],
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Review not found.")

    await db.users.update_one(
        {"_id": ObjectId(current_user["user_id"])},
        {"$inc": {"total_reviews": -1}},
    )
    return {"message": "Review deleted successfully."}


@router.get("/health")
async def health():
    return {"status": "ok", "model": "codellama:13b"}


def _format_review(doc: dict) -> ReviewResponse:
    return ReviewResponse(
        id=str(doc["_id"]),
        pr_title=doc["pr_title"],
        author=doc["author"],
        repo=doc.get("repo"),
        pr_number=doc.get("pr_number"),
        overall_score=doc["overall_score"],
        summary=doc["summary"],
        bugs=doc.get("bugs", []),
        security=doc.get("security", []),
        complexity=doc.get("complexity", []),
        style=doc.get("style", []),
        created_at=doc.get("created_at"),
    )
