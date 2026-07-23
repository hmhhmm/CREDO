import { API_BASE_URL } from './config'
import { tokenStore } from './tokenStore'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = tokenStore.getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    // FastAPI error bodies are {"detail": "..."} or {"detail": [{"msg": "...", ...}]} for
    // pydantic validation errors — surface the human-readable message, not raw JSON.
    let message = text
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed.detail === 'string') {
        message = parsed.detail
      } else if (Array.isArray(parsed.detail)) {
        message = parsed.detail.map(d => d.msg).filter(Boolean).join('; ') || text
      }
    } catch {
      // not JSON — keep the raw text
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: payload => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: payload => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
}

// ── Candidates (Employer Discover) ───────────────────────────────────────────
export const candidatesApi = {
  // filters: { verifiedOnly, minTrustScore, skillTags, simuhireCompleted, university, page, pageSize }
  list: (filters = {}) => {
    const params = new URLSearchParams()
    if (filters.verifiedOnly) params.set('verified_only', 'true')
    if (filters.minTrustScore) params.set('min_trust_score', String(filters.minTrustScore))
    if (filters.simuhireCompleted) params.set('simuhire_completed', 'true')
    if (filters.university) params.set('university', filters.university)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.pageSize) params.set('page_size', String(filters.pageSize))
    for (const tag of filters.skillTags ?? []) params.append('skill_tags', tag)
    const qs = params.toString()
    return request(`/candidates${qs ? `?${qs}` : ''}`, { auth: false })
  },
  get: candidateId => request(`/candidates/${candidateId}`, { auth: false }),
}

// ── Jobs (Employer) ───────────────────────────────────────────────────────────
export const jobsApi = {
  list: () => request('/jobs', { auth: false }),
  get: jobId => request(`/jobs/${jobId}`, { auth: false }),
  create: payload => request('/jobs', { method: 'POST', body: payload }),
  update: (jobId, payload) => request(`/jobs/${jobId}`, { method: 'PATCH', body: payload }),
  remove: jobId => request(`/jobs/${jobId}`, { method: 'DELETE' }),
}

// ── Employers ─────────────────────────────────────────────────────────────────
export const employersApi = {
  me: () => request('/employers/me/profile'),
  updateMe: payload => request('/employers/me/profile', { method: 'PATCH', body: payload }),
}
