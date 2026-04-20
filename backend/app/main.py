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
    title="ReviewAI — Code Review Assistant",
    description="AI-powered code review using CodeLlama 13B and GitHub API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://code-sense-iota.vercel.app",             # Your Production URL
        "https://code-sense-iota-*.vercel.app",          # Your Preview Wildcard
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
        "message": "ReviewAI v2 backend is running",
        "docs": "http://localhost:8000/docs",
    }
