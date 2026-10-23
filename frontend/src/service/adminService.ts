import { getToken } from './authService'

const BASE = 'http://localhost:8080/api'

export type AdminOverview = {
  totalUsers: number
  totalPosts: number
  totalEvents: number
  pendingReports: number
  totalReports: number
}
export type AdminUser = {
  id: number
  fullName: string | null
  username: string
  email: string
  role: string
  active: boolean
  createdAt: string
}
export type AdminReport = {
  id: number
  reportedPostId: number
  reporterId: number
  reason: string
  status: 'PENDING' | 'UPHELD' | 'DISMISSED'
  assignedAdminId: number | null
  resolvedById: number | null
  resolutionNote: string | null
  createdAt: string
  resolvedAt: string | null
}
export type AdminActivity = {
  id: number
  actorId: number
  action: string
  targetType: string
  targetId: number | null
  details: string | null
  createdAt: string
}
export type PageResult<T> = { content: T[]; totalElements: number; totalPages: number; number: number }

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('Please log in to access Admin features.')
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    let detail = ''
    try {
      const error = await response.json() as { message?: string; detail?: string }
      detail = error.message || error.detail || ''
    } catch { /* not a JSON error */ }
    throw new Error(`Admin request failed (${response.status})${detail ? ': ' + detail : ''}`)
  }
  return response.json() as Promise<T>
}

export const adminApi = {
  overview: () => api<AdminOverview>('/admin/overview'),
  analytics: () => api<AdminOverview>('/admin/analytics'),
  users: (page = 0, size = 100) => api<PageResult<AdminUser>>(`/admin/users?page=${page}&size=${size}`),
  setUserActive: (id: number, active: boolean) => api<AdminUser>(`/admin/users/${id}/status`, {
    method: 'PATCH', body: JSON.stringify({ active }),
  }),
  reports: (page = 0, size = 100) => api<PageResult<AdminReport>>(`/admin/reports?page=${page}&size=${size}`),
  assignedReports: (page = 0, size = 100) => api<PageResult<AdminReport>>(`/admin/reports/assigned?page=${page}&size=${size}`),
  assignReport: (id: number, adminId: number) => api<AdminReport>(`/admin/reports/${id}/assign`, {
    method: 'PATCH', body: JSON.stringify({ adminId }),
  }),
  resolveReport: (id: number, decision: 'UPHELD' | 'DISMISSED', note = '') =>
    api<AdminReport>(`/admin/reports/${id}/resolve`, {
      method: 'PATCH', body: JSON.stringify({ decision, note }),
    }),
  activity: (page = 0, size = 100) => api<PageResult<AdminActivity>>(`/admin/activity?page=${page}&size=${size}`),
  reportPost: (postId: number, reason: string) => api<AdminReport>('/reports', {
    method: 'POST', body: JSON.stringify({ postId, reason }),
  }),
}
