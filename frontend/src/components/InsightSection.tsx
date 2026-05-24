import type { TrendSummary } from '../lib/types'

function InsightList({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  return (
    <div style={{ padding: '1.75rem' }}>
      <p className="section-label" style={{ marginBottom: '1.25rem' }}>{label}</p>
      <ol style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.map((item, i) => (
          <li key={i} style={{ display: 'flex', gap: '1rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 500,
              color: accent,
              flexShrink: 0,
              width: 18,
              textAlign: 'right',
              paddingTop: 1,
            }}>
              {i + 1}
            </span>
            <p style={{ fontSize: 15, color: 'var(--t2)', lineHeight: 1.65 }}>{item}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function InsightSection({ summary }: { summary: TrendSummary }) {
  return (
    <div className="card-static">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      }}>
        <div style={{ borderRight: '1px solid var(--border)' }}>
          <InsightList label="产品视角" items={summary.product_insights} accent="#818cf8" />
        </div>
        <div>
          <InsightList label="工程视角" items={summary.engineer_insights} accent="#34d399" />
        </div>
      </div>
    </div>
  )
}
