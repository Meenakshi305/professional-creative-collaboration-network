
import { getCurrentUser, getToken } from './authService'

const API_BASE_URL = 'http://localhost:8080/api'

// ============================================
// TYPES
// ============================================

export type EventType = 'FREE' | 'PAID'

export type CreateEventRequest = {
  title: string
  description: string
  category: string
  city: string
  venue: string
  startDateTime: string
  endDateTime: string
  eventType: EventType
  capacity: number
  price: number
}

export type EventResponse = CreateEventRequest & {
  id: number
  status: string
  createdBy: number
  createdAt: string
  updatedAt: string
}

export type EventRegistrationResponse = {
  id: number
  eventId: number
  eventTitle: string
  userId: number
  username: string
  status: string
  registeredAt: string
  cancelledAt: string | null
}

// ============================================
// HELPERS
// ============================================

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  return fallback
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = getToken()

  if (!token) {
    throw new Error('No active login session.')
  }

  const currentUser = await getCurrentUser()

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-User-Id': String(currentUser.userId)
  }
}

// ============================================
// GET EVENTS
// ============================================

export async function getEvents(
  eventType?: EventType
): Promise<EventResponse[]> {
  const query = eventType
    ? `?eventType=${encodeURIComponent(eventType)}`
    : ''

  const response = await fetch(`${API_BASE_URL}/events${query}`)

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to load events.'))
  }

  if (!Array.isArray(data)) {
    throw new Error('Invalid events response from server.')
  }

  return data as EventResponse[]
}

// ============================================
// GET EVENT BY ID
// ============================================

export async function getEventById(
  eventId: number
): Promise<EventResponse> {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`)

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to load event details.'))
  }

  return data as EventResponse
}

// ============================================
// CREATE EVENT
// ============================================

export async function createEvent(
  request: CreateEventRequest
): Promise<EventResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  })

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to create event.'))
  }

  return data as EventResponse
}

// ============================================
// REGISTER FOR EVENT
// ============================================

export async function registerForEvent(
  eventId: number
): Promise<EventRegistrationResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/events/${eventId}/registrations`,
    {
      method: 'POST',
      headers
    }
  )

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to register for event.'))
  }

  return data as EventRegistrationResponse
}

// ============================================
// GET MY REGISTRATIONS
// ============================================

export async function getMyEventRegistrations():
  Promise<EventRegistrationResponse[]> {
  const currentUser = await getCurrentUser()
  const token = getToken()

  if (!token) {
    throw new Error('No active login session.')
  }

  const response = await fetch(
    `${API_BASE_URL}/users/${currentUser.userId}/event-registrations`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to load registrations.'))
  }

  if (!Array.isArray(data)) {
    throw new Error('Invalid registrations response from server.')
  }

  return data as EventRegistrationResponse[]
}

// ============================================
// CANCEL REGISTRATION
// ============================================

export async function cancelEventRegistration(
  registrationId: number
): Promise<EventRegistrationResponse> {
  const headers = await getAuthHeaders()

  const response = await fetch(
    `${API_BASE_URL}/event-registrations/${registrationId}/cancel`,
    {
      method: 'PATCH',
      headers
    }
  )

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(data, 'Unable to cancel registration.'))
  }

  return data as EventRegistrationResponse
}