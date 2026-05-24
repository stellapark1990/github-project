import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { catStyle } from '../lib/categories'
import { ProjectCard } from '../components/ProjectCard'
import { TrendCard } from '../components/TrendCard'
import { InsightSection } from '../components/InsightSection'

function fmtDate(iso: string) {
  return new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

export function Home() {
  const [activeCat, setActiveCat] = useState<string | null>(null)

  const { data: run, isLoading, isError, refetch } = useQuery({
    queryKey: ['latest-run'],
    queryFn: api.latestRun,
  })

  // Derive unique categories from projects
  const categories = useMemo(() => {
    if (!run?.projects) return []
    const cats = run.projects
      .map(p => p.category)
      .filter((c): c is string => !!c)
    return [...new Set(cats)]
  }, [run?.projects])

  const filteredProjects = useMemo(() => {
    if (!run?.projects) return []
    if (!activeCat) return run.projects
    return run.projects.filter(p => p.category === activeCat)
  }, [run?.projects, activeCat])

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0',
                    fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t3)' }}>
        加载中...
      </div>
    )
  }

  if (isError || !run) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1.5rem' }}>
        <p style={{ fontSize: 15, color: 'var(--t2)', marginBottom: '1.5rem' }}>
          暂无数据，还没有运行过爬取任务。
        </p>
        <button onClick={() => api.trigger().then(() => refetch())}
                className="filter-btn" style={{ margin: '0 auto' }}>
          立即触发爬取
        </button>
      </div>
    )
  }

  const trends = run.trend_summary?.trends ?? []

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

      {/* ── 页面头部 ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '1.75rem', marginBottom: '3rem',
      }}>
        <div>
          <h1 style={{ lineHeight: 1.1, marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--font-stat)',
              fontSize: 36,
              letterSpacing: '0.04em',
              color: 'var(--t1)',
            }}>
              {run.week_label}
            </span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--t2)',
              marginLeft: 10,
            }}>
              周报
            </span>
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t3)' }}>
            快照于 {fmtDate(run.run_at)}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 32, textAlign: 'right' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-stat)', fontSize: 42,
              letterSpacing: '0.02em',
              color: 'var(--t1)', lineHeight: 1,
            }}>
              {run.project_count}
            </div>
            <p className="section-label" style={{ marginTop: 4 }}>项目</p>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-stat)', fontSize: 42,
              letterSpacing: '0.02em',
              color: 'var(--indigo)', lineHeight: 1,
            }}>
              {trends.length}
            </div>
            <p className="section-label" style={{ marginTop: 4 }}>趋势</p>
          </div>
        </div>
      </div>

      {/* ── 本周一句话总结 ───────────────────────────────────────── */}
      {run.trend_summary?.weekly_summary && (
        <div style={{
          borderLeft: '3px solid var(--indigo)',
          paddingLeft: '1.25rem',
          marginBottom: '3rem',
        }}>
          <p className="section-label" style={{ marginBottom: '0.5rem' }}>一句话总结</p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 17,
            color: 'var(--t1)',
            lineHeight: 1.7,
            fontWeight: 400,
          }}>
            {run.trend_summary.weekly_summary}
          </p>
        </div>
      )}

      {/* ── 核心趋势 — 三栏并列 ──────────────────────────────────── */}
      {trends.length > 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            color: 'var(--t1)', marginBottom: '1.25rem', letterSpacing: '-0.01em',
          }}>本周核心趋势</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}>
            {trends.map((t, i) => <TrendCard key={i} trend={t} index={i} />)}
          </div>
        </section>
      )}

      {/* ── 黑马项目 + 筛选 ──────────────────────────────────────── */}
      {filteredProjects.length >= 0 && (
        <section style={{ marginBottom: '3.5rem' }}>
          {/* 标题行 */}
          <div style={{
            display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: '1rem',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
              color: 'var(--t1)', letterSpacing: '-0.01em',
            }}>黑马项目</p>
          </div>

          {/* 分类筛选栏 */}
          {categories.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6,
              marginBottom: '1.25rem',
            }}>
              <button
                className={`filter-btn ${activeCat === null ? 'active' : ''}`}
                onClick={() => setActiveCat(null)}
              >
                全部
              </button>
              {categories.map(cat => {
                const cs = catStyle(cat)
                const isActive = activeCat === cat
                return (
                  <button
                    key={cat}
                    className="filter-btn"
                    onClick={() => setActiveCat(isActive ? null : cat)}
                    style={{
                      borderColor: isActive ? cs.border : 'var(--border)',
                      color: isActive ? cs.color : 'var(--t3)',
                      background: isActive ? cs.bg : 'transparent',
                    }}
                  >
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: cs.color, flexShrink: 0, display: 'inline-block',
                    }} />
                    {cat}
                  </button>
                )
              })}
            </div>
          )}

          {/* 项目列表 */}
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {filteredProjects.length > 0
              ? filteredProjects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)
              : (
                <p style={{ padding: '2rem 0', color: 'var(--t3)', fontSize: 14 }}>
                  该分类下暂无项目
                </p>
              )
            }
          </div>
        </section>
      )}

      {/* ── 本周思考 ─────────────────────────────────────────────── */}
      {run.trend_summary && (
        <section style={{ marginBottom: '3.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            color: 'var(--t1)', letterSpacing: '-0.01em', marginBottom: '1rem',
          }}>本周思考</p>
          <InsightSection summary={run.trend_summary} />
        </section>
      )}

      <p style={{
        textAlign: 'center', fontFamily: 'var(--font-mono)',
        fontSize: 11, color: 'var(--t3)',
      }}>
        每周一自动更新 · Commit Hash 保证数据可追溯
      </p>
    </div>
  )
}
