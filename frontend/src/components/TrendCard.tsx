import { TREND_ACCENTS } from '../lib/categories'
import type { Trend } from '../lib/types'

export function TrendCard({ trend, index }: { trend: Trend; index: number }) {
  const accent = TREND_ACCENTS[index % TREND_ACCENTS.length]

  return (
    <div className="card" style={{
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 顶部色条 */}
      <div style={{ height: 3, background: accent, borderRadius: 2, marginBottom: '1rem' }} />

      {/* 序号 */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: accent,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '0.6rem',
      }}>
        趋势 {index + 1}
      </span>

      {/* 标题 */}
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 20,
        fontWeight: 700,
        color: 'var(--t1)',
        lineHeight: 1.5,
        margin: 0,
        padding: '0 0 1rem 0',
      }}>
        {trend.title}
      </h3>

      {/* 描述 */}
      <p style={{
        fontSize: 14,
        color: 'var(--t2)',
        lineHeight: 1.7,
        flex: 1,
        margin: 0,
        marginBottom: '0.85rem',
      }}>
        {trend.description}
      </p>

      {/* 论据 */}
      {trend.evidence.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {trend.evidence.map((e, i) => (
            <p key={i} style={{
              fontSize: 12,
              color: 'var(--t3)',
              lineHeight: 1.55,
              margin: 0,
              paddingLeft: 8,
              borderLeft: `2px solid ${accent}40`,
            }}>
              {e}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
