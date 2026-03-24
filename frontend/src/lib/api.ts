/**
 * Base URL para chamadas à API.
 * Quando o app é acessado por um host público (ex.: cdt.flexibase.com) e VITE_API_URL
 * aponta para localhost, retorna '' para usar URL relativa e evitar fetch para máquina errada.
 */
export function getApiBase(): string {
  const env = import.meta.env.VITE_API_URL || '';
  if (typeof window === 'undefined') return env;
  if (!env) return '';

  // Se VITE_API_URL apontar para a mesma origem do frontend (ex.: :3005),
  // preferimos URL relativa para cair no proxy /api do Vite.
  try {
    const envUrl = new URL(env);
    if (envUrl.origin === window.location.origin) return '';
  } catch {
    // Se a variável vier inválida, mantém comportamento atual.
  }

  const isLocalhostUrl = env.startsWith('http://localhost') || env.startsWith('http://127.0.0.1');
  const isBrowserOnLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhostUrl && !isBrowserOnLocalhost) return '';
  return env;
}
