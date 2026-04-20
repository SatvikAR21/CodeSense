import httpx
import os
from dotenv import load_dotenv

load_dotenv()


async def fetch_pr_data(repo: str, pr_number: int, token: str = None) -> dict:
    auth_token = token or os.getenv("GITHUB_TOKEN", "")

    base_headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if auth_token:
        base_headers["Authorization"] = f"Bearer {auth_token}"

    diff_headers = {**base_headers, "Accept": "application/vnd.github.v3.diff"}
    pr_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        meta_response = await client.get(pr_url, headers=base_headers)

        if meta_response.status_code == 404:
            raise ValueError(f"PR #{pr_number} not found in repo '{repo}'.")
        if meta_response.status_code == 401:
            raise ValueError("GitHub token is invalid or expired.")
        if meta_response.status_code == 403:
            raise ValueError("GitHub API rate limit exceeded. Add a GitHub token.")

        meta_response.raise_for_status()
        meta = meta_response.json()

        diff_response = await client.get(pr_url, headers=diff_headers)
        diff_response.raise_for_status()

    return {
        "title": meta.get("title", "Untitled PR"),
        "author": meta.get("user", {}).get("login", "unknown"),
        "changed_files": meta.get("changed_files", 0),
        "additions": meta.get("additions", 0),
        "deletions": meta.get("deletions", 0),
        "diff": diff_response.text,
    }
