import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import './AdminDashboard.css'
import { adminApi, type AdminOverview, type AdminReport } from '../../service/adminService'

import AnalyticsDashboard
  from '../../shared/Analytics/AnalyticsDashboard'


export type Section =
  | 'overview'
  | 'reports'
  | 'users'
  | 'analytics'
  | 'moderation'
  | 'activity'


type OverviewPeriod =
  | 'today'
  | '7d'
  | '30d'


type ReportStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'DISMISSED'
  | 'ESCALATED'


type ReportPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT'


type AssignedReport = {
  id: number
  target: string
  reason: string
  priority: ReportPriority
  status: ReportStatus
  createdAt: string
  ageHours: number
}


type ManagedUser = {
  id: number
  name: string
  email: string
  role: string
  status:
    | 'ACTIVE'
    | 'SUSPENDED'
    | 'DEACTIVATED'
}


type ModerationItem = {
  id: number
  type:
    | 'POST'
    | 'PORTFOLIO'
    | 'EVENT'
    | 'OPPORTUNITY'
  title: string
  owner: string
  status:
    | 'VISIBLE'
    | 'REMOVED'
}


type ActivityLog = {
  id: number
  action: string
  target: string
  time: string
}


type OverviewPoint = {
  label: string
  assigned: number
  resolved: number
  moderation: number
}


type Toast = {
  type:
    | 'success'
    | 'error'
  message: string
} | null


const periodLabels: Record<
  OverviewPeriod,
  string
> = {
  today: 'Today',
  '7d': '7 Days',
  '30d': '30 Days',
}


function buildOverviewData(
  period: OverviewPeriod,
): OverviewPoint[] {

  let labels: string[] = []
  let multiplier = 1

  if (period === 'today') {
    labels = [
      '12 AM',
      '4 AM',
      '8 AM',
      '12 PM',
      '4 PM',
      '8 PM',
      'Now',
    ]
    multiplier = 0.35
  }

  if (period === '7d') {
    labels = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]
    multiplier = 1
  }

  if (period === '30d') {
    labels = [
      '1 Oct',
      '5 Oct',
      '10 Oct',
      '15 Oct',
      '20 Oct',
      '25 Oct',
      '30 Oct',
    ]
    multiplier = 3.4
  }


  return labels.map(
    (
      label,
      index,
    ) => {

      const assigned =
        Math.max(
          1,
          Math.round(
            (
              2.5
              +
              index * 0.45
              +
              Math.sin(index) * 0.8
            )
            *
            multiplier
          )
        )

      const resolved =
        Math.max(
          0,
          Math.round(
            assigned * 0.72
          )
        )

      const moderation =
        Math.max(
          1,
          Math.round(
            (
              3
              +
              index * 0.6
              +
              Math.cos(index) * 0.7
            )
            *
            multiplier
          )
        )

      return {
        label,
        assigned,
        resolved,
        moderation,
      }
    }
  )
}


function LineChart({
  data,
  dataKey,
}: {
  data: OverviewPoint[]
  dataKey:
    | 'assigned'
    | 'resolved'
    | 'moderation'
}) {

  const width = 620
  const height = 210
  const padding = 28

  const values =
    data.map(
      item =>
        Number(
          item[dataKey]
        )
    )

  const maximum =
    Math.max(
      ...values,
      1,
    )

  const minimum =
    Math.min(
      ...values,
      0,
    )

  const range =
    maximum
    -
    minimum
    ||
    1

  const points =
    data.map(
      (
        item,
        index,
      ) => {

        const x =
          padding
          +
          (
            index
            /
            Math.max(
              data.length - 1,
              1,
            )
          )
          *
          (
            width
            -
            padding * 2
          )

        const y =
          height
          -
          padding
          -
          (
            (
              Number(
                item[dataKey]
              )
              -
              minimum
            )
            /
            range
          )
          *
          (
            height
            -
            padding * 2
          )

        return `${x},${y}`
      }
    ).join(' ')

  return (
    <div className="admin-overview-chart-wrapper">

      <svg
        className="admin-overview-chart"
        viewBox={
          `0 0 ${width} ${height}`
        }
        role="img"
        aria-label="Admin overview trend chart"
      >

        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="admin-chart-axis"
        />

        <polyline
          points={points}
          fill="none"
          className="admin-chart-line"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {
          data.map(
            (
              item,
              index,
            ) => {

              const x =
                padding
                +
                (
                  index
                  /
                  Math.max(
                    data.length - 1,
                    1,
                  )
                )
                *
                (
                  width
                  -
                  padding * 2
                )

              const y =
                height
                -
                padding
                -
                (
                  (
                    Number(
                      item[dataKey]
                    )
                    -
                    minimum
                  )
                  /
                  range
                )
                *
                (
                  height
                  -
                  padding * 2
                )

              return (
                <g
                  key={
                    `${item.label}-${index}`
                  }
                >
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    className="admin-chart-dot"
                  />

                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="admin-chart-label"
                  >
                    {
                      item.label
                    }
                  </text>
                </g>
              )
            }
          )
        }

      </svg>

    </div>
  )
}


function mapReport(report: AdminReport): AssignedReport {
  const status: ReportStatus = report.status === 'PENDING' ? 'OPEN' :
    report.status === 'UPHELD' ? 'RESOLVED' : 'DISMISSED'
  return {
    id: report.id,
    target: `Post #${report.reportedPostId}`,
    reason: report.reason,
    priority: 'MEDIUM', // Backend does not store priority; do not treat this as verified severity.
    status,
    createdAt: new Date(report.createdAt).toLocaleString(),
    ageHours: Math.max(0, (Date.now() - new Date(report.createdAt).getTime()) / 3_600_000),
  }
}

