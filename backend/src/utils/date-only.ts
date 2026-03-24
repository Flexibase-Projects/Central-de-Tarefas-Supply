function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Normaliza qualquer data para chave de calendário YYYY-MM-DD sem deslocar fuso.
 * - Para strings ISO/date-only, prioriza os 10 primeiros caracteres quando válidos.
 * - Como fallback, usa UTC para evitar variação por timezone do servidor.
 */
export function toDateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const direct = value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  if (direct) return direct;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getUTCFullYear()}-${pad2(parsed.getUTCMonth() + 1)}-${pad2(parsed.getUTCDate())}`;
}

export function isOnOrBeforeDate(left: string | null | undefined, right: string | null | undefined): boolean {
  const leftKey = toDateKey(left);
  const rightKey = toDateKey(right);
  if (!leftKey || !rightKey) return false;
  return leftKey <= rightKey;
}
