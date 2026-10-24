
import { getCurrentUser, getToken } from './authService'

const API_URL = 'http://localhost:8080/api/opportunities'

export type Opportunity = {
  id: number
  title: string
  description: string
  requirements: string | null
  location: string | null
  applicationDeadline: string | null
  createdById: number
  createdByUsername: string
  createdAt: string
  updatedAt: string
}

export type OpportunityInput = {
  title: string
  description: string
  requirements: string
  location: string
  applicationDeadline: string
}

export type OpportunityApplication = {
  applicationId: number
  opportunityId: number
  applicantId: number
  applicantUsername: string
  message: string | null
  status: string
  appliedAt: string
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  userId?: number
): Promise<T> {
  const token = getToken()

  if (!token) {
    throw new Error('Please sign in to continue.')
  }

  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)

  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (userId !== undefined) {
    headers.set('X-User-Id', String(userId))
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const raw = await response.text()
    let message = `Request failed (${response.status})`

    try {
      const parsed: unknown = JSON.parse(raw)
      if (
        parsed &&
        typeof parsed === 'object' &&
        'message' in parsed &&
        typeof parsed.message === 'string'
      ) {
        message = parsed.message
      } else if (raw) {
        message = raw
      }
    } catch {
      if (raw) message = raw
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function currentUserId(): Promise<number> {
  const user = await getCurrentUser()
  return user.userId
}

export function getOpportunities(): Promise<Opportunity[]> {
  return request<Opportunity[]>('')
}

export async function createOpportunity(
  data: OpportunityInput
): Promise<Opportunity> {
  const userId = await currentUserId()

  return request<Opportunity>(
    '',
    {
      method: 'POST',
      body: JSON.stringify(data)
    },
    userId
  )
}

export async function updateOpportunity(
  id: number,
  data: OpportunityInput
): Promise<Opportunity> {
  const userId = await currentUserId()

  return request<Opportunity>(
    `/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data)
    },
    userId
  )
}

export async function deleteOpportunity(
  id: number
): Promise<void> {
  const userId = await currentUserId()

  return request<void>(
    `/${id}`,
    { method: 'DELETE' },
    userId
  )
}

export async function applyToOpportunity(
  opportunityId: number,
  message: string
): Promise<OpportunityApplication> {
  const userId = await currentUserId()

  return request<OpportunityApplication>(
    `/${opportunityId}/apply`,
    {
      method: 'POST',
      body: JSON.stringify({ message })
    },
    userId
  )
}

export async function getOpportunityApplications(
  opportunityId: number
): Promise<OpportunityApplication[]> {
  const userId = await currentUserId()

  return request<OpportunityApplication[]>(
    `/${opportunityId}/applications`,
    {},
    userId
  )
}

export async function getMyApplications():
  Promise<OpportunityApplication[]> {
  const userId = await currentUserId()

  return request<OpportunityApplication[]>(
    '/my-applications',
    {},
    userId
  )
}

export async function updateApplicationStatus(
  applicationId: number,
  status: 'ACCEPTED' | 'REJECTED'
): Promise<OpportunityApplication> {
  const userId = await currentUserId()

  return request<OpportunityApplication>(
    `/applications/${applicationId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status })
    },
    userId
  )
}
