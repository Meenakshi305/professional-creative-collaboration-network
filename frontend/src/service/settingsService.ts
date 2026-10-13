
import { getToken } from './authService'

// ============================================
// SETTINGS API CONFIGURATION
// ============================================

// Proposed endpoints — backend team must confirm
// or implement these routes before integration.
const SETTINGS_API_URL = 'http://localhost:8080/api/settings'

// ============================================
// TYPES
// ============================================

export type AccountSettings = {
  userId: number
  fullName: string
  username: string
  email: string
  dateOfBirth: string | null
  role: string
  active: boolean
}

export type UpdateAccountRequest = {
  fullName: string
  username: string
  email: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type NotificationSettings = {
  eventUpdates: boolean
  collaborationRequests: boolean
  emailNotifications: boolean
}

export type PrivacySettings = {
  profileVisibility: 'public' | 'private'
  portfolioVisibility: 'public' | 'private'
}

export type AppearanceSettings = {
  theme: 'light' | 'dark' | 'system'
}

export type UserSettings = {
  notifications: NotificationSettings
  privacy: PrivacySettings
  appearance: AppearanceSettings
}

// ============================================
// API HELPERS
// ============================================

function getAuthHeaders(): HeadersInit {
  const token = getToken()

  if (!token) {
    throw new Error('No active login session.')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  }
}

async function readResponse(
  response: Response
): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data
  ) {
    const message = (data as { message?: unknown }).message

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  return fallback
}

async function settingsRequest<T>(
  endpoint: string,
  method: 'GET' | 'PUT' | 'POST' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const response = await fetch(
    `${SETTINGS_API_URL}${endpoint}`,
    {
      method,
      headers: getAuthHeaders(),
      ...(body !== undefined
        ? { body: JSON.stringify(body) }
        : {})
    }
  )

  const data = await readResponse(response)

  if (!response.ok) {
    throw new Error(
      getErrorMessage(data, 'Settings request failed.')
    )
  }

  return data as T
}

// ============================================
// ACCOUNT
// ============================================

// Reuse the existing /api/auth/me endpoint
// instead of introducing a duplicate GET route.
export async function getAccountSettings():
  Promise<AccountSettings> {
  const { getCurrentUser } = await import('./authService')
  return getCurrentUser()
}

export async function updateAccountSettings(
  request: UpdateAccountRequest
): Promise<AccountSettings> {
  return settingsRequest<AccountSettings>(
    '/account',
    'PUT',
    request
  )
}

// ============================================
// SECURITY
// ============================================

export async function changePassword(
  request: ChangePasswordRequest
): Promise<void> {
  await settingsRequest<void>(
    '/password',
    'PUT',
    request
  )
}

// ============================================
// USER PREFERENCES
// ============================================

export async function getUserSettings():
  Promise<UserSettings> {
  return settingsRequest<UserSettings>(
    '/preferences'
  )
}

export async function updateNotificationSettings(
  request: NotificationSettings
): Promise<NotificationSettings> {
  return settingsRequest<NotificationSettings>(
    '/notifications',
    'PUT',
    request
  )
}

export async function updatePrivacySettings(
  request: PrivacySettings
): Promise<PrivacySettings> {
  return settingsRequest<PrivacySettings>(
    '/privacy',
    'PUT',
    request
  )
}

export async function updateAppearanceSettings(
  request: AppearanceSettings
): Promise<AppearanceSettings> {
  return settingsRequest<AppearanceSettings>(
    '/appearance',
    'PUT',
    request
  )
}

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

export async function deactivateAccount():
  Promise<void> {
  await settingsRequest<void>(
    '/account/deactivate',
    'POST'
  )
}

export async function deleteAccount():
  Promise<void> {
  await settingsRequest<void>(
    '/account',
    'DELETE'
  )
}


/* ============================================
   HELP & SUPPORT — TYPES
   ============================================ */

export type SupportQueryRequest = {
  subject: string
  category: string
  description: string
}

export type IssueReportRequest = {
  title: string
  issueType: string
  severity: string
  description: string
  stepsToReproduce?: string
}

export type SupportSubmissionResult = {
  submitted: boolean
  demo: boolean
  message: string
}

export type AdminAccessStatus = {
  authenticated: boolean
  isAdmin: boolean
  role: string | null
  message: string
}

/* ============================================
   HELP & SUPPORT — VALIDATION
   ============================================ */

function requireText(
  value: string,
  fieldName: string
): void {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`)
  }
}

/* ============================================
   RAISE A QUERY
   ============================================ */

export async function submitSupportQuery(
  request: SupportQueryRequest
): Promise<SupportSubmissionResult> {
  requireText(request.subject, 'Subject')
  requireText(request.category, 'Category')
  requireText(request.description, 'Description')

  // Frontend preview only.
  // No backend request is made and nothing is stored.
  return {
    submitted: false,
    demo: true,
    message:
      'Query validated in demo mode. It has not been submitted or saved.'
  }
}

/* ============================================
   REPORT AN ISSUE
   ============================================ */

export async function submitIssueReport(
  request: IssueReportRequest
): Promise<SupportSubmissionResult> {
  requireText(request.title, 'Issue title')
  requireText(request.issueType, 'Issue type')
  requireText(request.severity, 'Severity')
  requireText(request.description, 'Description')

  // Frontend preview only.
  // No backend request is made and nothing is stored.
  return {
    submitted: false,
    demo: true,
    message:
      'Issue report validated in demo mode. It has not been submitted or saved.'
  }
}

/* ============================================
   ADMIN ACCESS
   ============================================ */

export async function getAdminAccessStatus():
  Promise<AdminAccessStatus> {
  const token = getToken()

  if (!token) {
    return {
      authenticated: false,
      isAdmin: false,
      role: null,
      message:
        'Admin access requires an authenticated account.'
    }
  }

  try {
    // Reuse your existing authenticated /api/auth/me call.
    const { getCurrentUser } = await import('./authService')
    const user = await getCurrentUser()

    const role = user.role ?? null
    const isAdmin = role?.toUpperCase() === 'ADMIN'

    return {
      authenticated: true,
      isAdmin,
      role,
      message: isAdmin
        ? 'Admin role verified. Dashboard access must also be authorised by the backend.'
        : 'This account does not have administrator privileges.'
    }
  } catch {
    return {
      authenticated: false,
      isAdmin: false,
      role: null,
      message:
        'Unable to verify administrator access.'
    }
  }
}

