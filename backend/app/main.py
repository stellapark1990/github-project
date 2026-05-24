import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db, init_db
from .models import WeeklyRun, ProjectSnapshot
from .scheduler import run_weekly_pipeline, setup_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    setup_scheduler(app)
    yield


app = FastAPI(title="AI Darkhouse Radar", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ─────────────────────────────────────────────────────────────────

def _serialize_project(p: ProjectSnapshot) -> dict:
    summary = p.readme_summary or {}
    return {
        "id": p.id,
        "repo_full_name": p.repo_full_name,
        "name": p.name,
        "description": p.description,
        "url": p.url,
        "homepage": p.homepage,
        "stars": p.stars,
        "forks": p.forks,
        "star_delta": p.star_delta,
        "star_velocity": p.star_velocity,
        "latest_commit_hash": p.latest_commit_hash,
        "latest_commit_url": f"{p.url}/commit/{p.latest_commit_hash}" if p.latest_commit_hash else None,
        "repo_created_at": p.repo_created_at.isoformat() if p.repo_created_at else None,
        "captured_at": p.captured_at.isoformat() if p.captured_at else None,
        "tagline": summary.get("tagline"),
        "problem": summary.get("problem"),
        "target_users": summary.get("target_users"),
        "tech_highlights": summary.get("tech_highlights", []),
        "why_trending": summary.get("why_trending"),
        "category": summary.get("category"),
        "target_business": summary.get("target_business"),
    }


def _serialize_run(run: WeeklyRun, include_projects: bool = False) -> dict:
    data = {
        "id": run.id,
        "week_label": run.week_label,
        "run_at": run.run_at.isoformat(),
        "project_count": run.project_count,
        "trend_summary": run.trend_summary,
    }
    if include_projects:
        sorted_projects = sorted(run.projects, key=lambda p: p.stars, reverse=True)[:10]
        data["projects"] = [_serialize_project(p) for p in sorted_projects]
    return data


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/api/runs")
def list_runs(db: Session = Depends(get_db)):
    """List all weekly runs (no projects, for archive page)."""
    runs = db.query(WeeklyRun).order_by(WeeklyRun.run_at.desc()).all()
    return [_serialize_run(r) for r in runs]


@app.get("/api/runs/latest")
def get_latest_run(db: Session = Depends(get_db)):
    """Get the most recent run with full project details."""
    run = db.query(WeeklyRun).order_by(WeeklyRun.run_at.desc()).first()
    if not run:
        raise HTTPException(status_code=404, detail="No runs yet")
    return _serialize_run(run, include_projects=True)


@app.get("/api/runs/{run_id}")
def get_run(run_id: int, db: Session = Depends(get_db)):
    """Get a specific run with full project details."""
    run = db.query(WeeklyRun).filter(WeeklyRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return _serialize_run(run, include_projects=True)


@app.post("/api/trigger")
def trigger_pipeline(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Manually trigger the weekly pipeline (runs in background)."""
    background_tasks.add_task(run_weekly_pipeline)
    return {"message": "Pipeline triggered in background"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
