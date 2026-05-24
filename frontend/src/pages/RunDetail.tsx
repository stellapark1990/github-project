import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { ProjectCard } from '../components/ProjectCard'
import { TrendCard } from '../components/TrendCard'
import { InsightSection } from '../components/InsightSection'

function fmtDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

export function RunDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: run, isLoading } = useQuery({
    queryKey: ['run', id],
    queryFn: () => api.run(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--t3)', fontSize: 14,
                    fontFamily: 'var(--font-mono)' }}>
        加载中...
      </div>
    )
  }

  if (!run) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <p style={{ color: 'var(--t2)', fontSize: 15, marginBottom: '0.75rem' }}>
          该期数据不存在
        </p>
        <Link to="/archive" style={{ color: 'var(--indigo)', fontSize: 14 }}>
          返回归档
        </Link>
      </div>
    )
  }

  const trends = run.trend_summary?.trends ?? []
  const projects = run.projects ?? []

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      <Link to="/archive"
            style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none',
                     display: 'inline-block', marginBottom: '2rem',
                     transition: 'color 0.15s', fontFamily: 'var(--font-mono)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--t2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--t3)')}>
        ← 归档
      </Link>

      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '1.75rem', marginBottom: '3rem',
      }}>
        <div>
          <h1 style={{ lineHeight: 1.1, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-stat)', fontSize: 36, letterSpacing: '0.04em', color: 'var(--t1)' }}>
              {run.week_label}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--t2)', marginLeft: 10 }}>
              周报
            </span>
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)' }}>
            快照于 {fmtDate(run.run_at)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-stat)', fontSize: 42, color: 'var(--t1)', lineHeight: 1 }}>
            {run.project_count}
          </div>
          <p className="section-label" style={{ marginTop: 4 }}>项目</p>
        </div>
      </div>

      {trends.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            color: 'var(--t1)', marginBottom: '1.25rem', letterSpacing: '-0.01em',
          }}>核心趋势</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
            {trends.map((t, i) => <TrendCard key={i} trend={t} index={i} />)}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: '1rem',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
              color: 'var(--t1)', letterSpacing: '-0.01em',
            }}>黑马项目</p>
            <span className="mono">{projects.length} 个</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
          </div>
        </section>
      )}

      {run.trend_summary && (
        <section style={{ marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            color: 'var(--t1)', marginBottom: '1rem', letterSpacing: '-0.01em',
          }}>本期思考</p>
          <InsightSection summary={run.trend_summary} />
        </section>
      )}
    </div>
  )
}
