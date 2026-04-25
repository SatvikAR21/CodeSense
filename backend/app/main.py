from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routers import auth, review, pdf


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="CodeSense — AI Code Review Assistant",
    description="AI-powered code review using a custom fine-tuned T5 model",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://code-sense-iota.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(review.router)
app.include_router(pdf.router)


@app.get("/")
async def root():
    return {
        "message": "CodeSense backend is running",
        "docs":    "https://codesense-backend-uls6.onrender.com/docs",
        "health":  "https://codesense-backend-uls6.onrender.com/api/health",
    }
