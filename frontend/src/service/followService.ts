import { getCurrentUser, getToken } from './authService'

const API_BASE_URL = 'http://localhost:8080/api'

type CountResponse = { count: number }
type FollowStatusResponse = { following: boolean }
type ErrorResponse = { message?: string; error?: string }

export type FollowPerson = {
  userId: number
  fullName: string
  username: string
  profileImageUrl: string | null
}

export type FollowRelationship = {
  userId: number
  iFollow: boolean
  followsMe: boolean
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try { return JSON.parse(text) as unknown } catch { return text }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'object' && data !== null) {
    const d = data as ErrorResponse
    if (typeof d.message === 'string' && d.message.trim()) return d.message
    if (typeof d.error === 'string' && d.error.trim()) return d.error
  }
  return typeof data === 'string' && data.trim() ? data : fallback
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = getToken()
  if (!token) throw new Error('No active login session.')
  // Preserve the header required by your older follow endpoints.
  // The new private endpoints use JWT identity on the server instead.
  const currentUser = await getCurrentUser()
  return { Authorization: `Bearer ${token}`, 'X-User-Id': String(currentUser.userId) }
}

async function requiredRequest(path: string, method: 'GET' | 'POST' | 'DELETE' = 'GET'): Promise<unknown> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: await getAuthHeaders(),
    cache: 'no-store'
  })
  const data = await readResponse(response)
  if (!response.ok) throw new Error(getErrorMessage(data, `Request failed (${response.status}).`))
  return data
}

function validCount(data: unknown): number {
  if (typeof data !== 'object' || data === null || !('count' in data)) return 0
  const n = Number((data as CountResponse).count)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export async function getFollowersCount(userId: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/followers/count`)
    if (!response.ok) { console.warn('Followers count HTTP', response.status); return 0 }
    return validCount(await readResponse(response))
  } catch (error) { console.warn('Followers count error:', error); return 0 }
}

export async function getFollowingCount(userId: number): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/following/count`)
    if (!response.ok) { console.warn('Following count HTTP', response.status); return 0 }
    return validCount(await readResponse(response))
  } catch (error) { console.warn('Following count error:', error); return 0 }
}

// Backward-compatible interface used elsewhere in your project.
export async function getFollowStatus(targetUserId: number): Promise<boolean> {
  try {
    const data = await requiredRequest(`/users/${targetUserId}/follow-status`)
    return typeof data === 'object' && data !== null && 'following' in data
      ? Boolean((data as FollowStatusResponse).following) : false
  } catch (error) { console.warn('Follow status error:', error); return false }
}

export async function followUser(targetUserId: number): Promise<void> {
  await requiredRequest(`/users/${targetUserId}/follow`, 'POST')
}

export async function unfollowUser(targetUserId: number): Promise<void> {
  await requiredRequest(`/users/${targetUserId}/unfollow`, 'DELETE')
}

// Lists are restricted by backend to the authenticated user; no userId argument.
export async function getMyFollowers(): Promise<FollowPerson[]> {
  const data = await requiredRequest('/users/me/followers')
  if (!Array.isArray(data)) throw new Error('Invalid followers response.')
  return data as FollowPerson[]
}

export async function getMyFollowing(): Promise<FollowPerson[]> {
  const data = await requiredRequest('/users/me/following')
  if (!Array.isArray(data)) throw new Error('Invalid following response.')
  return data as FollowPerson[]
}

// Only the two booleans are available for another user's profile.
export async function getFollowRelationship(targetUserId: number): Promise<FollowRelationship> {
  const data = await requiredRequest(`/users/${targetUserId}/follow-relationship`)
  if (typeof data !== 'object' || data === null ||
      !('iFollow' in data) || !('followsMe' in data)) {
    throw new Error('Invalid follow relationship response.')
  }
  const rel = data as FollowRelationship
  return { userId: targetUserId, iFollow: Boolean(rel.iFollow), followsMe: Boolean(rel.followsMe) }
}
