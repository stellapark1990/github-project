"""
Weekly pipeline: crawl → analyze → synthesize → persist.
AI classification step is skipped: repos already filtered by AI topics in crawler.
"""
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from .config import settings
from .crawler import fetch_candidates
from .analyzer import analyze_project, synthesize_trends
from .models import WeeklyRun, ProjectSnapshot
from .database import SessionLocal

logger = logging.getLogger(__name__)


def _week_label(dt: datetime = None) -> str:
    dt = dt or datetime.now(timezone.utc)
    return f"{dt.year}-W{dt.isocalendar()[1]:02d}"


def _get_prev_stars(db: Session) -> dict[str, int]:
    """Load {repo_full_name: stars} from the most recent run."""
    last_run = db.query(WeeklyRun).order_by(WeeklyRun.run_at.desc()).first()
    if not last_run:
        return {}
    rows = db.query(ProjectSnapshot).filter(ProjectSnapshot.run_id == last_run.id).all()
    return {r.repo_full_name: r.stars for r in rows}


def run_weekly_pipeline(db: Session = None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        week_label = _week_label()
        existing = db.query(WeeklyRun).filter(WeeklyRun.week_label == week_label).first()
        if existing:
            logger.info(f"Run for {week_label} already exists (id={existing.id}), skipping.")
            return existing.id

        logger.info(f"=== Starting weekly pipeline for {week_label} ===")

        # ── Step 0: Load previous star counts ───────────────────────────
        prev_stars = _get_prev_stars(db)
        logger.info(f"Previous snapshot repos: {len(prev_stars)}")

        # ── Step 1: Fetch candidates ─────────────────────────────────────
        candidates = fetch_candidates(prev_stars)
        if not candidates:
            logger.warning("No candidates found, aborting.")
            return None

        # ── Step 2: Sort candidates (already topic-filtered, skip LLM classify) ──
        def score(p):
            if p.get("star_delta") is not None:
                return p["star_delta"]
            return p["star_velocity"] * 7

        candidates.sort(key=score, reverse=True)
        logger.info(f"Candidates to analyze: {len(candidates)}")

        # ── Step 3: Per-project analysis — concurrent (5 threads) ───────
        def _analyze(proj):
            logger.info(f"Analyzing: {proj['repo_full_name']}")
            proj["readme_summary"] = analyze_project(proj)
            return proj

        analyzed = []
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {pool.submit(_analyze, p): p for p in candidates}
            for future in as_completed(futures):
                analyzed.append(future.result())

        # ── Step 4: Trend synthesis ──────────────────────────────────────
        logger.info("Synthesizing trends...")
        trend_summary = synthesize_trends(analyzed)

        # ── Step 5: Persist ──────────────────────────────────────────────
        run = WeeklyRun(
            week_label=week_label,
            run_at=datetime.now(timezone.utc),
            project_count=len(analyzed),
            trend_summary=trend_summary,
        )
        db.add(run)
        db.flush()

        for proj in analyzed:
            created_at = datetime.fromisoformat(
                proj.get("repo_created_at", "2020-01-01T00:00:00Z").replace("Z", "+00:00")
            )
            snapshot = ProjectSnapshot(
                run_id=run.id,
                repo_full_name=proj["repo_full_name"],
                name=proj["name"],
                description=proj["description"],
                url=proj["url"],
                homepage=proj.get("homepage", ""),
                stars=proj["stars"],
                forks=proj.get("forks", 0),
                star_delta=proj.get("star_delta"),
                star_velocity=proj["star_velocity"],
                latest_commit_hash=proj.get("latest_commit_hash", ""),
                repo_created_at=created_at,
                readme_summary=proj.get("readme_summary"),
                captured_at=datetime.now(timezone.utc),
            )
            db.add(snapshot)

        db.commit()
        logger.info(f"=== Pipeline complete: run_id={run.id}, {len(analyzed)} projects ===")
        return run.id

    except Exception as e:
        db.rollback()
        logger.exception(f"Pipeline failed: {e}")
        raise
    finally:
        if close_db:
            db.close()


def setup_scheduler(app):
    """Register APScheduler weekly job with FastAPI lifecycle."""
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler(timezone="UTC")
    # Every Monday at 02:00 UTC
    scheduler.add_job(run_weekly_pipeline, "cron", day_of_week="mon", hour=2, minute=0)
    scheduler.start()

    import atexit
    atexit.register(scheduler.shutdown)

    logger.info("Scheduler started: weekly pipeline every Monday 02:00 UTC")