type AdminDashboardProps = { activeSection: Section; onSectionChange: (section: Section) => void }

function AdminDashboard({ activeSection, onSectionChange }: AdminDashboardProps) {

  const [
    section,
    setSection,
  ] =
    useState<Section>(
      activeSection
    )

  useEffect(() => { setSection(activeSection) }, [activeSection])

  const navigateSection = (nextSection: Section) => {
    setSection(nextSection)
    onSectionChange(nextSection)
  }

  const [
    overviewPeriod,
    setOverviewPeriod,
  ] =
    useState<OverviewPeriod>(
      '7d'
    )

  const [
    reports,
    setReports,
  ] =
    useState<AssignedReport[]>(
      []
    )

  const [
    users,
    setUsers,
  ] =
    useState<ManagedUser[]>(
      []
    )

  const [
    moderationItems,
  ] =
    useState<ModerationItem[]>(
      []
    )

  const [
    activity,
    setActivity,
  ] =
    useState<ActivityLog[]>(
      []
    )

  const [
    selectedReport,
    setSelectedReport,
  ] =
    useState<AssignedReport | null>(
      null
    )

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState('')

  const [
    userStatusFilter,
    setUserStatusFilter,
  ] =
    useState('ALL')

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState(
      new Date()
    )

  const [
    toast,
    setToast,
  ] =
    useState<Toast>(
      null
    )


  const [overviewLive, setOverviewLive] = useState<AdminOverview | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load the real backend records; never fall back to fabricated users or reports.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setApiLoading(true)
      setApiError(null)
      try {
        const [overview, userPage, assignedPage, activityPage] = await Promise.all([
          adminApi.overview(), adminApi.users(), adminApi.assignedReports(), adminApi.activity(),
        ])
        if (cancelled) return
        setOverviewLive(overview)
        setUsers(userPage.content.map(u => ({
          id: u.id, name: u.fullName || u.username, email: u.email, role: u.role,
          status: u.active ? 'ACTIVE' as const : 'DEACTIVATED' as const,
        })))
        setReports(assignedPage.content.map(mapReport))
        setActivity(activityPage.content.map(a => ({
          id: a.id, action: a.action,
          target: `${a.targetType} #${a.targetId ?? '-'}`,
          time: new Date(a.createdAt).toLocaleString(),
        })))
        setLastUpdated(new Date())
      } catch (err) {
        if (!cancelled) setApiError(err instanceof Error ? err.message : 'Could not load Admin data.')
      } finally {
        if (!cancelled) setApiLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [refreshKey])

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(false)


  const [
    dismissedNotificationIds,
    setDismissedNotificationIds,
  ] =
    useState<string[]>([])


  useEffect(
    () => {

      if (!toast) {
        return
      }

      const timer =
        window.setTimeout(
          () =>
            setToast(
              null
            ),
          3000,
        )

      return () =>
        window.clearTimeout(
          timer
        )

    },
    [
      toast,
    ],
  )


  const overviewData =
    useMemo(
      () =>
        buildOverviewData(
          overviewPeriod
        ),
      [
        overviewPeriod,
      ],
    )


  const overviewTotals =
    useMemo(
      () => {

        return overviewData.reduce(
          (
            result,
            point,
          ) => {

            result.assigned +=
              point.assigned

            result.resolved +=
              point.resolved

            result.moderation +=
              point.moderation

            return result
          },
          {
            assigned: 0,
            resolved: 0,
            moderation: 0,
          },
        )

      },
      [
        overviewData,
      ],
    )


  const openReports =
    reports.filter(
      report =>
        report.status
        ===
        'OPEN'
        ||
        report.status
        ===
        'UNDER_REVIEW',
    ).length


  const urgentReports =
    reports.filter(
      report =>
        report.priority
        ===
        'URGENT'
        &&
        report.status
        !==
        'RESOLVED'
        &&
        report.status
        !==
        'DISMISSED',
    ).length


  const underReviewReports =
    reports.filter(
      report =>
        report.status
        ===
        'UNDER_REVIEW',
    ).length


  const resolvedReports =
    reports.filter(
      report =>
        report.status
        ===
        'RESOLVED',
    ).length


  const overdueReports =
    reports.filter(
      report =>
        report.ageHours
        >=
        24
        &&
        report.status
        !==
        'RESOLVED'
        &&
        report.status
        !==
        'DISMISSED',
    ).length


  const escalatedReports =
    reports.filter(
      report =>
        report.status
        ===
        'ESCALATED',
    ).length



  const adminNotifications = [
    ...(urgentReports > 0
      ? [{ id: 'urgent', message: `${urgentReports} urgent report(s) need attention.`, section: 'reports' as Section }]
      : []),
    ...(overdueReports > 0
      ? [{ id: 'overdue', message: `${overdueReports} report(s) are older than 24 hours.`, section: 'reports' as Section }]
      : []),
    ...(escalatedReports > 0
      ? [{ id: 'escalated', message: `${escalatedReports} report(s) are escalated to Super Admin.`, section: 'reports' as Section }]
      : []),
  ]

  const visibleAdminNotifications =
    adminNotifications.filter(
      notification =>
        !dismissedNotificationIds.includes(notification.id),
    )


  const activeUsers =
    users.filter(
      user =>
        user.status
        ===
        'ACTIVE',
    ).length


  const removedContent =
    moderationItems.filter(
      item =>
        item.status
        ===
        'REMOVED',
    ).length


  const workloadCompletion =
    Math.round(
      (
        resolvedReports
        /
        Math.max(
          reports.length,
          1,
        )
      )
      *
      100
    )


  const filteredUsers =
    useMemo(
      () =>
        users.filter(
          user => {

            const search =
              searchTerm
                .trim()
                .toLowerCase()

            const matchesSearch =
              !search
              ||
              user.name
                .toLowerCase()
                .includes(
                  search
                )
              ||
              user.email
                .toLowerCase()
                .includes(
                  search
                )
              ||
              user.role
                .toLowerCase()
                .includes(
                  search
                )

            const matchesStatus =
              userStatusFilter
              ===
              'ALL'
              ||
              user.status
              ===
              userStatusFilter

            return (
              matchesSearch
              &&
              matchesStatus
            )
          }
        ),
      [
        users,
        searchTerm,
        userStatusFilter,
      ],
    )


  const reportReasonCounts =
    useMemo(
      () => {

        const counts: Record<
          string,
          number
        > = {}

        reports.forEach(
          report => {

            counts[
              report.reason
            ] =
              (
                counts[
                  report.reason
                ]
                ||
                0
              )
              +
              1

          }
        )

        return Object.entries(
          counts
        )
          .map(
            (
              [
                reason,
                count,
              ]
            ) => ({
              reason,
              count,
            })
          )
          .sort(
            (
              first,
              second,
            ) =>
              second.count
              -
              first.count
          )

      },
      [
        reports,
      ],
    )


  const showToast =
    (
      type:
        | 'success'
        | 'error',
      message: string,
    ) => {

      setToast({
        type,
        message,
      })

    }


  const updateReportStatus = async (reportId: number, status: ReportStatus) => {
    if (status !== 'RESOLVED' && status !== 'DISMISSED') {
      showToast('error', 'This report transition is not yet supported by the backend.')
      return
    }
    try {
      const updated = await adminApi.resolveReport(
        reportId, status === 'RESOLVED' ? 'UPHELD' : 'DISMISSED',
      )
      setReports(previous => previous.map(r => r.id === reportId ? mapReport(updated) : r))
      setSelectedReport(null)
      setRefreshKey(value => value + 1)
      showToast('success', `Report #${reportId} saved to the backend.`)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Report action failed')
    }
  }

  const updateUserStatus = async (
    userId: number,
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED',
  ) => {
    const user = users.find(candidate => candidate.id === userId)
    if (!user) return
    if (status === 'SUSPENDED') {
      showToast('error', 'Suspension is not supported by the backend. Use Deactivate instead.')
      return
    }
    if (status === 'DEACTIVATED' && !window.confirm(`Deactivate ${user.name}?`)) return
    try {
      const updated = await adminApi.setUserActive(userId, status === 'ACTIVE')
      setUsers(previous => previous.map(candidate => candidate.id === userId
        ? { ...candidate, status: updated.active ? 'ACTIVE' : 'DEACTIVATED' }
        : candidate))
      setRefreshKey(value => value + 1)
      showToast('success', `${user.name}'s status was saved.`)
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'User update failed')
    }
  }

  const toggleContentStatus = (_itemId: number) => {
    showToast('error', 'Post visibility API is not implemented yet; no content was changed.')
  }

  const handleRefresh = () => setRefreshKey(value => value + 1)

  const pageTitle = {
    overview:
      'Admin Overview',
    reports:
      'My Assigned Reports',
    users:
      'Manage Users',
    analytics:
      'Analytics',
    moderation:
      'Content Moderation',
    activity:
      'My Activity',
  }[section]


  return (
    <div className="cp-admin-dashboard-body">

      <main className="cp-admin-dashboard-content">
        {apiLoading && <p role="status" style={{ color: '#625c78' }}>Loading Admin records from the backend…</p>}
        {apiError && <p role="alert" style={{ color: '#a42742', background: '#fff4f6', padding: 12, borderRadius: 10 }}>
          {apiError}. Verify the Spring Boot server, Admin JWT, CORS and security rules.
        </p>}
        {overviewLive && (
          <section aria-label="Live platform totals" style={{ display:'flex', flexWrap:'wrap', gap: 16, padding: 16, marginBottom: 16, background:'rgba(255,255,255,.94)', borderRadius: 12, color:'#29265f' }}>
            <strong>Live database totals</strong>
            <span>Users: {overviewLive.totalUsers}</span>
            <span>Posts: {overviewLive.totalPosts}</span>
            <span>Events: {overviewLive.totalEvents}</span>
            <span>Pending reports: {overviewLive.pendingReports}</span>
          </section>
        )}
        {section === 'analytics' && <p style={{padding:10, color:'#625c78'}}>The analytics charts below are existing sample visualisations. Only the database totals above are live.</p>}
        {section === 'moderation' && <p style={{padding:10, color:'#625c78'}}>Content removal/restoration requires a separate moderation API. No items have been changed.</p>}

        <header className="admin-header">

          <div>
            <h1>
              {
                pageTitle
              }
            </h1>

            <p>
              Review reports, manage users,
              moderate content and monitor
              platform activity.
            </p>
          </div>


          <div className="admin-header-tools">

            <div className="admin-notification-wrapper">
              <button
                type="button"
                className="admin-notification-button"
                onClick={() =>
                  setNotificationsOpen(
                    current => !current
                  )
                }
                aria-label="Open Admin notifications"
              >
                🔔
                {
                  visibleAdminNotifications.length > 0
                  &&
                  (
                    <span>
                      {visibleAdminNotifications.length}
                    </span>
                  )
                }
              </button>

              {
                notificationsOpen
                &&
                (
                  <div className="admin-notification-panel">
                    <div className="notification-panel-heading">
                      <strong>Admin Notifications</strong>
                      <div>
                        {visibleAdminNotifications.length > 0 && (
                          <button
                            type="button"
                            className="notification-dismiss-all"
                            onClick={() =>
                              setDismissedNotificationIds(
                                adminNotifications.map(notification => notification.id),
                              )
                            }
                          >
                            Dismiss all
                          </button>
                        )}
                        <button
                          type="button"
                          className="notification-close"
                          onClick={() => setNotificationsOpen(false)}
                          aria-label="Close notifications"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {visibleAdminNotifications.length ? (
                      <div className="notification-list">
                        {visibleAdminNotifications.map(notification => (
                          <div className="notification-item" key={notification.id}>
                            <button
                              type="button"
                              className="notification-message"
                              onClick={() => {
                                navigateSection(notification.section)
                                setNotificationsOpen(false)
                              }}
                            >
                              {notification.message}
                            </button>
                            <button
                              type="button"
                              className="notification-dismiss"
                              onClick={() =>
                                setDismissedNotificationIds(current => [
                                  ...current,
                                  notification.id,
                                ])
                              }
                              aria-label={`Dismiss ${notification.message}`}
                            >
                              Dismiss
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="notification-empty">No new notifications.</p>
                    )}
                  </div>
                )
              }
            </div>

            {
              section
              !==
              'analytics'
              &&
              (
                <div className="admin-live-status">

                  <span className="admin-live-dot" />

                  <div>
                    <strong>
                      Live
                    </strong>

                    <small>
                      Updated
                      {' '}
                      {
                        lastUpdated
                          .toLocaleTimeString(
                            [],
                            {
                              hour:
                                '2-digit',
                              minute:
                                '2-digit',
                              second:
                                '2-digit',
                            },
                          )
                      }
                    </small>
                  </div>

                  <button
                    type="button"
                    className="admin-refresh-button"
                    onClick={
                      handleRefresh
                    }
                  >
                    Refresh
                  </button>

                </div>
              )
            }

          </div>

        </header>


        {
          toast
          &&
          (
            <div
              className={
                `admin-toast ${toast.type}`
              }
            >
              {
                toast.message
              }
            </div>
          )
        }


        {
          section
          ===
          'overview'
          &&
          (
            <>

              <div className="admin-period-selector">

                {
                  (
                    [
                      'today',
                      '7d',
                      '30d',] as OverviewPeriod[]
                  ).map(
                    period => (
                      <button
                        key={
                          period
                        }
                        className={
                          overviewPeriod
                          ===
                          period
                            ? 'active'
                            : ''
                        }
                        onClick={
                          () =>
                            setOverviewPeriod(
                              period
                            )
                        }
                      >
                        {
                          periodLabels[
                            period
                          ]
                        }
                      </button>
                    )
                  )
                }

              </div>


              <section className="admin-attention-banner">
                <div>
                  <strong>Priority Attention</strong>
                  <span>
                    {urgentReports} urgent · {overdueReports} overdue · {escalatedReports} escalated
                  </span>
                </div>
                <div className="admin-attention-actions">
                  <button
                    type="button"
                    onClick={() => navigateSection('reports')}
                  >
                    Review Queue
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSection('activity')}
                  >
                    View Activity
                  </button>
                </div>
              </section>


              <section className="admin-metric-grid">

                <article className="admin-metric-card">
                  <span>
                    Assigned
                  </span>

                  <strong>
                    {
                      overviewTotals
                        .assigned
                        .toLocaleString()
                    }
                  </strong>

                  <small>
                    Assigned during {
                      periodLabels[
                        overviewPeriod
                      ].toLowerCase()
                    }
                  </small>
                </article>


                <article className="admin-metric-card">
                  <span>
                    Open
                  </span>

                  <strong>
                    {
                      openReports
                    }
                  </strong>

                  <small>
                    Current unresolved queue
                  </small>
                </article>


                <article className="admin-metric-card">
                  <span>
                    Urgent
                  </span>

                  <strong>
                    {
                      urgentReports
                    }
                  </strong>

                  <small>
                    Immediate attention
                  </small>
                </article>


                <article className="admin-metric-card">
                  <span>
                    Under Review
                  </span>

                  <strong>
                    {
                      underReviewReports
                    }
                  </strong>

                  <small>
                    Currently being reviewed
                  </small>
                </article>


                <article className="admin-metric-card">
                  <span>
                    Resolved
                  </span>

                  <strong>
                    {
                      overviewTotals
                        .resolved
                        .toLocaleString()
                    }
                  </strong>

                  <small className="admin-positive-copy">
                    +9.1% vs previous period
                  </small>
                </article>


                <article className="admin-metric-card">
                  <span>
                    Avg. Resolution
                  </span>

                  <strong>
                    2.1h
                  </strong>

                  <small className="admin-positive-copy">
                    Within moderation target
                  </small>
                </article>

              </section>


              <section className="admin-dashboard-grid">

                <article className="admin-card">

                  <div className="admin-card-heading">

                    <div>
                      <h3>
                        My Workload Trend
                      </h3>

                      <p>
                        Assigned moderation work across {
                          periodLabels[
                            overviewPeriod
                          ].toLowerCase()
                        }.
                      </p>
                    </div>

                    <span className="admin-trend-positive">
                      +7.8%
                    </span>

                  </div>

                  <LineChart
                    data={
                      overviewData
                    }
                    dataKey="assigned"
                  />

                </article>


                <article className="admin-card">

                  <div className="admin-card-heading">
                    <div>
                      <h3>
                        My Workload
                      </h3>

                      <p>
                        Current assigned-report status.
                      </p>
                    </div>
                  </div>


                  <div className="admin-workload-summary">

                    <div>
                      <span>
                        Assigned
                      </span>

                      <strong>
                        {
                          reports.length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Open
                      </span>

                      <strong>
                        {
                          reports.filter(
                            report =>
                              report.status
                              ===
                              'OPEN'
                          ).length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Under Review
                      </span>

                      <strong>
                        {
                          underReviewReports
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Resolved
                      </span>

                      <strong>
                        {
                          resolvedReports
                        }
                      </strong>
                    </div>

                  </div>


                  <div className="admin-completion-block">

                    <div>
                      <span>
                        Completion
                      </span>

                      <strong>
                        {
                          workloadCompletion
                        }
                        %
                      </strong>
                    </div>

                    <div className="admin-completion-bar">
                      <span
                        style={{
                          width:
                            `${workloadCompletion}%`,
                        }}
                      />
                    </div>

                  </div>

                </article>

              </section>


              <section className="admin-dashboard-grid">

                <article className="admin-card">

                  <div className="admin-card-heading">

                    <div>
                      <h3>
                        Priority Report Queue
                      </h3>

                      <p>
                        Highest-priority assigned reports.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={
                        () =>
                          navigateSection(
                            'reports'
                          )
                      }
                    >
                      View All Reports
                    </button>

                  </div>


                  <div className="admin-list">

                    {
                      reports
                        .filter(
                          report =>
                            report.status
                            !==
                            'RESOLVED'
                            &&
                            report.status
                            !==
                            'DISMISSED'
                        )
                        .sort(
                          (
                            first,
                            second,
                          ) => {

                            const priorityOrder = {
                              URGENT: 4,
                              HIGH: 3,
                              MEDIUM: 2,
                              LOW: 1,
                            }

                            return (
                              priorityOrder[
                                second.priority
                              ]
                              -
                              priorityOrder[
                                first.priority
                              ]
                            )
                          }
                        )
                        .slice(
                          0,
                          4,
                        )
                        .map(
                          report => (
                            <button
                              type="button"
                              className="admin-list-row admin-list-row-button"
                              key={
                                report.id
                              }
                              onClick={
                                () =>
                                  setSelectedReport(
                                    report
                                  )
                              }
                            >
                              <div>
                                <strong>
                                  Report #
                                  {
                                    report.id
                                  }
                                </strong>

                                <span>
                                  {
                                    report.target
                                  }
                                  {' • '}
                                  {
                                    report.reason
                                  }
                                </span>

                                <small
                                  className={
                                    report.ageHours
                                    >=
                                    24
                                      ? 'admin-sla-overdue'
                                      : 'admin-sla-normal'
                                  }
                                >
                                  {
                                    report.ageHours
                                  }
                                  h old
                                </small>
                              </div>

                              <span
                                className={
                                  `admin-priority ${
                                    report.priority
                                      .toLowerCase()
                                  }`
                                }
                              >
                                {
                                  report.priority
                                }
                              </span>
                            </button>
                          )
                        )
                    }

                  </div>

                </article>


                <article className="admin-card">

                  <div className="admin-card-heading">
                    <div>
                      <h3>
                        Alerts & SLA
                      </h3>

                      <p>
                        Items requiring attention.
                      </p>
                    </div>
                  </div>


                  <div className="admin-alert-list">

                    {
                      urgentReports > 0
                      &&
                      (
                        <button
                          type="button"
                          className="admin-alert danger"
                          onClick={
                            () =>
                              navigateSection(
                                'reports'
                              )
                          }
                        >
                          <span>
                            !
                          </span>

                          <div>
                            <strong>
                              {
                                urgentReports
                              }
                              {' '}
                              urgent report
                              {
                                urgentReports
                                ===
                                1
                                  ? ''
                                  : 's'
                              }
                            </strong>

                            <small>
                              Prioritise these reports first.
                            </small>
                          </div>
                        </button>
                      )
                    }


                    {
                      overdueReports > 0
                      &&
                      (
                        <button
                          type="button"
                          className="admin-alert warning"
                          onClick={
                            () =>
                              navigateSection(
                                'reports'
                              )
                          }
                        >
                          <span>
                            ⏱
                          </span>

                          <div>
                            <strong>
                              {
                                overdueReports
                              }
                              {' '}
                              overdue report
                              {
                                overdueReports
                                ===
                                1
                                  ? ''
                                  : 's'
                              }
                            </strong>

                            <small>
                              Older than 24 hours.
                            </small>
                          </div>
                        </button>
                      )
                    }


                    <div className="admin-alert healthy">

                      <span>
                        ✓
                      </span>

                      <div>
                        <strong>
                          Moderation tools available
                        </strong>

                        <small>
                          User and content actions are operational.
                        </small>
                      </div>

                    </div>

                  </div>

                </article>

              </section>


              <section className="admin-dashboard-grid">

                <article className="admin-card">

                  <div className="admin-card-heading">
                    <div>
                      <h3>
                        Top Report Reasons
                      </h3>

                      <p>
                        Common reasons in your assigned queue.
                      </p>
                    </div>
                  </div>


                  <div className="admin-reason-list">

                    {
                      reportReasonCounts.map(
                        item => {

                          const percentage =
                            Math.round(
                              (
                                item.count
                                /
                                Math.max(
                                  reports.length,
                                  1,
                                )
                              )
                              *
                              100
                            )

                          return (
                            <div
                              key={
                                item.reason
                              }
                            >
                              <div>
                                <span>
                                  {
                                    item.reason
                                  }
                                </span>

                                <strong>
                                  {
                                    percentage
                                  }
                                  %
                                </strong>
                              </div>

                              <div className="admin-reason-bar">
                                <span
                                  style={{
                                    width:
                                      `${percentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        }
                      )
                    }

                  </div>

                </article>


                <article className="admin-card">

                  <div className="admin-card-heading">
                    <div>
                      <h3>
                        Moderation Summary
                      </h3>

                      <p>
                        Current content and user moderation snapshot.
                      </p>
                    </div>
                  </div>


                  <div className="admin-summary-grid">

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'users'
                          )
                      }
                    >
                      <span>
                        Active Users
                      </span>

                      <strong>
                        {
                          activeUsers
                        }
                      </strong>
                    </button>

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'users'
                          )
                      }
                    >
                      <span>
                        Suspended
                      </span>

                      <strong>
                        {
                          users.filter(
                            user =>
                              user.status
                              ===
                              'SUSPENDED'
                          ).length
                        }
                      </strong>
                    </button>

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'moderation'
                          )
                      }
                    >
                      <span>
                        Removed Content
                      </span>

                      <strong>
                        {
                          removedContent
                        }
                      </strong>
                    </button>

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'moderation'
                          )
                      }
                    >
                      <span>
                        Visible Content
                      </span>

                      <strong>
                        {
                          moderationItems.filter(
                            item =>
                              item.status
                              ===
                              'VISIBLE'
                          ).length
                        }
                      </strong>
                    </button>

                  </div>

                </article>

              </section>


              <section className="admin-dashboard-grid">

                <article className="admin-card">

                  <div className="admin-card-heading">
                    <div>
                      <h3>
                        Moderation Activity Trend
                      </h3>

                      <p>
                        Moderation actions for the selected period.
                      </p>
                    </div>

                    <span className="admin-trend-neutral">
                      {
                        overviewTotals
                          .moderation
                      }
                      {' '}
                      actions
                    </span>
                  </div>

                  <LineChart
                    data={
                      overviewData
                    }
                    dataKey="moderation"
                  />

                </article>


                <article className="admin-card">

                  <div className="admin-card-heading">
                    <div>
                      <h3>
                        Quick Actions
                      </h3>

                      <p>
                        Common administrator tasks.
                      </p>
                    </div>
                  </div>

                  <div className="admin-quick-actions">

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'reports'
                          )
                      }
                    >
                      Review Reports
                    </button>

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'users'
                          )
                      }
                    >
                      Manage Users
                    </button>

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'moderation'
                          )
                      }
                    >
                      Moderate Content
                    </button>

                    <button
                      type="button"
                      onClick={
                        () =>
                          navigateSection(
                            'analytics'
                          )
                      }
                    >
                      View Analytics
                    </button>

                  </div>

                </article>

              </section>


              <section className="admin-card">

                <div className="admin-card-heading">

                  <div>
                    <h3>
                      Recent Actions
                    </h3>

                    <p>
                      Your latest recorded moderation actions.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="admin-secondary-button"
                    onClick={
                      () =>
                        navigateSection(
                          'activity'
                        )
                    }
                  >
                    View All Activity
                  </button>

                </div>


                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>
                          Action
                        </th>
                        <th>
                          Target
                        </th>
                        <th>
                          Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {
                        activity
                          .slice(
                            0,
                            5,
                          )
                          .map(
                            log => (
                              <tr
                                key={
                                  log.id
                                }
                              >
                                <td>
                                  <span className="admin-activity-action">
                                    {
                                      log.action
                                    }
                                  </span>
                                </td>

                                <td>
                                  {
                                    log.target
                                  }
                                </td>

                                <td>
                                  {
                                    log.time
                                  }
                                </td>
                              </tr>
                            )
                          )
                      }

                    </tbody>

                  </table>

                </div>

              </section>

            </>
          )
        }


        {
          section
          ===
          'reports'
          &&
          (
            <>

              <section className="admin-metric-grid compact">

                <article className="admin-metric-card">
                  <span>
                    Open
                  </span>

                  <strong>
                    {
                      reports.filter(
                        report =>
                          report.status
                          ===
                          'OPEN',
                      ).length
                    }
                  </strong>
                </article>

                <article className="admin-metric-card">
                  <span>
                    Under Review
                  </span>

                  <strong>
                    {
                      underReviewReports
                    }
                  </strong>
                </article>

                <article className="admin-metric-card">
                  <span>
                    Resolved
                  </span>

                  <strong>
                    {
                      resolvedReports
                    }
                  </strong>
                </article>

                <article className="admin-metric-card">
                  <span>
                    Urgent
                  </span>

                  <strong>
                    {
                      urgentReports
                    }
                  </strong>
                </article>

              </section>


              <section className="admin-card">

                <div className="admin-card-heading">
                  <div>
                    <h3>
                      My Assigned Reports
                    </h3>

                    <p>
                      Only reports assigned to this administrator should be returned by the backend.
                    </p>
                  </div>
                </div>


                <div className="admin-table-wrapper">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>
                          Report
                        </th>
                        <th>
                          Target
                        </th>
                        <th>
                          Reason
                        </th>
                        <th>
                          Priority
                        </th>
                        <th>
                          Age
                        </th>
                        <th>
                          Status
                        </th>
                        <th>
                          Created
                        </th>
                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {
                        reports.map(
                          report => (
                            <tr
                              key={
                                report.id
                              }
                            >
                              <td>
                                <strong>
                                  #
                                  {
                                    report.id
                                  }
                                </strong>
                              </td>

                              <td>
                                {
                                  report.target
                                }
                              </td>

                              <td>
                                {
                                  report.reason
                                }
                              </td>

                              <td>
                                <span
                                  className={
                                    `admin-priority ${
                                      report.priority
                                        .toLowerCase()
                                    }`
                                  }
                                >
                                  {
                                    report.priority
                                  }
                                </span>
                              </td>

                              <td>
                                <span
                                  className={
                                    report.ageHours
                                    >=
                                    24
                                      ? 'admin-sla-overdue'
                                      : 'admin-sla-normal'
                                  }
                                >
                                  {
                                    report.ageHours
                                  }
                                  h
                                </span>
                              </td>

                              <td>
                                <span
                                  className={
                                    `admin-status ${
                                      report.status
                                        .toLowerCase()
                                    }`
                                  }
                                >
                                  {
                                    report.status
                                      .replace(
                                        '_',
                                        ' ',
                                      )
                                  }
                                </span>
                              </td>

                              <td>
                                {
                                  report.createdAt
                                }
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="admin-primary-button small"
                                  onClick={
                                    () =>
                                      setSelectedReport(
                                        report
                                      )
                                  }
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          )
                        )
                      }

                    </tbody>

                  </table>

                </div>

              </section>

            </>
          )
        }


        {
          section
          ===
          'users'
          &&
          (
            <section className="admin-card">

              <div className="admin-card-heading">
                <div>
                  <h3>
                    Manage Users
                  </h3>

                  <p>
                    Suspend, reactivate or deactivate platform accounts.
                  </p>
                </div>
              </div>


              <div className="admin-warning">
                Deactivated accounts should remain in the database.
                Keeping the original email and account record prevents
                the same account from simply registering again and
                preserves moderation history.
              </div>


              <div className="admin-filter-bar">

                <input
                  type="search"
                  placeholder="Search users..."
                  value={
                    searchTerm
                  }
                  onChange={
                    event =>
                      setSearchTerm(
                        event.target.value,
                      )
                  }
                />

                <select
                  value={
                    userStatusFilter
                  }
                  onChange={
                    event =>
                      setUserStatusFilter(
                        event.target.value,
                      )
                  }
                >
                  <option value="ALL">
                    All Statuses
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="SUSPENDED">
                    Suspended
                  </option>

                  <option value="DEACTIVATED">
                    Deactivated
                  </option>
                </select>

              </div>


              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>
                        User
                      </th>
                      <th>
                        Email
                      </th>
                      <th>
                        Role
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {
                      filteredUsers.map(
                        user => (
                          <tr
                            key={
                              user.id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  user.name
                                }
                              </strong>

                              <small>
                                User #
                                {
                                  user.id
                                }
                              </small>
                            </td>

                            <td>
                              {
                                user.email
                              }
                            </td>

                            <td>
                              {
                                user.role
                              }
                            </td>

                            <td>
                              <span
                                className={
                                  `admin-status ${
                                    user.status
                                      .toLowerCase()
                                  }`
                                }
                              >
                                {
                                  user.status
                                }
                              </span>
                            </td>

                            <td>
                              <div className="admin-action-buttons">

                                {
                                  user.status
                                  ===
                                  'ACTIVE'
                                  &&
                                  (
                                    <button
                                      type="button"
                                      className="admin-secondary-button"
                                      onClick={
                                        () =>
                                          updateUserStatus(
                                            user.id,
                                            'SUSPENDED',
                                          )
                                      }
                                    >
                                      Suspend
                                    </button>
                                  )
                                }

                                {
                                  user.status
                                  ===
                                  'SUSPENDED'
                                  &&
                                  (
                                    <button
                                      type="button"
                                      className="admin-secondary-button"
                                      onClick={
                                        () =>
                                          updateUserStatus(
                                            user.id,
                                            'ACTIVE',
                                          )
                                      }
                                    >
                                      Reactivate
                                    </button>
                                  )
                                }

                                {
                                  user.status
                                  !==
                                  'DEACTIVATED'
                                  &&
                                  (
                                    <button
                                      type="button"
                                      className="admin-danger-button"
                                      onClick={
                                        () =>
                                          updateUserStatus(
                                            user.id,
                                            'DEACTIVATED',
                                          )
                                      }
                                    >
                                      Deactivate
                                    </button>
                                  )
                                }

                                {
                                  user.status
                                  ===
                                  'DEACTIVATED'
                                  &&
                                  (
                                    <span className="admin-protected-label">
                                      Account deactivated
                                    </span>
                                  )
                                }

                              </div>
                            </td>
                          </tr>
                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            </section>
          )
        }


        {
          section
          ===
          'analytics'
          &&
          (
            <AnalyticsDashboard
              mode="admin"
            />
          )
        }


        {
          section
          ===
          'moderation'
          &&
          (
            <section className="admin-card">

              <div className="admin-card-heading">
                <div>
                  <h3>
                    Content Moderation
                  </h3>

                  <p>
                    Remove inappropriate content or restore content after review.
                  </p>
                </div>
              </div>


              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>
                        Type
                      </th>
                      <th>
                        Content
                      </th>
                      <th>
                        Owner
                      </th>
                      <th>
                        Status
                      </th>
                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {
                      moderationItems.map(
                        item => (
                          <tr
                            key={
                              `${item.type}-${item.id}`
                            }
                          >
                            <td>
                              <span className="admin-type-badge">
                                {
                                  item.type
                                }
                              </span>
                            </td>

                            <td>
                              <strong>
                                {
                                  item.title
                                }
                              </strong>

                              <small>
                                #
                                {
                                  item.id
                                }
                              </small>
                            </td>

                            <td>
                              {
                                item.owner
                              }
                            </td>

                            <td>
                              <span
                                className={
                                  `admin-status ${
                                    item.status
                                      .toLowerCase()
                                  }`
                                }
                              >
                                {
                                  item.status
                                }
                              </span>
                            </td>

                            <td>
                              <button
                                type="button"
                                className={
                                  item.status
                                  ===
                                  'VISIBLE'
                                    ? 'admin-danger-button'
                                    : 'admin-secondary-button'
                                }
                                onClick={
                                  () =>
                                    toggleContentStatus(
                                      item.id,
                                    )
                                }
                              >
                                {
                                  item.status
                                  ===
                                  'VISIBLE'
                                    ? 'Remove'
                                    : 'Restore'
                                }
                              </button>
                            </td>
                          </tr>
                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            </section>
          )
        }


        {
          section
          ===
          'activity'
          &&
          (
            <section className="admin-card">

              <div className="admin-card-heading">
                <div>
                  <h3>
                    My Administrative Activity
                  </h3>

                  <p>
                    Actions performed by this administrator.
                  </p>
                </div>
              </div>


              <div className="admin-table-wrapper">

                <table className="admin-table">

                  <thead>
                    <tr>
                      <th>
                        Action
                      </th>
                      <th>
                        Target
                      </th>
                      <th>
                        Time
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {
                      activity.map(
                        log => (
                          <tr
                            key={
                              log.id
                            }
                          >
                            <td>
                              <span className="admin-activity-action">
                                {
                                  log.action
                                }
                              </span>
                            </td>

                            <td>
                              {
                                log.target
                              }
                            </td>

                            <td>
                              {
                                log.time
                              }
                            </td>
                          </tr>
                        )
                      )
                    }

                  </tbody>

                </table>

              </div>

            </section>
          )
        }

      </main>


      {
        selectedReport
        &&
        (
          <div className="admin-modal-overlay">

            <div className="admin-modal">

              <div className="admin-modal-heading">

                <div>
                  <h2>
                    Review Report #
                    {
                      selectedReport.id
                    }
                  </h2>

                  <p>
                    Review the report before changing its moderation status.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={
                    () =>
                      setSelectedReport(
                        null
                      )
                  }
                >
                  ×
                </button>

              </div>


              <div className="admin-report-details">

                <div>
                  <span>
                    Target
                  </span>

                  <strong>
                    {
                      selectedReport.target
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Reason
                  </span>

                  <strong>
                    {
                      selectedReport.reason
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Priority
                  </span>

                  <strong>
                    {
                      selectedReport.priority
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {
                      selectedReport.status
                        .replace(
                          '_',
                          ' ',
                        )
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Age
                  </span>

                  <strong>
                    {
                      selectedReport.ageHours
                    }
                    h
                  </strong>
                </div>

              </div>


              <div className="admin-modal-actions">

                {
                  selectedReport.status
                  ===
                  'OPEN'
                  &&
                  (
                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={
                        () =>
                          updateReportStatus(
                            selectedReport.id,
                            'UNDER_REVIEW',
                          )
                      }
                    >
                      Start Review
                    </button>
                  )
                }

                {
                  selectedReport.status
                  !==
                  'RESOLVED'
                  &&
                  (
                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={
                        () => {
                          updateReportStatus(
                            selectedReport.id,
                            'RESOLVED',
                          )


                        }
                      }
                    >
                      Resolve
                    </button>
                  )
                }

                {
                  selectedReport.status
                  !==
                  'DISMISSED'
                  &&
                  (
                    <button
                      type="button"
                      className="admin-danger-button"
                      onClick={
                        () => {
                          updateReportStatus(
                            selectedReport.id,
                            'DISMISSED',
                          )


                        }
                      }
                    >
                      Dismiss
                    </button>
                  )
                }

                {
                  selectedReport.status
                  !==
                  'RESOLVED'
                  &&
                  selectedReport.status
                  !==
                  'DISMISSED'
                  &&
                  selectedReport.status
                  !==
                  'ESCALATED'
                  &&
                  (
                    <button
                      type="button"
                      className="admin-warning-button"
                      onClick={() => {
                        const confirmed =
                          window.confirm(
                            `Escalate Report #${selectedReport.id} to Super Admin?`,
                          )

                        if (!confirmed) {
                          return
                        }

                        updateReportStatus(
                          selectedReport.id,
                          'ESCALATED',
                        )

                        setSelectedReport(null)
                      }}
                    >
                      Escalate
                    </button>
                  )
                }


                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={
                    () =>
                      setSelectedReport(
                        null
                      )
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )
      }

    </div>
  )
}


export default AdminDashboard
