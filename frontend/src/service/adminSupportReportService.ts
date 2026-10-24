
import { getToken } from './authService'

const BASE =
  'http://localhost:8080/api/admin/support-reports'

// ==========================================
// REPORT SUMMARY
// ==========================================

export type SupportReportSummary = {
  reports: number
  pendingReports: number
  upheldReports: number
  dismissedReports: number
}

// ==========================================
// REPORT DETAILS
// ==========================================

export type SupportReport = {
  id: number
  reportType: 'ISSUE' | 'USER'
  description: string
  status: 'PENDING' | 'UPHELD' | 'DISMISSED'

  reporterUserId: number
  reporterUsername: string

  reportedUserId: number | null
  reportedUsername: string | null

  resolutionNote: string | null
  resolvedBy: number | null
  createdAt: string
  resolvedAt: string | null
}

// ==========================================
// REQUEST HANDLER
// ==========================================

async function request<T>(
  path: string,
  method: 'GET' | 'PATCH' = 'GET',
  body?: unknown
): Promise<T> {
  const token = getToken()

  if (!token) {
    throw new Error('Please sign in again.')
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {})
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  })

  if (!response.ok) {
    const detail = await response.text()

    throw new Error(
      `Report API failed (${response.status}): ${detail}`
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

// ==========================================
// ADMIN / SUPERADMIN REPORT APIs
// ==========================================

export const adminSupportReportApi = {

  // Dashboard counters
  summary: () =>
    request<SupportReportSummary>('/summary'),

  // All reports visible to every Admin and SuperAdmin
  all: (status: 'ALL' | 'PENDING' | 'UPHELD' | 'DISMISSED' = 'ALL') =>
    request<SupportReport[]>(
      `?status=${encodeURIComponent(status)}`
    ),

  // Any Admin or SuperAdmin can resolve a pending report
  resolve: (
    id: number,
    decision: 'UPHELD' | 'DISMISSED',
    note: string
  ) =>
    request<SupportReport>(
      `/${id}/resolve`,
      'PATCH',
      {
        decision,
        note: note.trim()
      }
    )
}
