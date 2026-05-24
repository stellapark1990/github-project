from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base


class WeeklyRun(Base):
    __tablename__ = "weekly_runs"

    id = Column(Integer, primary_key=True, index=True)
    week_label = Column(String(20), unique=True, index=True)  # e.g. "2026-W21"
    run_at = Column(DateTime, default=datetime.utcnow)
    project_count = Column(Integer, default=0)

    # LLM-generated: {trends: [{title, description, evidence}], product_insights: [], engineer_insights: []}
    trend_summary = Column(JSON, nullable=True)

    projects = relationship("ProjectSnapshot", back_populates="run", cascade="all, delete-orphan")


class ProjectSnapshot(Base):
    __tablename__ = "project_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("weekly_runs.id"), nullable=False)

    # Identity
    repo_full_name = Column(String(200), index=True)   # "owner/repo"
    name = Column(String(200))
    description = Column(Text)
    url = Column(String(500))
    homepage = Column(String(500), nullable=True)

    # Metrics at snapshot time
    stars = Column(Integer)
    forks = Column(Integer)
    star_delta = Column(Integer, nullable=True)         # None on first run
    star_velocity = Column(Float)                       # stars/day since creation

    # Traceability
    latest_commit_hash = Column(String(40))             # full SHA
    repo_created_at = Column(DateTime)
    captured_at = Column(DateTime, default=datetime.utcnow)

    # LLM analysis
    # {tagline, problem, target_users, tech_highlights: [], why_trending, category}
    readme_summary = Column(JSON, nullable=True)

    run = relationship("WeeklyRun", back_populates="projects")
