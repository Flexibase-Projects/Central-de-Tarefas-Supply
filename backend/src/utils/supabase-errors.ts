/**
 * Verifica se o erro indica que o Supabase está indisponível (ex.: local não está rodando).
 */
export function isSupabaseConnectionRefused(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  const message = String(e?.message ?? '');
  const details = e?.details ?? '';
  const detailsStr = typeof details === 'string' ? details : String(details);
  const cause = e?.cause as Record<string, unknown> | undefined;
  const causeRefused = cause && (cause.code === 'ECONNREFUSED' || cause.errno === 'ECONNREFUSED');
  return (
    message.includes('fetch failed') ||
    detailsStr.includes('ECONNREFUSED') ||
    Boolean(causeRefused)
  );
}

export const SUPABASE_UNAVAILABLE_MESSAGE =
  'Supabase indisponível: o backend não conseguiu conectar em SUPABASE_URL. Verifique se a URL/porta estão corretas, firewall/rede liberados e se o stack GoTrue/PostgREST está no ar.';
