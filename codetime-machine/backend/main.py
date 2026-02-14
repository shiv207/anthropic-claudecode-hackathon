import os
import re
import httpx
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(title="Code Time Machine API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

GITHUB_API = "https://api.github.com"


def github_headers() -> dict:
    """Build GitHub API headers, optionally with auth token."""
    h = {"Accept": "application/vnd.github.v3+json", "User-Agent": "CodeTimeMachine/2.0"}
    if GITHUB_TOKEN:
        h["Authorization"] = f"token {GITHUB_TOKEN}"
    return h


def parse_github_url(url: str) -> tuple[str, str]:
    """Extract owner/repo from various GitHub URL formats."""
    url = url.strip().rstrip("/")
    # Remove .git suffix
    if url.endswith(".git"):
        url = url[:-4]
    # Match github.com/owner/repo patterns
    m = re.search(r"github\.com[/:]([^/]+)/([^/?#]+)", url)
    if m:
        return m.group(1), m.group(2)
    # Try owner/repo shorthand
    parts = url.split("/")
    if len(parts) == 2 and all(parts):
        return parts[0], parts[1]
    raise ValueError(f"Could not parse GitHub URL: {url}")


def classify_risk(commit: dict) -> str:
    """Heuristic risk classification based on commit stats."""
    stats = commit.get("stats", {})
    total = stats.get("total", 0)
    files = len(commit.get("files", []))
    msg = commit.get("commit", {}).get("message", "").lower()

    # High risk indicators
    if total > 500 or files > 20:
        return "high"
    if any(kw in msg for kw in ["breaking", "migration", "security", "critical", "hotfix", "revert"]):
        return "high"
    # Medium risk
    if total > 100 or files > 8:
        return "medium"
    if any(kw in msg for kw in ["refactor", "restructure", "rename", "merge"]):
        return "medium"
    return "low"


# ─── Models ────────────────────────────────────────────────


class CommitHistoryRequest(BaseModel):
    github_url: str
    limit: int = 20
    page: int = 1


class CommitAnalysisRequest(BaseModel):
    commit_hash: str
    repo_path: str
    diff_content: str


class RegressionRequest(BaseModel):
    repo_path: str
    performance_data: dict


class RepoInfoRequest(BaseModel):
    github_url: str


# ─── In-memory cache ──────────────────────────────────────

analyzed_commits: list[dict] = []
commit_cache: dict[str, dict] = {}  # sha -> full commit data


# ─── Endpoints ────────────────────────────────────────────


@app.get("/")
async def root():
    return {"message": "Code Time Machine API", "version": "2.0.0"}


@app.post("/github-repo-info")
async def github_repo_info(request: RepoInfoRequest):
    """Quick validation — fetch repo metadata."""
    try:
        owner, repo = parse_github_url(request.github_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        r = await client.get(f"{GITHUB_API}/repos/{owner}/{repo}", headers=github_headers())
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Repository {owner}/{repo} not found")
        if r.status_code == 403:
            raise HTTPException(status_code=429, detail="GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env")
        r.raise_for_status()
        data = r.json()

    return {
        "owner": owner,
        "repo": repo,
        "full_name": data.get("full_name"),
        "description": data.get("description"),
        "stars": data.get("stargazers_count"),
        "language": data.get("language"),
        "default_branch": data.get("default_branch"),
        "avatar_url": data.get("owner", {}).get("avatar_url"),
    }


@app.post("/commit-history")
async def get_commit_history(request: CommitHistoryRequest):
    """Fetch real commit history from a public GitHub repo."""
    try:
        owner, repo = parse_github_url(request.github_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        # 1. Fetch commit list
        r = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/commits",
            headers=github_headers(),
            params={"per_page": request.limit, "page": request.page},
        )
        if r.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Repository {owner}/{repo} not found")
        if r.status_code == 403:
            raise HTTPException(status_code=429, detail="GitHub rate limit exceeded. Add GITHUB_TOKEN to .env for 5000 req/hr.")
        r.raise_for_status()
        raw_commits = r.json()

        # 2. For each commit, fetch the detailed commit (includes stats + patch)
        commits = []
        for rc in raw_commits:
            sha = rc["sha"]

            # Check cache first
            if sha in commit_cache:
                commits.append(commit_cache[sha])
                continue

            # Fetch individual commit for stats + files
            cr = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/commits/{sha}",
                headers=github_headers(),
            )
            if cr.status_code != 200:
                # Fallback — use list data without diff
                commit_info = rc.get("commit", {})
                commits.append({
                    "hash": sha,
                    "short_hash": sha[:7],
                    "message": commit_info.get("message", "").split("\n")[0],
                    "author": rc.get("author", {}).get("login", commit_info.get("author", {}).get("name", "unknown")),
                    "avatar_url": rc.get("author", {}).get("avatar_url", ""),
                    "date": commit_info.get("author", {}).get("date", ""),
                    "files_changed": 0,
                    "insertions": 0,
                    "deletions": 0,
                    "risk_level": "low",
                    "diff": "",
                    "files": [],
                })
                continue

            detail = cr.json()
            commit_info = detail.get("commit", {})
            stats = detail.get("stats", {})
            files = detail.get("files", [])

            # Build a unified diff from all file patches
            diff_parts = []
            file_list = []
            for f in files:
                filename = f.get("filename", "")
                status = f.get("status", "modified")
                patch = f.get("patch", "")
                file_list.append({
                    "filename": filename,
                    "status": status,
                    "additions": f.get("additions", 0),
                    "deletions": f.get("deletions", 0),
                    "changes": f.get("changes", 0),
                })
                if patch:
                    diff_parts.append(
                        f"diff --git a/{filename} b/{filename}\n"
                        f"--- a/{filename}\n"
                        f"+++ b/{filename}\n"
                        f"{patch}"
                    )

            full_diff = "\n".join(diff_parts)
            risk = classify_risk(detail)

            entry = {
                "hash": sha,
                "short_hash": sha[:7],
                "message": commit_info.get("message", "").split("\n")[0],
                "full_message": commit_info.get("message", ""),
                "author": (
                    detail.get("author", {}).get("login")
                    if detail.get("author")
                    else commit_info.get("author", {}).get("name", "unknown")
                ),
                "avatar_url": detail.get("author", {}).get("avatar_url", "") if detail.get("author") else "",
                "date": commit_info.get("author", {}).get("date", ""),
                "files_changed": len(files),
                "insertions": stats.get("additions", 0),
                "deletions": stats.get("deletions", 0),
                "risk_level": risk,
                "diff": full_diff,
                "files": file_list,
            }
            commit_cache[sha] = entry
            commits.append(entry)

    return {
        "commits": commits,
        "total": len(commits),
        "owner": owner,
        "repo": repo,
        "page": request.page,
        "has_more": len(raw_commits) == request.limit,
    }


@app.post("/analyze-commit")
async def analyze_commit(request: CommitAnalysisRequest):
    try:
        prompt = f"""
        Analyze this git commit and explain its purpose, impact, and potential risks:
        
        Commit Hash: {request.commit_hash}
        Repository: {request.repo_path}
        
        Diff Content:
        {request.diff_content[:6000]}
        
        Provide:
        1. Summary of changes (2-3 sentences)
        2. Architectural impact
        3. Potential risks or regressions
        4. Test recommendations
        """

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=1000,
        )

        analysis = response.choices[0].message.content

        # Update cache if exists
        if request.commit_hash in commit_cache:
            commit_cache[request.commit_hash]["analysis"] = analysis

        return {
            "commit_hash": request.commit_hash,
            "analysis": analysis,
            "risk_level": "medium",
            "suggested_tests": ["unit tests", "integration tests"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-regression")
async def detect_regression(request: RegressionRequest):
    try:
        prompt = f"""
        Analyze this performance data and git history to identify potential regressions:
        
        Performance Metrics: {json.dumps(request.performance_data, indent=2)}
        
        Identify:
        1. Any performance regressions
        2. Likely commit causing the issue
        3. Recommended fix or rollback strategy
        4. Impact assessment
        """

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1500,
        )

        analysis = response.choices[0].message.content

        return {
            "regression_detected": True,
            "analysis": analysis,
            "recommended_action": "rollback",
            "confidence": 0.85,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-repair")
async def generate_repair(regression_data: dict):
    try:
        prompt = f"""
        Generate a repair strategy for this regression:
        
        Regression Analysis: {json.dumps(regression_data, indent=2)}
        
        Create:
        1. Safe rollback plan or fix strategy
        2. Code patch if applicable
        3. Testing recommendations
        4. Deployment considerations
        """

        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=1500,
        )

        repair_strategy = response.choices[0].message.content

        return {
            "repair_strategy": repair_strategy,
            "estimated_effort": "medium",
            "risk_level": "low",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
