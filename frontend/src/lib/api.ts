import type { WeeklyRun } from './types'

const BASE = '/api'

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  latestRun: () => fetchJSON<WeeklyRun>('/runs/latest'),
  allRuns: () => fetchJSON<WeeklyRun[]>('/runs'),
  run: (id: number) => fetchJSON<WeeklyRun>(`/runs/${id}`),
  trigger: () =>
    fetch(`${BASE}/trigger`, { method: 'POST' }).then((r) => r.json()),
}
