import { ExternalLink } from 'lucide-react'
import { catStyle } from '../lib/categories'
import type { Project } from '../lib/types'

function fmtStar(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
}

export function ProjectCard({ project: p, index }: { project: Project; index: number }) {
  const cs = catStyle(p.category)
  const shortHash = p.latest_commit_hash?.slice(0, 7) ?? null

  return (
    <div className="row">
      <div style={{ display: 'flex', gap: 20 }}>

        {/* 序号 */}
        <div style={{ width: 26, flexShrink: 0, paddingTop: 3, textAlign: 'right' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)' }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* 主内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* 行 1：项目名 + 分类 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--t1)',
              lineHeight: 1.25,
            }}>
              {p.name}
            </span>
            {p.category && (
              <span className="cat-tag" style={{
                color: cs.color,
                background: cs.bg,
                borderColor: cs.border,
              }}>
                {p.category}
              </span>
            )}
          </div>

          {/* 行 2：一句话定位 */}
          {p.tagline && (
            <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 8 }}>
              {p.tagline}
            </p>
          )}

          {/* 行 3：技术亮点 */}
          {p.tech_highlights.length > 0 && (
            <ul style={{ marginBottom: 10 }}>
              {p.tech_highlights.map((h, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--t3)', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--t3)', flexShrink: 0 }}>—</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          {/* 行 4：适合的业务方向 */}
          {p.target_business && (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--t3)',
              }}>
                适合关注
              </span>
              <span style={{
                fontSize: 13, color: 'var(--teal)',
                fontFamily: 'var(--font-body)',
              }}>
                {p.target_business}
              </span>
            </div>
          )}

          {/* 行 5：洞见 */}
          {p.why_trending && (
            <div style={{
              borderLeft: '2px solid #fb7185',
              paddingLeft: 10,
              marginBottom: 12,
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#fb7185',
              }}>
                洞见
              </span>
              <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65, marginTop: 2 }}>
                {p.why_trending}
              </p>
            </div>
          )}

          {/* 底部：链接 + hash + 时间 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href={p.url} target="_blank" rel="noopener noreferrer"
               style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 13, color: cs.color, textDecoration: 'none',
                        transition: 'color 0.15s' }}>
              {p.repo_full_name} <ExternalLink size={12} />
            </a>
            {shortHash && p.latest_commit_url && (
              <a href={p.latest_commit_url} target="_blank" rel="noopener noreferrer"
                 className="mono" style={{ color: 'var(--t3)', textDecoration: 'none' }}
                 title={`commit: ${p.latest_commit_hash}`}>
                {shortHash}
              </a>
            )}
            <span className="mono">{fmtDate(p.captured_at)}</span>
          </div>
        </div>

        {/* 星数（独立右列） */}
        <div style={{ flexShrink: 0, textAlign: 'right', paddingTop: 2, minWidth: 60 }}>
          {p.star_delta !== null && (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--teal)',
              lineHeight: 1.1,
            }}>
              +{fmtStar(p.star_delta)}
            </div>
          )}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--t2)',
            marginTop: 3,
          }}>
            ⭐ {fmtStar(p.stars)}
          </div>
        </div>
      </div>
    </div>
  )
}
