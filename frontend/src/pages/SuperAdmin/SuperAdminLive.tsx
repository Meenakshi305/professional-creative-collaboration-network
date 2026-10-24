import { useCallback, useEffect, useState } from 'react'
import { superAdminApi, type ManagedUser, type Report, type Totals, type AuditEntry, type ModuleSetting, type ContentItem, type PostMonitoring, type DailyLikesMonitoring } from '../../service/superAdminService'
import './SuperAdminLive.css'
import { adminApi, type AdminUser, type AdminActivity } from '../../service/adminService'
import { adminSupportReportApi } from '../../service/adminSupportReportService'
import SupportReportsPanel from '../Admin/SupportReportsPanel'
import FlaggedCommentsPanel from '../Admin/FlaggedCommentsPanel'

type Tab = 'overview' | 'users' | 'admins' | 'reports' | 'content' | 'analytics' | 'modules' | 'audit' | 'system'
type ContentType = 'posts' | 'events' | 'opportunities'
const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'users', label: 'Users' }, { id: 'admins', label: 'Manage Admins' },
  { id: 'reports', label: 'Reports' }, { id: 'content', label: 'Moderation' },
  { id: 'analytics', label: 'Analytics' }, { id: 'modules', label: 'Modules' }, { id: 'audit', label: 'Audit Logs' }, { id: 'system', label: 'System' },
]

