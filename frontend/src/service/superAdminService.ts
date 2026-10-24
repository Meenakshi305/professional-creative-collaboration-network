import { getToken } from './authService'

const BASE = 'http://localhost:8080/api'
export type PageData<T> = { content: T[]; totalElements: number; totalPages: number; number: number }
export type ManagedUser = { id: number; fullName: string | null; username: string; email: string; role: string; active: boolean; createdAt: string }
export type Report = { id: number; reportedPostId: number; reporterId: number; reason: string; status: string; assignedAdminId: number | null; resolvedById: number | null; resolutionNote: string | null; createdAt: string; resolvedAt: string | null }
export type AuditEntry = { id: number; actorId: number; action: string; targetType: string; targetId: number | null; details: string | null; createdAt: string }
export type Totals = { users: number; administrators: number; posts: number; events: number; reports: number; pendingReports: number; upheldReports: number; dismissedReports: number }
export type ModuleSetting = { moduleKey: string; enabled: boolean; changedById: number | null }
export type ContentItem = { id: number; title: string; type: string; ownerId: number }
export type AccountInput = { fullName: string; username: string; email: string; temporaryPassword: string; dateOfBirth?: string | null; role: 'USER' | 'ADMIN' }
export type AnalyticsMode = 'admin' | 'superadmin'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('Please log in before using management features.')
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  })
  if (!res.ok) {
    let message = ''
    try { const data = await res.json() as { detail?: string; message?: string }; message = data.detail || data.message || '' } catch { /* empty response */ }
    throw new Error(`${res.status} ${res.statusText}${message ? `: ${message}` : ''}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
const body = (value: unknown) => JSON.stringify(value)
const page = (n = 0, size = 100) => `?page=${n}&size=${size}`

export type DailyPostingPoint = {
  date: string; posts: number; activeUsers: number; maxPostsPerUser: number
}
export type PostingUser = { userId: number; username: string; posts: number }
export type DailyMaximum = PostingUser & { date: string }
export type PostMonitoring = {
  days: number; timezone: string; from: string; through: string
  totalPosts: number; uniquePosters: number; postsToday: number; activePostersToday: number
  maximumSingleDay: DailyMaximum | null
  mostActiveUser: PostingUser | null
  daily: DailyPostingPoint[]; topUsers: PostingUser[]
}

export type LikedUser = { userId: number; username: string; likesReceived: number }
export type DailyLikesPoint = { date: string; totalLikes: number; winner: LikedUser | null }
export type DailyLikesMonitoring = {
  timezone: string; from: string; through: string
  mostLikedToday: LikedUser | null
  daily: DailyLikesPoint[]
  topUsersToday: LikedUser[]
}

// Both roles use the same response mapping and chart components.
type BackendLikesResponse = {
  startDate?: string
  endDate?: string
  from?: string
  through?: string
  timezone?: string
  mostLikedUserToday?: LikedUser | null
  mostLikedToday?: LikedUser | null
  dailyLikes?: { date: string; totalLikes: number }[]
  daily?: DailyLikesPoint[]
  topUsersToday?: LikedUser[]
  dailyWinners?: { date: string; userId: number; username: string; likesReceived: number }[]
}

function analyticsPath(mode: AnalyticsMode): string {
  return mode === 'admin' ? '/admin/analytics' : '/superadmin/analytics'
}

async function loadDailyLikesMonitoring(
  mode: AnalyticsMode = 'superadmin'
): Promise<DailyLikesMonitoring> {
  const data = await request<BackendLikesResponse>(`${analyticsPath(mode)}/likes/daily?days=7`)
  if (!Array.isArray(data.dailyLikes) && !Array.isArray(data.daily)) {
    throw new Error('Likes response missing dailyLikes; check the deployed backend controller.')
  }
  const winners = Array.isArray(data.dailyWinners) ? data.dailyWinners : []
  const points = Array.isArray(data.dailyLikes) ? data.dailyLikes : (data.daily ?? [])
  return {
    timezone: data.timezone ?? 'Server local time',
    from: data.startDate ?? data.from ?? points[0]?.date ?? '',
    through: data.endDate ?? data.through ?? points[points.length - 1]?.date ?? '',
    mostLikedToday: data.mostLikedUserToday ?? data.mostLikedToday ?? null,
    daily: points.map(point => ({
      date: point.date,
      totalLikes: Number(point.totalLikes ?? 0),
      winner: ('winner' in point ? point.winner as LikedUser | null : undefined)
        ?? winners.find(w => w.date === point.date) ?? null,
    })),
    topUsersToday: Array.isArray(data.topUsersToday) ? data.topUsersToday : [],
  }
}

export const superAdminApi = {
  dailyLikesMonitoring: loadDailyLikesMonitoring,
  postMonitoring: (mode: AnalyticsMode = 'superadmin') => request<PostMonitoring>(`${analyticsPath(mode)}/posts/monitor?days=7`),
  overview: () => request<Totals>('/superadmin/overview'),
  analytics: () => request<Totals>('/superadmin/analytics'),
  users: (n = 0) => request<PageData<ManagedUser>>(`/superadmin/users${page(n)}`),
  admins: () => request<ManagedUser[]>('/superadmin/admins/search'),
  changeRole: (id: number, role: 'USER' | 'ADMIN') => request<ManagedUser>(`/superadmin/users/${id}/role`, { method: 'PATCH', body: body({ role }) }),
  setActive: (id: number, active: boolean) => request<ManagedUser>(`/superadmin/users/${id}/status`, { method: 'PATCH', body: body({ active }) }),
  createAccount: (account: AccountInput) => request<ManagedUser>('/admin/accounts', { method: 'POST', body: body(account) }),
  reports: (n = 0) => request<PageData<Report>>(`/superadmin/reports${page(n)}`),
  assignReport: (id: number, adminId: number) => request<Report>(`/superadmin/reports/${id}/assign`, { method: 'PATCH', body: body({ adminId }) }),
  resolveReport: (id: number, decision: 'UPHELD' | 'DISMISSED', note: string) => request<Report>(`/admin/reports/${id}/resolve`, { method: 'PATCH', body: body({ decision, note }) }),
  audit: (n = 0) => request<PageData<AuditEntry>>(`/superadmin/audit${page(n)}`),
  modules: () => request<ModuleSetting[]>('/superadmin/modules'),
  setModule: (key: string, enabled: boolean) => request<ModuleSetting>(`/superadmin/modules/${encodeURIComponent(key)}`, { method: 'PUT', body: body({ enabled }) }),
  health: () => request<{ status: string; database: string; userCount: number; serverTime: string }>('/superadmin/system/health'),
  content: (type: 'posts' | 'events' | 'opportunities', n = 0) => request<PageData<ContentItem>>(`/admin/content/${type}${page(n)}`),
  removeContent: (type: 'posts' | 'events' | 'opportunities', id: number, reason: string) => request<{ outcome: string }>(`/admin/content/${type}/${id}`, { method: 'DELETE', body: body({ reason }) }),
}
