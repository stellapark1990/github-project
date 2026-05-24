"""
GitHub crawler: fetches candidate repos and computes dark horse scores.
"""
import base64
import time
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from .config import settings

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Authorization": f"Bearer {settings.GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def _get(url: str, params: dict = None, retries: int = 3) -> dict:
    for attempt in range(retries):
        try:
            r = httpx.get(url, headers=HEADERS, params=params, timeout=20)
            if r.status_code == 403 and "rate limit" in r.text.lower():
                wait = int(r.headers.get("X-RateLimit-Reset", time.time() + 60)) - int(time.time())
                logger.warning(f"Rate limited, sleeping {wait}s")
                time.sleep(max(wait, 1))
                continue
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt == retries - 1:
                raise
            time.sleep(2 ** attempt)
    return {}


def _search_repos(query: str, per_page: int = 30) -> list[dict]:
    """Search GitHub repos, respecting rate limits."""
    results = []
    params = {
        "q": query,
        "sort": "stars",
        "order": "desc",
        "per_page": per_page,
    }
    data = _get(f"{GITHUB_API}/search/repositories", params=params)
    items = data.get("items", [])
    results.extend(items)
    time.sleep(2)  # be polite between search queries
    return results


def _fetch_readme(owner: str, repo: str) -> Optional[str]:
    try:
        data = _get(f"{GITHUB_API}/repos/{owner}/{repo}/readme")
        content = data.get("content", "")
        encoding = data.get("encoding", "base64")
        if encoding == "base64":
            return base64.b64decode(content).decode("utf-8", errors="ignore")
        return content
    except Exception as e:
        logger.warning(f"README fetch failed for {owner}/{repo}: {e}")
        return None


def _fetch_latest_commit(owner: str, repo: str) -> Optional[str]:
    try:
        data = _get(f"{GITHUB_API}/repos/{owner}/{repo}/commits", params={"per_page": 1})
        if data and isinstance(data, list):
            return data[0].get("sha", "")
        return None
    except Exception as e:
        logger.warning(f"Commit fetch failed for {owner}/{repo}: {e}")
        return None


def _is_blocked(owner: str) -> bool:
    return owner.lower() in [o.lower() for o in settings.BLOCKED_ORGS]


def _repo_age_days(created_at_str: str) -> float:
    created = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    return max((now - created).days, 1)


def fetch_candidates(prev_stars: dict[str, int] = None) -> list[dict]:
    """
    Fetch and filter candidate repos.

    prev_stars: {repo_full_name: star_count} from last week's snapshot.
                None means first run.

    Returns list of enriched repo dicts with readme and commit hash.
    """
    prev_stars = prev_stars or {}
    since_date = (datetime.utcnow() - timedelta(days=settings.MAX_AGE_DAYS)).strftime("%Y-%m-%d")

    seen: dict[str, dict] = {}

    for topic in settings.AI_TOPICS:
        query = f"topic:{topic} created:>{since_date} stars:>{settings.MIN_STARS}"
        logger.info(f"Searching: {query}")
        try:
            items = _search_repos(query, per_page=30)
        except Exception as e:
            logger.error(f"Search failed for topic={topic}: {e}")
            continue

        for repo in items:
            full_name = repo.get("full_name", "")
            owner = repo.get("owner", {}).get("login", "")

            if full_name in seen:
                continue
            if _is_blocked(owner):
                logger.debug(f"Blocked org: {owner}")
                continue

            age_days = _repo_age_days(repo.get("created_at", "2020-01-01T00:00:00Z"))
            stars = repo.get("stargazers_count", 0)
            velocity = stars / age_days

            # Dark horse qualification
            if prev_stars:
                delta = stars - prev_stars.get(full_name, stars)
                if delta < settings.MIN_STAR_DELTA:
                    logger.debug(f"Insufficient delta {delta} for {full_name}")
                    continue
            else:
                if velocity < settings.MIN_STAR_VELOCITY:
                    logger.debug(f"Insufficient velocity {velocity:.1f} for {full_name}")
                    continue

            seen[full_name] = {
                "repo_full_name": full_name,
                "name": repo.get("name", ""),
                "description": repo.get("description", "") or "",
                "url": repo.get("html_url", ""),
                "homepage": repo.get("homepage", "") or "",
                "stars": stars,
                "forks": repo.get("forks_count", 0),
                "star_delta": (stars - prev_stars.get(full_name, stars)) if prev_stars else None,
                "star_velocity": round(velocity, 2),
                "repo_created_at": repo.get("created_at"),
                "owner": owner,
                "repo_slug": repo.get("name", ""),
            }

    candidates = list(seen.values())
    logger.info(f"Candidates after dark-horse filter: {len(candidates)}")

    # Cap to top 40 by score before enriching (saves API calls)
    def score(p):
        if p.get("star_delta") is not None:
            return p["star_delta"]
        return p["star_velocity"] * 7

    candidates.sort(key=score, reverse=True)
    candidates = candidates[:40]
    logger.info(f"Top {len(candidates)} candidates selected for enrichment")

    # Concurrently fetch README + commit (10 threads)
    def enrich(c: dict) -> Optional[dict]:
        owner, slug = c["owner"], c["repo_slug"]
        readme = _fetch_readme(owner, slug)
        if not readme:
            logger.debug(f"Skipping {c['repo_full_name']} — no README")
            return None
        commit = _fetch_latest_commit(owner, slug)
        c["readme"] = readme
        c["latest_commit_hash"] = commit or ""
        return c

    enriched = []
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(enrich, c): c for c in candidates}
        for future in as_completed(futures):
            result = future.result()
            if result:
                enriched.append(result)

    logger.info(f"Enriched candidates: {len(enriched)}")
    return enriched
