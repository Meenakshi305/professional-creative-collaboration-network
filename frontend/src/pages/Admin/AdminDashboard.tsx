import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  adminApi,
  type AdminUser,
  type AdminOverview,
  type AdminActivity
} from '../../service/adminService'
import SupportReportsPanel from './SupportReportsPanel'
import FlaggedCommentsPanel from './FlaggedCommentsPanel'
import './AdminDashboard.css'
import LiveAnalyticsCharts from '../SuperAdmin/LiveAnalyticsCharts'
import { adminSupportReportApi, type SupportReportSummary } from '../../service/adminSupportReportService'

export type Section = 'overview' | 'reports' | 'users' | 'analytics' | 'moderation' | 'activity'

type Props = {
  activeSection: Section
  onSectionChange: (section: Section) => void
}

const titles: Record<Section, string> = {
  overview: 'Admin Overview',
  reports: 'Reports',
  users: 'Manage Users',
  analytics: 'Analytics',
  moderation: 'Content Moderation',
  activity: 'Activity Logs'
}

function friendlyError(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load data'
}


export default function AdminDashboard({ activeSection, onSectionChange }: Props) {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [reportSummary, setReportSummary] = useState<SupportReportSummary | null>(null)
  const [administratorCount, setAdministratorCount] = useState<number | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [activity, setActivity] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (activeSection === 'overview' || activeSection === 'analytics') {
        setOverview(activeSection === 'overview'
          ? await adminApi.overview()
          : await adminApi.analytics())
        if (activeSection === 'analytics') {
          const [summary, admins] = await Promise.allSettled([
            adminSupportReportApi.summary(),
            adminApi.users(0, 100)
          ])
          if (summary.status === 'fulfilled') setReportSummary(summary.value)
          if (admins.status === 'fulfilled') {
            const listing = admins.value
            setAdministratorCount(listing.totalElements <= listing.content.length
              ? listing.content.filter(u => ['ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(u.role)).length
              : null)
          }
        }
      }
      if (activeSection === 'users') {
        const result = await adminApi.users(0, 100)
        setUsers(result.content)
      }
      if (activeSection === 'activity') {
        const result = await adminApi.activity(0, 100)
        setActivity(result.content)
      }
      setUpdatedAt(new Date())
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [activeSection])

  useEffect(() => { void refresh() }, [refresh])

  const filteredUsers = useMemo(() => users.filter(user => {
    const matchesStatus = statusFilter === 'ALL'
      || (statusFilter === 'ACTIVE' ? user.active : !user.active)
    const query = searchTerm.toLowerCase()
    const matchesSearch = !query || [user.fullName, user.username, user.email, user.role, user.id]
      .some(value => String(value ?? '').toLowerCase().includes(query))
    return matchesStatus && matchesSearch
  }), [users, statusFilter, searchTerm])

  async function toggleUser(user: AdminUser) {
    if (!window.confirm(`${user.active ? 'Deactivate' : 'Activate'} @${user.username}?`)) return
    setSavingId(user.id)
    setError('')
    setNotice('')
    try {
      await adminApi.setUserActive(user.id, !user.active)
      const data = await adminApi.users(0, 100)
      setUsers(data.content)
      setNotice(`Account ${user.active ? 'deactivated' : 'activated'} successfully.`)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSavingId(null)
    }
  }

  const metric = (title: string, value: number) => (
    <article className="admin-live-metric" key={title}>
      <span>{title}</span><strong>{value.toLocaleString()}</strong>
    </article>
  )

  return (
    <div className="admin-live">
      <style>{`
        .admin-live { padding: 24px 30px; color: #282454; }
        .admin-live-header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
        .admin-live-header h1 { margin:0; font-size:clamp(25px,3vw,38px); }
        .admin-live-header p { margin:6px 0 0; color:#625f83; }
        .admin-live-card { background:#fff; padding:22px; border:1px solid #e9e6f6; border-radius:16px; margin:0 0 20px; }
        .admin-live-card h2 { font-size:19px; margin:0 0 7px; }
        .admin-live-note { color:#74718a; margin:0 0 16px; font-size:13px; }
        .admin-live-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:16px; margin:0 0 20px; }
        .admin-live-metric { background:#fff; border:1px solid #e9e6f6; border-radius:14px; padding:20px; }
        .admin-live-metric span { display:block; color:#696588; font-size:13px; }
        .admin-live-metric strong { display:block; font-size:28px; margin-top:8px; }
        .admin-live-toolbar { display:flex; flex-wrap:wrap; gap:10px; margin:16px 0; align-items:center; }
        .admin-live-toolbar input { flex:1; min-width:180px; }
        .admin-live input, .admin-live select, .admin-live textarea { background:#fff; color:#282454; border:1px solid #dcd6f6; border-radius:9px; padding:10px 12px; }
        .admin-live button { background:#f6f3ff; border:1px solid #dcd6f6; color:#4e4189; padding:10px 15px; font-weight:600; border-radius:9px; cursor:pointer; }
        .admin-live button:hover:not(:disabled) { background:#e9e1ff; }
        .admin-live button:disabled { opacity:.5; cursor:not-allowed; }
        .admin-live .admin-live-primary { background:#7060cd; border-color:#7060cd; color:#fff; }
        .admin-live-tablewrap { max-width:100%; overflow-x:auto; }
        .admin-live table { width:100%; border-collapse:collapse; text-align:left; font-size:14px; }
        .admin-live th,.admin-live td { padding:13px 12px; border-bottom:1px solid #ece9f4; }
        .admin-live th { background:#f7f5fd; }
        .admin-live-error { color:#af2525; background:#fff1f1; padding:12px; border-radius:9px; }
        .admin-live-success { color:#11633a; background:#eaf9ef; padding:12px; border-radius:9px; }
        .admin-live-status { font-weight:700; }
        .admin-live-modal-backdrop { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#10102399; z-index:10000; padding:16px; }
        .admin-live-modal { background:white; border-radius:14px; padding:24px; width:min(100%,520px); }
        .admin-live-modal label { display:block; margin:15px 0 6px; font-weight:600; }
        .admin-live-modal textarea,.admin-live-modal select { width:100%; box-sizing:border-box; }
        .admin-live-modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:18px; }
        .admin-live-analytics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:18px; }
        .admin-live-chart-row {display:grid;grid-template-columns:80px minmax(100px,1fr) 50px;gap:10px;align-items:center;margin:16px 0;font-size:13px}
        .admin-live-chart-track {height:14px;background:#eeebf6;border-radius:20px;overflow:hidden}
        .admin-live-chart-track div {height:100%;border-radius:20px}
        .admin-live-donut-wrap {display:flex;align-items:center;gap:22px;flex-wrap:wrap}
        .admin-live-donut {width:160px;height:160px;border-radius:50%;display:grid;place-items:center}
        .admin-live-donut>div {width:110px;height:110px;background:#fff;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .admin-live-donut strong {font-size:28px}
        .admin-live-donut small {font-size:12px}
        @media(max-width:600px) { .admin-live { padding:16px; } }
      `}</style>

      <header className="admin-live-header">
        <div>
          <h1>{titles[activeSection]}</h1>
          <p>Creative Network · Admin workspace</p>
        </div>
        <div className="admin-live-toolbar">
          {updatedAt && <small>Updated {updatedAt.toLocaleTimeString()}</small>}
          <button type="button" disabled={loading} onClick={() => void refresh()}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </header>
      {error && <p className="admin-live-error" role="alert">{error}</p>}
      {notice && <p className="admin-live-success" role="status">{notice}</p>}

      {(activeSection === 'overview' || activeSection === 'analytics') && (
        <>
          <div className="admin-live-grid">
            {overview && <>
              {metric('Total users', overview.totalUsers)}
              {metric('Total posts', overview.totalPosts)}
              {metric('Total events', overview.totalEvents)}
              {metric('Pending reports', overview.pendingReports)}
              {metric('Total reports', overview.totalReports)}
            </>}
          </div>
          {activeSection === 'analytics' && overview && (
            <>
              <section className="admin-live-card">
                <h2>Platform Analytics</h2>
                <p className="admin-live-note">Live totals from Admin endpoints and the shared Settings Reports summary.</p>
              </section>
              {administratorCount === null && <p className="admin-live-note">Administrator count is unavailable or the user list is paginated; chart currently displays 0 for that metric.</p>}
              <LiveAnalyticsCharts data={{
                users: overview.totalUsers,
                posts: overview.totalPosts,
                events: overview.totalEvents,
                administrators: administratorCount ?? 0,
                reports: reportSummary?.reports ?? overview.totalReports,
                pendingReports: reportSummary?.pendingReports ?? overview.pendingReports,
                upheldReports: reportSummary?.upheldReports ?? 0,
                dismissedReports: reportSummary?.dismissedReports ?? 0
              }} />
            </>
          )}
          {activeSection === 'overview' && (
            <section className="admin-live-card">
              <h2>Overview</h2>
              <p className="admin-live-note">Live totals returned by the Admin backend.</p>
              <button type="button" onClick={() => onSectionChange('reports')}>Open reports</button>
            </section>
          )}
        </>
      )}

      {activeSection === 'users' && (
        <section className="admin-live-card">
          <h2>Manage Users</h2>
          <p className="admin-live-note">Search and manage user account status. Administrator roles cannot be changed here.</p>
          <form className="admin-live-toolbar" onSubmit={event => { event.preventDefault(); setSearchTerm(searchInput.trim()) }}>
            <input aria-label="Search users" placeholder="Search name, username or email" value={searchInput} onChange={event => setSearchInput(event.target.value)} />
            <button className="admin-live-primary" type="submit">Search</button>
            <button type="button" onClick={() => { setSearchInput(''); setSearchTerm('') }}>Clear</button>
            <select aria-label="User status" value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
            </select>
          </form>
          <div className="admin-live-tablewrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.fullName || user.username}</strong><div><small>@{user.username} · #{user.id}</small></div></td>
                    <td>{user.email}</td><td>{user.role}</td>
                    <td className="admin-live-status">{user.active ? 'Active' : 'Inactive'}</td>
                    <td>{user.role.replace(/^ROLE_/, '') === 'USER' ?
                      <button disabled={savingId === user.id} type="button" onClick={() => void toggleUser(user)}>{user.active ? 'Deactivate' : 'Activate'}</button>
                      : <span>Protected</span>}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && <tr><td colSpan={5}>No matching users found.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="admin-live-note">Search covers the first 100 users returned by the API.</p>
        </section>
      )}

      {activeSection === 'reports' && (
        <>
          <SupportReportsPanel mode="admin" />
          <FlaggedCommentsPanel />
        </>
      )}

      {activeSection === 'moderation' && (
        <>
          <section className="admin-live-card">
            <h2>Content Moderation</h2>
            <p className="admin-live-note">
              Shared moderation queue for both Admin and SuperAdmin. Review settings complaints,
              confirm comment violations and remove flagged comments. Administrator role management
              and SuperAdmin-only content-deletion controls are intentionally unavailable here.
            </p>
          </section>
          <SupportReportsPanel mode="admin" />
          <FlaggedCommentsPanel />
        </>
      )}

      {activeSection === 'activity' && (
        <section className="admin-live-card"><h2>Admin Audit Logs</h2>
          <div className="admin-live-tablewrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
            <tbody>{activity.map(item => <tr key={item.id}><td>{item.createdAt}</td><td>#{item.actorId}</td><td>{item.action}</td><td>{item.targetType} #{item.targetId ?? '—'}</td><td>{item.details ?? '—'}</td></tr>)}
              {activity.length === 0 && <tr><td colSpan={5}>No activity found.</td></tr>}
            </tbody></table></div>
        </section>
      )}


    </div>
  )
}
