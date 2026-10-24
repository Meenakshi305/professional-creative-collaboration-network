
import { getToken } from './authService'

const BASE = 'http://localhost:8080/api/admin/support-reports'

export type ReportStatus = 'PENDING' | 'UPHELD' | 'DISMISSED'

export type SupportReportSummary = {
  reports: number
  pendingReports: number
  upheldReports: number
  dismissedReports: number
}

export type SupportReport = {
  id: number
  reportType: 'ISSUE' | 'USER'
  description: string
  status: ReportStatus

  reporterUserId: number
  reporterUsername: string

  reportedUserId: number | null
  reportedUsername: string | null

  resolutionNote: string | null
  resolvedBy: number | null

  createdAt: string
  resolvedAt: string | null
}

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
    const details = await response.text()

    throw new Error(
      `Settings report request failed (${response.status}): ${details}`
    )
  }

  return response.json() as Promise<T>
}

export const adminSupportReportApi = {

  summary: () =>
    request<SupportReportSummary>('/summary'),

  all: (
    status: 'ALL' | ReportStatus = 'ALL'
  ) =>
    request<SupportReport[]>(
      `?status=${encodeURIComponent(status)}`
    ),

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
