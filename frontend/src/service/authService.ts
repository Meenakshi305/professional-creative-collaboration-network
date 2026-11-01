import { API_ORIGIN } from '../config/api'

const API_BASE_URL = `${API_ORIGIN}/api/auth`
const TOKEN_KEY = 'creativeCollabToken'

// ============================================
// TYPES
// ============================================

export type SignupRequest = {
  fullName: string
  username: string
  email: string
  password: string
  dateOfBirth: string
  guardianEmail?: string
  guardianAccount?: boolean
}

export type SigninRequest = {
  email: string
  password: string
}

export type AuthResponse = {
  userId: number
  fullName: string
  username: string
  email: string
  role: string
  token: string | null
  message: string
}

export type CurrentUserResponse = {
  userId: number
  fullName: string
  username: string
  email: string
  dateOfBirth: string | null
  role: string
  active: boolean
  guardianConsentRequired: boolean
  guardianConsentStatus: string
}

// ============================================
// RESPONSE HELPERS
// ============================================

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text.trim()) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null && !Array.isArray(data)
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (isRecord(data)) {
    for (const key of ['message', 'error']) {
      const value = data[key]

      if (typeof value === 'string' && value.trim()) {
        return value
      }
    }
  }

  // Avoid displaying an HTML error page as a message.
  if (
    typeof data === 'string' &&
    data.trim() &&
    !data.trim().startsWith('<')
  ) {
    return data
  }

  return fallback
}

function parseAuthResponse(data: unknown): AuthResponse {
  if (
    !isRecord(data) ||
    typeof data.userId !== 'number' ||
    typeof data.fullName !== 'string' ||
    typeof data.username !== 'string' ||
    typeof data.email !== 'string' ||
    typeof data.role !== 'string' ||
    !(data.token === null || typeof data.token === 'string') ||
    typeof data.message !== 'string'
  ) {
    throw new Error(
      'Invalid authentication response. Check the backend API URL and server logs.'
    )
  }

  return data as AuthResponse
}

// ============================================
// SIGNUP
// ============================================

export async function signupUser(
  request: SignupRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Unable to create account (${response.status}).`
      )
    )
  }

  // Signup may return a null token while guardian consent is pending.
  return parseAuthResponse(data)
}

// ============================================
// LOGIN
// ============================================

export async function loginUser(
  request: SigninRequest
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, `Unable to log in (${response.status}).`)
    )
  }

  const auth = parseAuthResponse(data)

  if (!auth.token?.trim()) {
    throw new Error(
      auth.message || 'No authentication token was returned.'
    )
  }

  return auth
}

// ============================================
// SESSION
// ============================================

export function saveLoginSession(
  response: AuthResponse | null | undefined
): void {
  if (
    !response ||
    typeof response.token !== 'string' ||
    !response.token.trim()
  ) {
    throw new Error('No authentication token was returned.')
  }

  sessionStorage.setItem(TOKEN_KEY, response.token)
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function hasLoginSession(): boolean {
  return Boolean(getToken())
}

export function clearLoginSession(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

// ============================================
// CURRENT USER
// ============================================

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const token = getToken()

  if (!token) {
    throw new Error('No active login session.')
  }

  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await readResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      clearLoginSession()
    }

    throw new Error(
      getErrorMessage(
        data,
        `Unable to load current user (${response.status}).`
      )
    )
  }

  if (!isRecord(data) || typeof data.userId !== 'number') {
    throw new Error('Invalid current user response from server.')
  }

  return data as CurrentUserResponse
}

// ============================================
// LOGOUT
// ============================================

export async function logoutUser(): Promise<void> {
  const token = getToken()

  try {
    if (token) {
      await fetch(`${API_BASE_URL}/signout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    }
  } finally {
    clearLoginSession()
  }
}