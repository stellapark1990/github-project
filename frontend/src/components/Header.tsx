import { Link, useLocation } from 'react-router-dom'

export function Header() {
  const { pathname } = useLocation()

  return (
    <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
            className="sticky top-0 z-50">
      {/* Multi-color top bar */}
      <div style={{ height: 3, display: 'flex' }}>
        {['#818cf8', '#34d399', '#fb7185'].map((c, i) => (
          <div key={i} style={{ flex: 1, background: c }} />
        ))}
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--t1)',
            lineHeight: 1,
          }}>
            RADAR
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--t3)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingLeft: 12,
            borderLeft: '1px solid var(--border)',
          }}>
            Github 热门项目
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 4 }}>
          {[{ to: '/', label: '本周' }, { to: '/archive', label: '归档' }].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${pathname === to ? 'var(--border-h)' : 'transparent'}`,
              background: pathname === to ? 'var(--surface-h)' : 'transparent',
              color: pathname === to ? 'var(--t1)' : 'var(--t3)',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
