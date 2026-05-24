export interface Project {
  id: number
  repo_full_name: string
  name: string
  description: string
  url: string
  homepage: string | null
  stars: number
  forks: number
  star_delta: number | null
  star_velocity: number
  latest_commit_hash: string
  latest_commit_url: string | null
  repo_created_at: string | null
  captured_at: string | null
  tagline: string | null
  problem: string | null
  target_users: string | null
  tech_highlights: string[]
  why_trending: string | null
  category: string | null
  target_business: string | null
}

export interface Trend {
  title: string
  description: string
  evidence: string[]
}

export interface TrendSummary {
  weekly_summary?: string
  trends: Trend[]
  product_insights: string[]
  engineer_insights: string[]
}

export interface WeeklyRun {
  id: number
  week_label: string
  run_at: string
  project_count: number
  trend_summary: TrendSummary | null
  projects?: Project[]
}
