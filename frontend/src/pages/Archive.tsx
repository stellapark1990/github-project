import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export function Archive() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['all-runs'],
    queryFn: api.allRuns,
  })

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{
        borderBottom: '1px solid var(--border)',
        paddingBottom: '1.75rem', marginBottom: '2.5rem',
      }}>
        <p className="section-label" style={{ marginBottom: '0.6rem' }}>历史归档</p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
          color: 'var(--t1)', letterSpacing: '-0.01em',
        }}>
          每期快照
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', marginTop: '0.4rem' }}>
          含时间戳与 Commit Hash，完整可追溯
        </p>
      </div>

      {isLoading && (
        <p style={{ color: 'var(--t3)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>加载中...</p>
      )}

      {runs?.length === 0 && (
        <p style={{ color: 'var(--t3)', fontSize: 14 }}>暂无历史记录</p>
      )}

      {runs && runs.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {runs.map((run) => {
            const trends = run.trend_summary?.trends ?? []
            return (
              <Link
                key={run.id}
                to={`/run/${run.id}`}
                className="row"
                style={{
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: '2rem',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15, fontWeight: 700,
                    color: 'var(--indigo)', flexShrink: 0, width: 76,
                  }}>
                    {run.week_label}
                  </span>
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12, color: 'var(--t2)', marginBottom: 8,
                    }}>
                      {new Date(run.run_at).toISOString().slice(0, 10)}
                    </p>
                    {trends.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {trends.map((t, j) => (
                          <span key={j} style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            letterSpacing: '0.04em',
                            padding: '2px 8px',
                            borderRadius: 99,
                            border: '1px solid var(--border)',
                            color: 'var(--t3)',
                          }}>
                            {t.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)', flexShrink: 0 }}>
                  →
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
