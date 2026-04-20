from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ── Auth schemas ─────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserPublic(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = ""
    created_at: datetime


# ── Review schemas ───────────────────────────────────────────────────

class ReviewRequest(BaseModel):
    repo: str
    pr_number: int
    github_token: Optional[str] = None


class BugIssue(BaseModel):
    line: int
    description: str
    severity: str


class SecurityIssue(BaseModel):
    line: int
    issue: str
    fix: str


class ComplexityIssue(BaseModel):
    function: str
    suggestion: str


class StyleIssue(BaseModel):
    description: str


class ReviewResponse(BaseModel):
    id: Optional[str] = None
    pr_title: str
    author: str
    repo: Optional[str] = None
    pr_number: Optional[int] = None
    overall_score: int
    summary: str
    bugs: List[BugIssue]
    security: List[SecurityIssue]
    complexity: List[ComplexityIssue]
    style: List[StyleIssue]
    created_at: Optional[datetime] = None


class ReviewHistoryItem(BaseModel):
    id: str
    pr_title: str
    repo: str
    pr_number: int
    overall_score: int
    summary: str
    total_issues: int
    created_at: datetime
