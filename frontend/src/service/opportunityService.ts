import { getCurrentUser, getToken } from './authService'

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = 'http://localhost:8080/api'

// ============================================
// TYPES (mirror the Spring Boot opportunity DTOs)
// ============================================

// OpportunityResponse.java
export type OpportunityResponse = {
  id: number
  title: string
  description: string
  requirements: string | null
  location: string | null
  applicationDeadline: string | null // LocalDate, e.g. "2026-10-18"
  createdById: number
  createdByUsername: string
  createdAt: string
  updatedAt: string | null
}

// CreateOpportunityRequest.java (title + description are @NotBlank)
export type CreateOpportunityRequest = {
  title: string
  description: string
  requirements?: string
  location?: string
  applicationDeadline?: string | null
}

// UpdateOpportunityRequest.java (null fields are left unchanged)
export type UpdateOpportunityRequest = Partial<CreateOpportunityRequest>

// ApplyOpportunityRequest.java
export type ApplyOpportunityRequest = {
  message?: string
}

// OpportunityApplicationResponse.java
export type OpportunityApplicationResponse = {
  applicationId: number
  opportunityId: number
  applicantId: number
  applicantUsername: string
  message: string | null
  status: string
  appliedAt: string
}

type ErrorResponse = { message?: string; error?: string }

// ============================================
// REQUEST HELPERS
// ============================================

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try { return JSON.parse(text) as unknown } catch { return text }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'object' && data !== null) {
    const d = data as ErrorResponse
    if (typeof d.error === 'string' && d.error.trim()) return d.error
    if (typeof d.message === 'string' && d.message.trim()) return d.message
  }
  return typeof data === 'string' && data.trim() ? data : fallback
}

let cachedUserId: { token: string; userId: number } | null = null

// Opportunity write endpoints identify the user via the X-User-Id header.
export async function getCurrentUserId(): Promise<number> {
  const token = getToken()
  if (!token) throw new Error('No active login session.')
  if (cachedUserId && cachedUserId.token === token) return cachedUserId.userId
  const user = await getCurrentUser()
  cachedUserId = { token, userId: user.userId }
  return user.userId
}

async function opportunityRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; withUserId?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, withUserId = false } = options
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (withUserId) headers['X-User-Id'] = String(await getCurrentUserId())
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store'
    })
  } catch {
    throw new Error('Unable to connect to Spring Boot at localhost:8080.')
  }
  const data = await readResponse(response)
  if (!response.ok) throw new Error(getErrorMessage(data, `Request failed (${response.status}).`))
  return data as T
}

// ============================================
// OPPORTUNITIES  (OpportunityController - /api/opportunities)
// ============================================

// GET /api/opportunities
export async function getOpportunities(): Promise<OpportunityResponse[]> {
  const data = await opportunityRequest<unknown>('/opportunities')
  if (!Array.isArray(data)) throw new Error('Invalid opportunities response.')
  return data as OpportunityResponse[]
}

// GET /api/opportunities/{id}
export async function getOpportunity(id: number): Promise<OpportunityResponse> {
  return opportunityRequest<OpportunityResponse>(`/opportunities/${id}`)
}

// POST /api/opportunities
export async function createOpportunity(request: CreateOpportunityRequest): Promise<OpportunityResponse> {
  return opportunityRequest<OpportunityResponse>('/opportunities', {
    method: 'POST',
    body: request,
    withUserId: true
  })
}

// PUT /api/opportunities/{id}  (owner only)
export async function updateOpportunity(id: number, request: UpdateOpportunityRequest): Promise<OpportunityResponse> {
  return opportunityRequest<OpportunityResponse>(`/opportunities/${id}`, {
    method: 'PUT',
    body: request,
    withUserId: true
  })
}

// DELETE /api/opportunities/{id}  (owner only, also removes its applications)
export async function deleteOpportunity(id: number): Promise<void> {
  await opportunityRequest<void>(`/opportunities/${id}`, { method: 'DELETE', withUserId: true })
}

// ============================================
// APPLICATIONS
// ============================================

// POST /api/opportunities/{id}/apply
export async function applyToOpportunity(
  id: number,
  request: ApplyOpportunityRequest = {}
): Promise<OpportunityApplicationResponse> {
  return opportunityRequest<OpportunityApplicationResponse>(`/opportunities/${id}/apply`, {
    method: 'POST',
    body: request,
    withUserId: true
  })
}

// GET /api/opportunities/{id}/applications  (owner only)
export async function getOpportunityApplications(id: number): Promise<OpportunityApplicationResponse[]> {
  const data = await opportunityRequest<unknown>(`/opportunities/${id}/applications`, { withUserId: true })
  if (!Array.isArray(data)) throw new Error('Invalid applications response.')
  return data as OpportunityApplicationResponse[]
}