// Charts use only the totals returned by /api/superadmin/analytics.
// No fabricated time-series values or sample data.
function LiveAnalyticsCharts({ data }: { data: Totals }) {
  const content = [
    { label: 'Users', value: data.users, color: '#7566d2' },
    { label: 'Posts', value: data.posts, color: '#579fc5' },
    { label: 'Events', value: data.events, color: '#d18c9a' },
    { label: 'Administrators', value: data.administrators, color: '#4d9388' },
  ]
  const max = Math.max(1, ...content.map(item => item.value))
  const reportSegments = [
    { label: 'Pending', value: data.pendingReports, color: '#e4ab61' },
    { label: 'Upheld', value: data.upheldReports, color: '#7566d2' },
    { label: 'Dismissed', value: data.dismissedReports, color: '#579fc5' },
  ]
  const totalDecided = reportSegments.reduce((sum, item) => sum + item.value, 0)
  const unknown = Math.max(0, data.reports - totalDecided)
  if (unknown) reportSegments.push({ label: 'Other', value: unknown, color: '#a6a1b8' })
  const denominator = Math.max(1, data.reports, totalDecided)
  let progress = 0
  const stops = reportSegments.map(segment => {
    const from = progress
    progress += segment.value / denominator * 100
    return `${segment.color} ${from}% ${progress}%`
  })
  const donutBackground = data.reports > 0
    ? `conic-gradient(${stops.join(', ')})`
    : 'conic-gradient(#e5e1ee 0% 100%)'

  return (
    <div className="cn-sa-chart-grid">
      <div className="cn-sa-card cn-sa-chart-card">
        <h2>Platform totals</h2>
        <p className="cn-sa-note">Current records, not monthly growth</p>
        <div className="cn-sa-chart-bars" role="img" aria-label={content.map(item => `${item.label}: ${item.value}`).join(', ')}>
          {content.map(item => (
            <div className="cn-sa-chart-row" key={item.label}>
              <span>{item.label}</span>
              <div className="cn-sa-chart-track">
                <div className="cn-sa-chart-fill" style={{ width: `${item.value / max * 100}%`, backgroundColor: item.color }} />
              </div>
              <strong>{item.value.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="cn-sa-card cn-sa-chart-card">
        <h2>Report status breakdown</h2>
        <p className="cn-sa-note">Current reported content decisions</p>
        <div className="cn-sa-donut-wrap">
          <div className="cn-sa-donut" role="img" aria-label={`Total reports: ${data.reports}`} style={{ background: donutBackground }}>
            <div className="cn-sa-donut-hole"><strong>{data.reports.toLocaleString()}</strong><span>Reports</span></div>
          </div>
          <div className="cn-sa-chart-legend">
            {reportSegments.map(segment => (
              <div className="cn-sa-legend-item" key={segment.label}>
                <span className="cn-sa-legend-dot" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span><strong>{segment.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


export default function SuperAdminLive({ mode = 'superadmin' }: { mode?: 'admin' | 'superadmin' }) {
  const isSuperAdmin = mode === 'superadmin'
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminAudit, setAdminAudit] = useState<AdminActivity[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [totals, setTotals] = useState<Totals | null>(null)
  const [analytics, setAnalytics] = useState<Totals | null>(null)
  const [postMonitoring, setPostMonitoring] = useState<PostMonitoring | null>(null)
  const [likesMonitoring, setLikesMonitoring] = useState<DailyLikesMonitoring | null>(null)
  const [likesError, setLikesError] = useState('')
  const [postingError, setPostingError] = useState('')
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [admins, setAdmins] = useState<ManagedUser[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [modules, setModules] = useState<ModuleSetting[]>([])
  const [health, setHealth] = useState<{status: string; database: string; userCount: number; serverTime: string} | null>(null)
  const [contentType, setContentType] = useState<ContentType>('posts')
  const [items, setItems] = useState<ContentItem[]>([])

  const refresh = useCallback(async () => {
    setBusy(true); setError('')
    try {
      if (!isSuperAdmin) {
        if (tab === 'overview' || tab === 'analytics') {
          const [base, reports, people] = await Promise.all([
            adminApi.overview(),
            adminSupportReportApi.summary().catch(() => null),
            adminApi.users(0, 200)
          ])
          const allPeople = people.content
          const elevated = allPeople.filter(u => ['ADMIN', 'SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(u.role)).length
          const data: Totals = {
            users: base.totalUsers,
            posts: base.totalPosts,
            events: base.totalEvents,
            administrators: elevated,
            reports: reports?.reports ?? base.totalReports,
            pendingReports: reports?.pendingReports ?? base.pendingReports,
            upheldReports: reports?.upheldReports ?? 0,
            dismissedReports: reports?.dismissedReports ?? 0
          } as Totals
          if (tab === 'overview') setTotals(data)
          else setAnalytics(data)
          if (tab === 'analytics') {
            const [posting, likes] = await Promise.allSettled([
              superAdminApi.postMonitoring('admin'),
              superAdminApi.dailyLikesMonitoring('admin')
            ])
            if (posting.status === 'fulfilled') {
              setPostMonitoring(posting.value)
              setPostingError('')
            } else {
              setPostMonitoring(null)
              setPostingError(posting.reason instanceof Error ? posting.reason.message : 'Posting analytics unavailable')
            }
            if (likes.status === 'fulfilled') {
              setLikesMonitoring(likes.value)
              setLikesError('')
            } else {
              setLikesMonitoring(null)
              setLikesError(likes.reason instanceof Error ? likes.reason.message : 'Likes analytics unavailable')
            }
          }
          if (people.totalElements > allPeople.length) {
            setNotice('Administrator count reflects the first page of users only.')
          }
        }
        // Shared moderation endpoints live under /api/admin/content and
        // must accept both roles on the backend.
        if (tab === 'content') setItems((await superAdminApi.content(contentType)).content)
        if (tab === 'users') setAdminUsers((await adminApi.users(0, 200)).content)
        if (tab === 'audit') setAdminAudit((await adminApi.activity(0, 200)).content)
        return
      }
      if (tab === 'overview') setTotals(await superAdminApi.overview())
      if (tab === 'analytics') {
        const [platform, posting] = await Promise.all([superAdminApi.analytics(), superAdminApi.postMonitoring()])
        setAnalytics(platform)
        setPostMonitoring(posting)
        // Keep posting analytics usable if the likes table is not yet mapped.
        try {
          setLikesMonitoring(await superAdminApi.dailyLikesMonitoring())
          setLikesError('')
        } catch (err) {
          setLikesMonitoring(null)
          setLikesError(err instanceof Error ? err.message : 'Unable to fetch daily likes')
        }
      }
      if (tab === 'users') setUsers((await superAdminApi.users()).content)
      if (tab === 'admins') setAdmins(await superAdminApi.admins())
      if (tab === 'reports') {
        const [rs, as] = await Promise.allSettled([superAdminApi.reports(), superAdminApi.admins()])
        setReports(rs.status === 'fulfilled' ? rs.value.content : [])
        setAdmins(as.status === 'fulfilled' ? as.value : [])
      }
      if (tab === 'content') setItems((await superAdminApi.content(contentType)).content)
      if (tab === 'modules') setModules(await superAdminApi.modules())
      if (tab === 'audit') setAudit((await superAdminApi.audit()).content)
      if (tab === 'system') setHealth(await superAdminApi.health())
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load data') }
    finally { setBusy(false) }
  }, [tab, contentType, isSuperAdmin])
  useEffect(() => { void refresh() }, [refresh])

  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setNotice('')
    try { await action(); setNotice(success); await refresh() }
    catch (err) { setError(err instanceof Error ? err.message : 'Request failed') }
    finally { setBusy(false) }
  }
  function confirmRemoval(item: ContentItem) {
    const reason = window.prompt(`Permanent removal of ${item.type} #${item.id}. Enter a reason (minimum 10 characters):`)
    if (!reason || reason.trim().length < 10) return
    if (!window.confirm(`This permanently deletes ${item.type} #${item.id} and may affect linked data. Continue?`)) return
    void run(() => superAdminApi.removeContent(contentType, item.id, reason.trim()), 'Content removed')
  }

  return <div className="cn-sa-layout">
    <aside className="cn-sa-sidebar" aria-label={`${mode} sidebar`}>
      <div className="cn-sa-sidebar-brand">
        <strong>{isSuperAdmin ? 'SuperAdmin' : 'Admin'}</strong>
        <small>Creative Network</small>
      </div>
      <nav className="cn-sa-tabs" aria-label="SuperAdmin sections">
        {tabs.filter(t => isSuperAdmin || !['admins','modules','system'].includes(t.id)).map(t => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'selected' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </aside>
    <section className="cn-sa-panel">
      <header className="cn-sa-header"><div><h1>{isSuperAdmin ? 'SuperAdmin Workspace' : 'Admin Workspace'}</h1><p>Creative Network • Live management</p></div><button type="button" disabled={busy} onClick={() => void refresh()}>Refresh</button></header>
    {error && <p className="cn-sa-error" role="alert">{error}</p>}{notice && <p className="cn-sa-success" role="status">{notice}</p>}
    {busy && <p className="cn-sa-loading">Loading or saving…</p>}
    {tab === 'overview' && <div className="cn-sa-grid">{totals && Object.entries(totals).map(([k,v]) => <div className="cn-sa-card" key={k}><span>{k.replace(/([A-Z])/g,' $1')}</span><strong>{v}</strong></div>)}</div>}
    {tab === 'analytics' && (
      <section aria-label="Live platform analytics">
        <div className="cn-sa-card">
          <h2>Platform Analytics</h2>
          <p className="cn-sa-note">Charts and totals use live values from authorized analytics endpoints. Monthly trends require a separate historical endpoint.</p>
        </div>
        {analytics && (
          <>
          <LiveAnalyticsCharts data={analytics} />
          <div className="cn-sa-grid">
            {Object.entries(analytics).map(([key, value]) => (
              <div className="cn-sa-card" key={key}>
                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, letter => letter.toUpperCase())}</span>
                <strong>{value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
          </>
        )}
        {postMonitoring && (
          <section className="cn-sa-post-monitor" aria-label="Seven-day posting monitoring">
            <div className="cn-sa-card">
              <h2>User posting monitoring — 7 days</h2>
              <p className="cn-sa-note">Real database posts from {postMonitoring.from} through {postMonitoring.through} ({postMonitoring.timezone}). No posting limits are imposed.</p>
            </div>
            <div className="cn-sa-grid">
              <div className="cn-sa-card"><span>Posts today</span><strong>{postMonitoring.postsToday}</strong></div>
              <div className="cn-sa-card"><span>Posting users today</span><strong>{postMonitoring.activePostersToday}</strong></div>
              <div className="cn-sa-card"><span>Posts over 7 days</span><strong>{postMonitoring.totalPosts}</strong></div>
              <div className="cn-sa-card"><span>Unique posters (7 days)</span><strong>{postMonitoring.uniquePosters}</strong></div>
            </div>
            <div className="cn-sa-chart-grid">
              <div className="cn-sa-card">
                <h2>Posts and active users each day</h2>
                <div className="cn-sa-post-chart" role="img" aria-label={postMonitoring.daily.map(d => `${d.date}: ${d.posts} posts from ${d.activeUsers} users`).join('; ')}>
                  {postMonitoring.daily.map(d => {
                    const max = Math.max(1, ...postMonitoring.daily.map(x => x.posts), ...postMonitoring.daily.map(x => x.activeUsers))
                    return <div key={d.date} className="cn-sa-post-day">
                      <span>{d.date.slice(5)}</span>
                      <div className="cn-sa-post-track"><div className="cn-sa-post-fill-posts" style={{width: `${100 * d.posts / max}%`}} /></div>
                      <strong>{d.posts}</strong>
                      <div className="cn-sa-post-track"><div className="cn-sa-post-fill-users" style={{width: `${100 * d.activeUsers / max}%`}} /></div>
                      <small>{d.activeUsers} users</small>
                    </div>
                  })}
                </div>
                <p className="cn-sa-note">Violet = posts, blue = unique posting users</p>
              </div>
              <div className="cn-sa-card">
                <h2>Maximum posts by one user in a day</h2>
                {postMonitoring.maximumSingleDay ? <>
                  <strong className="cn-sa-highlight">{postMonitoring.maximumSingleDay.posts}</strong>
                  <p>@{postMonitoring.maximumSingleDay.username} on {postMonitoring.maximumSingleDay.date}</p>
                </> : <p>No posts in the selected period.</p>}
                <h2>Most active user — total over 7 days</h2>
                {postMonitoring.mostActiveUser ? <p>@{postMonitoring.mostActiveUser.username}: <strong>{postMonitoring.mostActiveUser.posts} posts</strong></p> : <p>No posting users.</p>}
              </div>
            </div>
            <div className="cn-sa-card"><h2>Top 10 posting users — 7 days</h2>
              <div className="cn-sa-tablewrap"><table><thead><tr><th>Rank</th><th>User</th><th>Posts</th></tr></thead>
                <tbody>{postMonitoring.topUsers.map((user, index) => <tr key={user.userId}><td>{index + 1}</td><td>@{user.username}</td><td>{user.posts}</td></tr>)}</tbody>
              </table></div>
              {postMonitoring.topUsers.length === 0 && <p>No posts created in this period.</p>}
            </div>
          </section>
        )}
        {<section className="cn-sa-post-monitor" aria-label="Most liked users monitoring">
          <div className="cn-sa-card">
            <h2>Most liked users — daily</h2>
            <p className="cn-sa-note">Likes received on a user's posts during each day, not likes they clicked. Ranking is by likes received today.</p>
            {likesError && <p className="cn-sa-error" role="alert">Likes analytics unavailable: {likesError}</p>}
            {likesMonitoring && <>
              <h3>Most liked user today</h3>
              {likesMonitoring.mostLikedToday
                ? <p><strong>@{likesMonitoring.mostLikedToday.username}</strong> — {likesMonitoring.mostLikedToday.likesReceived} likes received</p>
                : <p>No likes recorded today.</p>}
              <div className="cn-sa-chart-grid">
                <div className="cn-sa-card">
                  <h3>Likes received per day — last 7 days</h3>
                  <div className="cn-sa-post-chart" role="img" aria-label={likesMonitoring.daily.map(p => `${p.date}: ${p.totalLikes} likes`).join('; ')}>
                    {likesMonitoring.daily.map(p => {
                      const max = Math.max(1, ...likesMonitoring.daily.map(x => x.totalLikes))
                      return <div key={p.date} className="cn-sa-post-day">
                        <span>{p.date.slice(5)}</span>
                        <div className="cn-sa-post-track"><div className="cn-sa-post-fill-posts" style={{width: `${p.totalLikes / max * 100}%`}} /></div>
                        <strong>{p.totalLikes}</strong>
                        <small>{p.winner ? `Top: @${p.winner.username} (${p.winner.likesReceived})` : 'No likes'}</small>
                      </div>
                    })}
                  </div>
                </div>
                <div className="cn-sa-card">
                  <h3>Top 10 most liked users today</h3>
                  <div className="cn-sa-tablewrap"><table>
                    <thead><tr><th>Rank</th><th>User</th><th>Likes received</th></tr></thead>
                    <tbody>{likesMonitoring.topUsersToday.map((u, i) =>
                      <tr key={u.userId}><td>{i + 1}</td><td>@{u.username}</td><td>{u.likesReceived}</td></tr>)}</tbody>
                  </table></div>
                  {!likesMonitoring.topUsersToday.length && <p>No likes recorded today.</p>}
                </div>
              </div>
            </>}
          </div>
        </section>}
        {postingError && <p className="cn-sa-error">Posting analytics unavailable: {postingError}</p>}
        {!analytics && !busy && !error && <p>No analytics data returned.</p>}
      </section>
    )}
    {!isSuperAdmin && tab === 'users' && <div className="cn-sa-card">
      <div className="cn-sa-section-heading">
        <div>
          <h2>Manage Users</h2>
          <p className="cn-sa-note">Search and manage Creative Network user accounts.</p>
        </div>
      </div>
      <div className="cn-sa-filter-toolbar cn-sa-user-toolbar">
        <label className="cn-sa-field" htmlFor="cn-sa-user-search">
          <span>Search users</span>
          <input id="cn-sa-user-search" type="search" placeholder="Search by name, email or username"
            value={userSearch} onChange={e => setUserSearch(e.target.value)} />
        </label>
        <button type="button" className="cn-sa-clear" disabled={!userSearch}
          onClick={() => setUserSearch('')}>Clear</button>
      </div>
      <div className="cn-sa-tablewrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{adminUsers.filter(u => [u.fullName, u.username, u.email]
          .some(v => String(v ?? '').toLowerCase().includes(userSearch.toLowerCase())))
          .map(u => <tr key={u.id}>
            <td>{u.fullName || u.username}</td><td>{u.email}</td>
            <td>{u.role}</td><td>{u.active ? 'Active' : 'Inactive'}</td>
            <td>{['USER','ROLE_USER'].includes(u.role)
              ? <button disabled={busy}
                  onClick={() => void run(() => adminApi.setUserActive(u.id, !u.active), 'Account status updated')}>
                  {u.active ? 'Deactivate' : 'Activate'}
                </button>
              : 'Protected'}</td>
          </tr>)}</tbody>
      </table></div>
    </div>}
    {isSuperAdmin && (tab === 'users' || tab === 'admins') && <>
      <div className="cn-sa-card">
        <div className="cn-sa-section-heading">
          <div>
            <h2>{tab === 'admins' ? 'Manage Administrators' : 'Manage Users'}</h2>
            <p className="cn-sa-note">Search accounts by name, email or username.</p>
          </div>
        </div>
        <div className="cn-sa-filter-toolbar cn-sa-user-toolbar">
          <label className="cn-sa-field" htmlFor="cn-sa-super-search">
            <span>Search {tab === 'admins' ? 'administrators' : 'users'}</span>
            <input id="cn-sa-super-search" type="search"
              placeholder="Search by name, email or username"
              value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          </label>
          <button type="button" className="cn-sa-clear" disabled={!userSearch}
            onClick={() => setUserSearch('')}>Clear</button>
        </div>
      </div>
      <div className="cn-sa-card"><h2>{tab === 'admins' ? 'Administrators' : 'Users'}</h2><div className="cn-sa-tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{(tab === 'admins' ? admins : users).filter(u => [u.fullName, u.username, u.email].some(v => String(v ?? '').toLowerCase().includes(userSearch.trim().toLowerCase()))).map(u=><tr key={u.id}><td>{u.fullName || u.username}</td><td>{u.email}</td><td>{u.role}</td><td>{u.active ? 'Active' : 'Inactive'}</td><td><div className="cn-sa-actions">
        {u.role !== 'SUPER_ADMIN' && <><button disabled={busy} onClick={()=>void run(()=>superAdminApi.setActive(u.id,!u.active),'Account status updated')}>{u.active ? 'Deactivate' : 'Activate'}</button><button disabled={busy} onClick={()=>void run(()=>superAdminApi.changeRole(u.id,u.role==='ADMIN'?'USER':'ADMIN'),'Role updated')}>{u.role==='ADMIN'?'Demote to USER':'Promote to ADMIN'}</button></>}
      </div></td></tr>)}</tbody></table></div></div>
    </>}
    {tab === 'reports' && (
      <>
        <SupportReportsPanel mode={isSuperAdmin ? 'superadmin' : 'admin'} />
        <FlaggedCommentsPanel />
      </>
    )}
    {isSuperAdmin && tab === 'reports' && reports.length > 0 && <div className="cn-sa-card"><h2>All reported posts</h2><div className="cn-sa-tablewrap"><table><thead><tr><th>ID</th><th>Post</th><th>Reason</th><th>Status</th><th>Assigned</th><th>Actions</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.reportedPostId}</td><td>{r.reason}</td><td>{r.status}</td><td>{r.assignedAdminId ?? 'Unassigned'}</td><td><div className="cn-sa-actions"><select disabled={busy || r.status!=='PENDING'} value={r.assignedAdminId ?? ''} onChange={e=>{ if(e.target.value) void run(()=>superAdminApi.assignReport(r.id,Number(e.target.value)),'Report assigned') }}><option value="">Assign admin</option>{admins.filter(a=>a.active).map(a=><option key={a.id} value={a.id}>{a.fullName || a.username}</option>)}</select>{r.status==='PENDING' && <><button disabled={busy} onClick={()=>void run(()=>superAdminApi.resolveReport(r.id,'UPHELD','Reviewed by SuperAdmin'),'Report upheld')}>Uphold</button><button disabled={busy} onClick={()=>void run(()=>superAdminApi.resolveReport(r.id,'DISMISSED','Reviewed by SuperAdmin'),'Report dismissed')}>Dismiss</button></>}</div></td></tr>)}</tbody></table></div><p className="cn-sa-note">Report decisions are recorded; upholding a report does not automatically delete its post.</p></div>}
    {tab === 'content' && <div className="cn-sa-card">
      <h2>Content Moderation</h2>
      <p className="cn-sa-note">Review and remove published posts, events and collaboration opportunities.</p>
      <div className="cn-sa-filter-toolbar cn-sa-moderation-toolbar">
        <label className="cn-sa-field" htmlFor="moderation-content-type">
          <span>Content type</span>
          <select id="moderation-content-type" value={contentType}
            onChange={e => setContentType(e.target.value as ContentType)}>
            <option value="posts">Posts</option>
            <option value="events">Events</option>
            <option value="opportunities">Collaboration opportunities</option>
          </select>
        </label>
      </div>
      <div className="cn-sa-tablewrap"><table>
        <thead><tr><th>ID</th><th>Title</th><th>Owner ID</th><th>Actions</th></tr></thead>
        <tbody>{items.map(item=><tr key={item.id}>
          <td>{item.id}</td><td>{item.title}</td><td>{item.ownerId}</td>
          <td><button disabled={busy} onClick={()=>confirmRemoval(item)}>Remove</button></td>
        </tr>)}</tbody>
      </table></div>
      {!busy && items.length === 0 && <p>No content found for this category.</p>}
      <p className="cn-sa-note">Removal is permanent. The API must authorize the authenticated role and record the moderation reason.</p>
    </div>}
    {isSuperAdmin && tab === 'modules' && <div className="cn-sa-card"><h2>Module settings</h2><p className="cn-sa-note">Stored settings only; these toggles do not yet block feature APIs.</p>{modules.map(m=><label key={m.moduleKey} className="cn-sa-module"><span>{m.moduleKey}</span><input type="checkbox" checked={m.enabled} disabled={busy} onChange={e=>void run(()=>superAdminApi.setModule(m.moduleKey,e.target.checked),'Module setting saved')}/></label>)}{modules.length===0 && <p>No settings stored yet. Initialise a supported module:</p>}{modules.length===0 && <div className="cn-sa-actions">{['POSTS','EVENTS','COLLABORATIONS','PORTFOLIOS','REGISTRATIONS','REPORTING'].map(key=><button key={key} disabled={busy} onClick={()=>void run(()=>superAdminApi.setModule(key,true),'Module setting saved')}>{key}</button>)}</div>}</div>}
    {!isSuperAdmin && tab === 'audit' && <div className="cn-sa-card"><h2>Admin Audit Logs</h2>
      <div className="cn-sa-tablewrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
      <tbody>{adminAudit.map(a => <tr key={a.id}><td>{a.createdAt}</td><td>{a.actorId}</td><td>{a.action}</td>
        <td>{a.targetType} #{a.targetId ?? '—'}</td><td>{a.details ?? '—'}</td></tr>)}</tbody>
      </table></div></div>}
    {isSuperAdmin && tab === 'audit' && <div className="cn-sa-card"><h2>Admin Audit Logs</h2><div className="cn-sa-tablewrap"><table><thead><tr><th>Time</th><th>Actor ID</th><th>Action</th><th>Target</th><th>Details</th></tr></thead><tbody>{audit.map(a=><tr key={a.id}><td>{a.createdAt}</td><td>{a.actorId}</td><td>{a.action}</td><td>{a.targetType} #{a.targetId ?? '—'}</td><td>{a.details || '—'}</td></tr>)}</tbody></table></div></div>}
    {isSuperAdmin && tab === 'system' && <div className="cn-sa-card"><h2>System Health</h2>{health && <><p>Service: {health.status}</p><p>Database: {health.database}</p><p>Users: {health.userCount}</p><p>Server: {health.serverTime}</p></>}</div>}
  </section>
  </div>
}
