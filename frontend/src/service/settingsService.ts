
import { getToken } from './authService'

const API_BASE = 'http://localhost:8080/api/settings'

export type Profile = {
  displayName: string
  email: string
}

export type ReportType = 'ISSUE' | 'USER'

export type ReportReceipt = {
  id: number
  status: string
}

export type HelpItem = {
  question: string
  answer: string
}

async function apiRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  data?: unknown
): Promise<T> {

  const token = getToken()

  if (!token) {
    throw new Error('Please sign in before continuing.')
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(data !== undefined
          ? { 'Content-Type': 'application/json' }
          : {})
      },
      ...(data !== undefined
        ? { body: JSON.stringify(data) }
        : {})
    })

    if (!response.ok) {
      const responseText = await response.text()

      console.error(
        'Settings API error:',
        response.status,
        responseText
      )

      let message = `Request failed (${response.status}).`

      try {
        const parsed = JSON.parse(responseText)

        message =
          parsed.detail ||
          parsed.message ||
          parsed.error ||
          message
      } catch {
        if (responseText && responseText.length < 300) {
          message = responseText
        }
      }

      if (response.status === 401) {
        message = 'Session expired. Please log in again.'
      }

      if (response.status === 403) {
        message = 'You do not have permission to submit this request.'
      }

      if (response.status === 404) {
        message =
          'The requested endpoint or username was not found. Check the backend response.'
      }

      throw new Error(message)
    }

    return (await response.json()) as T

  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        'Cannot connect to the backend. Make sure Spring Boot is running on port 8080.'
      )
    }

    throw err
  }
}

export const settingsApi = {

  profile: () =>
    apiRequest<Profile>(''),

  saveProfile: (data: Profile) =>
    apiRequest<Profile>(
      '/account',
      'PATCH',
      data
    ),

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) =>
    apiRequest<{ message: string }>(
      '/password',
      'POST',
      {
        currentPassword,
        newPassword
      }
    ),

  report: (
    reportType: ReportType,
    description: string,
    reportedUsername?: string
  ) =>
    apiRequest<ReportReceipt>(
      '/reports',
      'POST',
      {
        reportType,
        description,
        reportedUsername:
          reportType === 'USER'
            ? (reportedUsername ?? '').replace(/^@+/, '').trim()
            : null
      }
    ),

  help: () =>
    apiRequest<HelpItem[]>('/help'),

  guidelines: () =>
    apiRequest<string[]>('/guidelines')
}
