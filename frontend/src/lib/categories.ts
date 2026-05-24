export const CATEGORY_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  'Agent框架':  { color: '#5090f5', bg: 'rgba(80,144,245,0.10)', border: 'rgba(80,144,245,0.25)' },
  'RAG工具':    { color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)', border: 'rgba(45,212,191,0.25)' },
  '推理引擎':   { color: '#9b7cf4', bg: 'rgba(155,124,244,0.10)', border: 'rgba(155,124,244,0.25)' },
  '训练框架':   { color: '#f0a040', bg: 'rgba(240,160,64,0.10)', border: 'rgba(240,160,64,0.25)' },
  '数据工具':   { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)', border: 'rgba(56,189,248,0.25)' },
  '评测工具':   { color: '#ec72ab', bg: 'rgba(236,114,171,0.10)', border: 'rgba(236,114,171,0.25)' },
  '模型':       { color: '#40c97b', bg: 'rgba(64,201,123,0.10)', border: 'rgba(64,201,123,0.25)' },
  '应用':       { color: '#f06b50', bg: 'rgba(240,107,80,0.10)', border: 'rgba(240,107,80,0.25)' },
}

const FALLBACK = { color: '#8090ab', bg: 'rgba(128,144,171,0.10)', border: 'rgba(128,144,171,0.25)' }

export function catStyle(cat: string | null): { color: string; bg: string; border: string } {
  if (!cat) return FALLBACK
  return CATEGORY_COLOR[cat] ?? FALLBACK
}

// Trend cards get rotating accent colors
export const TREND_ACCENTS = ['#5090f5', '#2dd4bf', '#f06b50']
