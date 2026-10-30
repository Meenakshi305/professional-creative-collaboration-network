import { getCurrentUser, getToken } from './authService'

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = 'http://localhost:8080/api'

// ============================================
// TYPES (mirror the Spring Boot event DTOs)
// ============================================

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
export type EventType = 'FREE' | 'PAID'
export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

// EventResponse.java
export type EventResponse = {
  id: number
  title: string
  description: string | null
  category: string
  city: string
  venue: string | null
  startDateTime: string
  endDateTime: string
  status: EventStatus
  eventType: EventType
  capacity: number
  price: number
  createdBy: number
  createdAt: string
  updatedAt: string
  imageUrl: string | null
}

// CreateEventRequest.java
// Date-times are ISO local date-times, e.g. "2026-10-24T18:00:00".
export type CreateEventRequest = {
  title: string
  description?: string
  category: string
  city: string
  venue?: string
  startDateTime: string
  endDateTime: string
  eventType?: EventType
  capacity: number
  price?: number
}

// UpdateEventRequest.java (every field optional, PATCH semantics)
export type UpdateEventRequest = Partial<CreateEventRequest> & {
  status?: EventStatus
}

// EventRegistrationResponse.java
export type EventRegistrationResponse = {
  id: number
  eventId: number
  eventTitle: string
  userId: number
  username: string
  status: RegistrationStatus
  registeredAt: string
  cancelledAt: string | null
}

export type EventFilters = {
  status?: EventStatus
  city?: string
  category?: string
  eventType?: EventType
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

// Event create/register endpoints identify the user via the X-User-Id header.
export async function getCurrentUserId(): Promise<number> {
  const token = getToken()
  if (!token) throw new Error('No active login session.')
  if (cachedUserId && cachedUserId.token === token) return cachedUserId.userId
  const user = await getCurrentUser()
  cachedUserId = { token, userId: user.userId }
  return user.userId
}

async function getHeaders(withUserId: boolean, withBody: boolean): Promise<Record<string, string>> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (withUserId) headers['X-User-Id'] = String(await getCurrentUserId())
  if (withBody) headers['Content-Type'] = 'application/json'
  return headers
}

async function eventRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; withUserId?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, withUserId = false } = options
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: await getHeaders(withUserId, body !== undefined),
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

function toQuery(filters: EventFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.city?.trim()) params.set('city', filters.city.trim())
  if (filters.category?.trim()) params.set('category', filters.category.trim())
  if (filters.eventType) params.set('eventType', filters.eventType)
  const query = params.toString()
  return query ? `?${query}` : ''
}

// ============================================
// EVENTS  (EventController - /api/events)
// ============================================

// GET /api/events?status=&city=&category=&eventType=
export async function getEvents(filters: EventFilters = {}): Promise<EventResponse[]> {
  const data = await eventRequest<unknown>(`/events${toQuery(filters)}`)
  if (!Array.isArray(data)) throw new Error('Invalid events response.')
  return data as EventResponse[]
}

// GET /api/events/{eventId}
export async function getEvent(eventId: number): Promise<EventResponse> {
  return eventRequest<EventResponse>(`/events/${eventId}`)
}

// POST /api/events  (new events are created as DRAFT)
export async function createEvent(request: CreateEventRequest): Promise<EventResponse> {
  return eventRequest<EventResponse>('/events', { method: 'POST', body: request, withUserId: true })
}
// POST /api/events/{eventId}/image
// Uploads an image for an event owned by the logged-in user.
export async function uploadEventImage(
  eventId: number,
  file: File
): Promise<EventResponse> {
  const token = getToken()

  if (!token) {
    throw new Error('Please log in to upload an event image.')
  }

  const formData = new FormData()
  formData.append('file', file)

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/events/${eventId}/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
  } catch {
    throw new Error('Unable to connect to Spring Boot at localhost:8080.')
  }

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, `Image upload failed (${response.status}).`)
    )
  }

  return data as EventResponse
}

// PATCH /api/events/{eventId}
export async function updateEvent(eventId: number, request: UpdateEventRequest): Promise<EventResponse> {
  return eventRequest<EventResponse>(`/events/${eventId}`, { method: 'PATCH', body: request })
}

// Convenience wrapper: DRAFT -> PUBLISHED via PATCH
export async function publishEvent(eventId: number): Promise<EventResponse> {
  return updateEvent(eventId, { status: 'PUBLISHED' })
}

// DELETE /api/events/{eventId}  (soft delete: backend marks the event CANCELLED)
export async function deleteEvent(eventId: number): Promise<void> {
  await eventRequest<void>(`/events/${eventId}`, { method: 'DELETE' })
}

// ============================================
// REGISTRATIONS
// ============================================

// POST /api/events/{eventId}/registrations
// FREE events are CONFIRMED immediately, PAID events start as PENDING.
export async function registerForEvent(eventId: number): Promise<EventRegistrationResponse> {
  return eventRequest<EventRegistrationResponse>(`/events/${eventId}/registrations`, {
    method: 'POST',
    withUserId: true
  })
}

// GET /api/events/{eventId}/registrations
export async function getEventRegistrations(eventId: number): Promise<EventRegistrationResponse[]> {
  const data = await eventRequest<unknown>(`/events/${eventId}/registrations`)
  if (!Array.isArray(data)) throw new Error('Invalid registrations response.')
  return data as EventRegistrationResponse[]
}

// GET /api/users/{userId}/event-registrations
export async function getUserRegistrations(userId: number): Promise<EventRegistrationResponse[]> {
  const data = await eventRequest<unknown>(`/users/${userId}/event-registrations`)
  if (!Array.isArray(data)) throw new Error('Invalid registrations response.')
  return data as EventRegistrationResponse[]
}

// Same as above for the logged-in user
export async function getMyRegistrations(): Promise<EventRegistrationResponse[]> {
  return getUserRegistrations(await getCurrentUserId())
}

// GET /api/event-registrations/{registrationId}
export async function getRegistration(registrationId: number): Promise<EventRegistrationResponse> {
  return eventRequest<EventRegistrationResponse>(`/event-registrations/${registrationId}`)
}

// PATCH /api/event-registrations/{registrationId}/cancel
export async function cancelRegistration(
  registrationId: number
): Promise<EventRegistrationResponse> {
  return eventRequest<EventRegistrationResponse>(
    `/event-registrations/${registrationId}/cancel`,
    {
      method: 'PATCH'
    }
  )
}

// ============================================
// GET EVENT IMAGE WITH JWT AUTHENTICATION
// ============================================

export async function getEventImageBlob(
  eventId: number,
  signal?: AbortSignal
): Promise<Blob> {
  const token = getToken()

  if (!token) {
    throw new Error('Please log in to view event images.')
  }

  const response = await fetch(
    `${API_BASE_URL}/events/${eventId}/image`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'image/jpeg,image/png,image/webp'
      },
      cache: 'no-store',
      signal
    }
  )

  if (!response.ok) {
    const data = await readResponse(response)

    throw new Error(
      getErrorMessage(
        data,
        `Unable to load event image (${response.status}).`
      )
    )
  }

  const blob = await response.blob()

  if (
    blob.size === 0 ||
    !blob.type.toLowerCase().startsWith('image/')
  ) {
    throw new Error('The server did not return a valid image.')
  }

  return blob
}

  

