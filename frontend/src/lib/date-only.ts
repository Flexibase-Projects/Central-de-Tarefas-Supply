function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function toDateKey(value: string | null | undefined): string | null {
  if (!value) return null
  const direct = value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null
  if (direct) return direct

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return `${parsed.getUTCFullYear()}-${pad2(parsed.getUTCMonth() + 1)}-${pad2(parsed.getUTCDate())}`
}

export function formatDatePtBr(value: string | null | undefined, fallback = '—'): string {
  const key = toDateKey(value)
  if (!key) return fallback
  const [y, m, d] = key.split('-')
  if (!y || !m || !d) return fallback
  return `${d}/${m}/${y}`
}

export function isOverdueDate(value: string | null | undefined): boolean {
  const key = toDateKey(value)
  if (!key) return false
  const now = new Date()
  const today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
  return key < today
}
