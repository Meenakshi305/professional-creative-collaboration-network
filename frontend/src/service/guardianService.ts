import { getToken } from './authService'

export type ConsentStatus = { required: boolean; status: string; guardianEmail: string | null }
export type ConsentRequest = { id: number; childName: string; childUsername: string; expiresAt: string }
export type ParentControls = { accessPaused: boolean; postingAllowed: boolean; eventsAllowed: boolean; applicationsAllowed: boolean }
export type LinkedChild = { consentId: number; childId: number; fullName: string; username: string;
  posts: number; events: number; applications: number; approvedAt: string; controls: ParentControls }
export type Activity = { id: number; title: string | null; status: string; date: string }
export type ChildActivity = { posts: Activity[]; events: Activity[]; applications: Activity[] }

async function request<T>(path: string, body?: unknown): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('Please sign in first.')
  const response = await fetch(`http://localhost:8080/api/guardian${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  })
  const text = await response.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { /* Error fallback below. */ }
  if (!response.ok) {
    const error = data as { message?: string; error?: string } | null
    throw new Error(error?.message || error?.error || `Request failed (${response.status}).`)
  }
  return data as T
}
export const getConsentStatus = () => request<ConsentStatus>('/status')
export const getConsentRequests = () => request<ConsentRequest[]>('/requests')
export const getLinkedChildren = () => request<LinkedChild[]>('/children')
export const getChildActivity = (id: number) => request<ChildActivity>(`/children/${id}/activity`)
export const decideConsent = (id: number, approve: boolean, guardianConfirmed: boolean) =>
  request<void>(`/requests/${id}/decision`, { approve, guardianConfirmed })
export const revokeConsent = (id: number) => request<void>(`/requests/${id}/revoke`, {})

export const updateParentControls = (id: number, controls: ParentControls) =>
  request<void>(`/children/${id}/controls`, controls)
