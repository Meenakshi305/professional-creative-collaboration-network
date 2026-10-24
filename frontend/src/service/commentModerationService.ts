import { getToken } from './authService'

const API = 'http://localhost:8080/api'
export type CommentReport = {
  id: number; postId: number; commentId: number; reporterId: number;
  reason: string; status: string; assignedAdminId: number | null;
  resolutionNote: string | null; createdAt: string
}
export type Page<T> = { content: T[]; totalElements: number; totalPages: number }
export type CommentPreview = { id: number; postId: number; authorId: number; content: string }

async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('Please log in again')
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`)
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}
export const commentModerationApi = {
  report: (postId: number, commentId: number, reason: string) =>
    request<CommentReport>(`/posts/${postId}/comments/${commentId}/report`, 'POST', { reason }),
  reports: (page = 0, status?: string) =>
    request<Page<CommentReport>>(`/admin/comment-reports?page=${page}&size=20${status ? `&status=${encodeURIComponent(status)}` : ''}`),
  assigned: () => request<Page<CommentReport>>('/admin/comment-reports/assigned?size=50'),
  preview: (id: number) => request<CommentPreview>(`/admin/comment-reports/${id}/comment`),
  assign: (id: number, adminId: number) => request<CommentReport>(`/admin/comment-reports/${id}/assign`, 'PATCH', { adminId }),
  resolve: (id: number, decision: 'UPHELD'|'DISMISSED', note: string) =>
    request<CommentReport>(`/admin/comment-reports/${id}/resolve`, 'PATCH', { decision, note }),
  remove: (id: number, reason: string) =>
    request<void>(`/admin/comment-reports/${id}/remove-comment`, 'POST', { reason })
}
