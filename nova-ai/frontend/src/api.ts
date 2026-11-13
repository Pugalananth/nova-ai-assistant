export const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
export function getToken() { return localStorage.getItem('nova_token') || '' }
export async function request(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (getToken()) headers.set('Authorization', `Bearer ${getToken()}`)
  const res = await fetch(`${API}${path}`, {...options, headers})
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || body.error || `Request failed (${res.status})`)
  }
  return res
}
