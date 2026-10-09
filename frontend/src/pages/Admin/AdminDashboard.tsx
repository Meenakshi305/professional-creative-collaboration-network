import { useMemo, useState } from 'react'

import './AdminDashboard.css'

import {
  adminStats,
  analyticsByPeriod,
  mockReports,
  mockUsers,
  recentActivities,
  type AdminReport,
  type AdminUser,
  type AnalyticsPeriod,
  type EngagementPoint,
  type TrendPoint,
} from './adminMockData'

type AdminSection =
  | 'overview'
  | 'analytics'
  | 'users'
  | 'reports'
  | 'content'
  | 'audit'

interface SimpleLineChartProps {
  data: TrendPoint[]
  valueLabel: string
}

interface EngagementChartProps {
  data: EngagementPoint[]
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-AU', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)

const formatChange = (value: number) =>
  `${value >= 0 ? '↑' : '↓'} ${Math.abs(value).toFixed(1)}%`

function SimpleLineChart({
  data,
  valueLabel,
}: SimpleLineChartProps) {
  const width = 620
  const height = 220
  const left = 46
  const right = 20
  const top = 22
  const bottom = 42
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const values = data.map((item) => item.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const spread = Math.max(maxValue - minValue, 1)
  const paddedMin = Math.max(0, minValue - spread * 0.12)
  const paddedMax = maxValue + spread * 0.12
  const range = Math.max(paddedMax - paddedMin, 1)

  const points = data.map((item, index) => {
    const x =
      left +
      (data.length === 1
        ? plotWidth / 2
        : (index / (data.length - 1)) * plotWidth)
    const y =
      top +
      plotHeight -
      ((item.value - paddedMin) / range) * plotHeight

    return {
      ...item,
      x,
      y,
    }
  })

  const linePoints = points
    .map((point) => `${point.x},${point.y}`)
    .join(' ')

  const gridValues = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="admin-svg-chart-wrap">
      <svg
        className="admin-svg-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={valueLabel}
      >
        {gridValues.map((step) => {
          const y = top + plotHeight * step
          const labelValue = paddedMax - range * step

          return (
            <g key={step}>
              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                className="admin-chart-grid-line"
              />
              <text
                x={left - 9}
                y={y + 4}
                textAnchor="end"
                className="admin-chart-axis-text"
              >
                {formatNumber(Math.round(labelValue))}
              </text>
            </g>
          )
        })}

        <polyline
          points={linePoints}
          className="admin-chart-line-primary"
        />

        {points.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              className="admin-chart-point-primary"
            />
            <text
              x={point.x}
              y={height - 14}
              textAnchor="middle"
              className="admin-chart-axis-text"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function EngagementChart({ data }: EngagementChartProps) {
  const width = 620
  const height = 235
  const left = 48
  const right = 20
  const top = 22
  const bottom = 48
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const allValues = data.flatMap((item) => [
    item.likes,
    item.comments,
    item.follows,
  ])
  const maxValue = Math.max(...allValues, 1)
  const paddedMax = maxValue * 1.12

  const makePoints = (
    key: 'likes' | 'comments' | 'follows'
  ) =>
    data.map((item, index) => {
      const x =
        left +
        (data.length === 1
          ? plotWidth / 2
          : (index / (data.length - 1)) * plotWidth)
      const y =
        top +
        plotHeight -
        (item[key] / paddedMax) * plotHeight

      return {
        x,
        y,
        label: item.label,
      }
    })

  const series = [
    {
      key: 'likes' as const,
      label: 'Likes',
      className: 'admin-chart-line-primary',
      pointClass: 'admin-chart-point-primary',
    },
    {
      key: 'comments' as const,
      label: 'Comments',
      className: 'admin-chart-line-secondary',
      pointClass: 'admin-chart-point-secondary',
    },
    {
      key: 'follows' as const,
      label: 'Follows',
      className: 'admin-chart-line-tertiary',
      pointClass: 'admin-chart-point-tertiary',
    },
  ]

  return (
    <div>
      <div className="admin-chart-legend">
        <span><i className="legend-primary" /> Likes</span>
        <span><i className="legend-secondary" /> Comments</span>
        <span><i className="legend-tertiary" /> Follows</span>
      </div>

      <div className="admin-svg-chart-wrap">
        <svg
          className="admin-svg-chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Engagement trend"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((step) => {
            const y = top + plotHeight * step
            const labelValue = paddedMax * (1 - step)

            return (
              <g key={step}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                  className="admin-chart-grid-line"
                />
                <text
                  x={left - 9}
                  y={y + 4}
                  textAnchor="end"
                  className="admin-chart-axis-text"
                >
                  {formatNumber(Math.round(labelValue))}
                </text>
              </g>
            )
          })}

          {series.map((item) => {
            const points = makePoints(item.key)
            const linePoints = points
              .map((point) => `${point.x},${point.y}`)
              .join(' ')

            return (
              <g key={item.key}>
                <polyline
                  points={linePoints}
                  className={item.className}
                />
                {points.map((point) => (
                  <circle
                    key={`${item.key}-${point.label}`}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    className={item.pointClass}
                  />
                ))}
              </g>
            )
          })}

          {data.map((item, index) => {
            const x =
              left +
              (data.length === 1
                ? plotWidth / 2
                : (index / (data.length - 1)) * plotWidth)

            return (
              <text
                key={item.label}
                x={x}
                y={height - 16}
                textAnchor="middle"
                className="admin-chart-axis-text"
              >
                {item.label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const [activeSection, setActiveSection] =
    useState<AdminSection>('overview')

  const [users, setUsers] =
    useState<AdminUser[]>(mockUsers)

  const [reports, setReports] =
    useState<AdminReport[]>(mockReports)

  const [searchText, setSearchText] =
    useState('')

  const [analyticsPeriod, setAnalyticsPeriod] =
    useState<AnalyticsPeriod>('30d')

  const analytics = analyticsByPeriod[analyticsPeriod]

  const filteredUsers = useMemo(() => {
    const search = searchText.trim().toLowerCase()

    if (!search) {
      return users
    }

    return users.filter((user) =>
      user.name.toLowerCase().includes(search)
      ||
      user.email.toLowerCase().includes(search)
      ||
      user.accountType.toLowerCase().includes(search)
      ||
      user.status.toLowerCase().includes(search)
    )
  }, [searchText, users])

  const handleUserStatusChange = (
    userId: number
  ) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (user.id !== userId) {
          return user
        }

        return {
          ...user,
          status:
            user.status === 'SUSPENDED'
              ? 'ACTIVE'
              : 'SUSPENDED',
        }
      })
    )
  }

  const handleReportStatusChange = (
    reportId: number,
    status: AdminReport['status']
  ) => {
    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status,
            }
          : report
      )
    )
  }

  const renderOverview = () => (
    <>
      <section className="admin-welcome-section">
        <div>
          <p className="admin-eyebrow">
            ADMINISTRATION
          </p>

          <h1>Admin Dashboard</h1>

          <p className="admin-welcome-text">
            Monitor users, review reports, moderate platform
            content and keep track of recent activity.
          </p>
        </div>

        <div className="admin-role-badge">
          Administrator
        </div>
      </section>

      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">👥</div>
          <div>
            <span>Total Users</span>
            <strong>{adminStats.totalUsers.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">✅</div>
          <div>
            <span>Active Users</span>
            <strong>{adminStats.activeUsers.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">⛔</div>
          <div>
            <span>Suspended Users</span>
            <strong>{adminStats.suspendedUsers}</strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🏢</div>
          <div>
            <span>Organisations</span>
            <strong>{adminStats.organisations}</strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🚩</div>
          <div>
            <span>Open Reports</span>
            <strong>{adminStats.openReports}</strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">📅</div>
          <div>
            <span>Active Events</span>
            <strong>{adminStats.activeEvents}</strong>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">🤝</div>
          <div>
            <span>Open Opportunities</span>
            <strong>{adminStats.openOpportunities}</strong>
          </div>
        </div>

        <button
          type="button"
          className="admin-stat-card admin-analytics-shortcut"
          onClick={() => setActiveSection('analytics')}
        >
          <div className="admin-stat-icon">📈</div>
          <div>
            <span>Analytics</span>
            <strong>View Trends</strong>
          </div>
        </button>
      </section>

      <section className="admin-overview-grid">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Recent Users</h2>
              <p>Latest accounts created on the platform.</p>
            </div>

            <button
              className="admin-text-button"
              onClick={() => setActiveSection('users')}
            >
              View all
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {users.slice(0, 4).map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>{user.accountType}</td>
                    <td>
                      <span
                        className={`admin-status admin-status-${user.status.toLowerCase()}`}
                      >
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Reports Requiring Attention</h2>
              <p>Review recent safety and moderation reports.</p>
            </div>

            <button
              className="admin-text-button"
              onClick={() => setActiveSection('reports')}
            >
              View all
            </button>
          </div>

          <div className="admin-report-list">
            {reports
              .filter(
                (report) =>
                  report.status === 'OPEN'
                  || report.status === 'UNDER_REVIEW'
              )
              .slice(0, 3)
              .map((report) => (
                <div
                  key={report.id}
                  className="admin-report-item"
                >
                  <div>
                    <strong>
                      {report.targetType} · {report.targetName}
                    </strong>
                    <span>{report.reason}</span>
                  </div>

                  <span
                    className={`admin-status admin-status-${report.status.toLowerCase()}`}
                  >
                    {report.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Recent Activity</h2>
            <p>Latest activity across the platform.</p>
          </div>
        </div>

        <div className="admin-activity-list">
          {recentActivities.map((activity) => (
            <div
              key={activity.id}
              className="admin-activity-item"
            >
              <div className="admin-activity-dot" />
              <div className="admin-activity-content">
                <strong>{activity.action}</strong>
                <span>{activity.description}</span>
              </div>
              <small>{activity.time}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  const renderAnalytics = () => {
    const maxCreatorInteractions = Math.max(
      ...analytics.topCreators.map((creator) => creator.interactions),
      1
    )
    const maxPostLikes = Math.max(
      ...analytics.topPosts.map((post) => post.likes),
      1
    )
    const maxProfileViews = Math.max(
      ...analytics.mostViewedProfiles.map((profile) => profile.views),
      1
    )
    const maxFunnelValue = Math.max(
      ...analytics.collaborationFunnel.map((item) => item.value),
      1
    )

    return (
      <>
        <section className="admin-analytics-header admin-panel">
          <div>
            <p className="admin-eyebrow">PLATFORM ANALYTICS</p>
            <h1>Performance & Engagement</h1>
            <p>
              Analyse growth, engagement, top creators, popular
              content, collaborations, events and moderation trends.
            </p>
          </div>

          <div className="admin-analytics-controls">
            <label htmlFor="analytics-period">Period</label>
            <select
              id="analytics-period"
              value={analyticsPeriod}
              onChange={(event) =>
                setAnalyticsPeriod(
                  event.target.value as AnalyticsPeriod
                )
              }
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last 1 Year</option>
            </select>
          </div>
        </section>

        <div className="admin-preview-banner">
          <span>ℹ️</span>
          <div>
            <strong>Analytics preview data</strong>
            <p>
              These figures are frontend mock data for the current
              prototype. They will be replaced with live API data after
              backend analytics endpoints are connected. Profile-view
              analytics will also require view-tracking in the backend.
            </p>
          </div>
        </div>

        <section className="admin-analytics-kpi-grid">
          <div className="admin-analytics-kpi">
            <span>New Users</span>
            <strong>{formatNumber(analytics.summary.newUsers)}</strong>
            <small className="positive-change">
              {formatChange(analytics.summary.newUsersChange)} vs previous period
            </small>
          </div>

          <div className="admin-analytics-kpi">
            <span>Active Users</span>
            <strong>{formatNumber(analytics.summary.activeUsers)}</strong>
            <small className="positive-change">
              {formatChange(analytics.summary.activeUsersChange)} vs previous period
            </small>
          </div>

          <div className="admin-analytics-kpi">
            <span>Total Likes</span>
            <strong>{formatNumber(analytics.summary.totalLikes)}</strong>
            <small className="positive-change">
              {formatChange(analytics.summary.totalLikesChange)} vs previous period
            </small>
          </div>

          <div className="admin-analytics-kpi">
            <span>Followers Gained</span>
            <strong>{formatNumber(analytics.summary.followersGained)}</strong>
            <small className="positive-change">
              {formatChange(analytics.summary.followersChange)} vs previous period
            </small>
          </div>

          <div className="admin-analytics-kpi">
            <span>Event Registrations</span>
            <strong>{formatNumber(analytics.summary.eventRegistrations)}</strong>
            <small>{analytics.label}</small>
          </div>

          <div className="admin-analytics-kpi">
            <span>Applications</span>
            <strong>{formatNumber(analytics.summary.applications)}</strong>
            <small>{analytics.label}</small>
          </div>

          <div className="admin-analytics-kpi">
            <span>Reports Created</span>
            <strong>{formatNumber(analytics.summary.reportsCreated)}</strong>
            <small>{analytics.label}</small>
          </div>
        </section>

        <section className="admin-analytics-two-column">
          <div className="admin-panel admin-chart-panel">
            <div className="admin-panel-header">
              <div>
                <h2>User Growth</h2>
                <p>Total registered users over {analytics.label.toLowerCase()}.</p>
              </div>
              <span className="admin-chart-value">
                {adminStats.totalUsers.toLocaleString()} users
              </span>
            </div>
            <SimpleLineChart
              data={analytics.userGrowth}
              valueLabel="User growth"
            />
          </div>

          <div className="admin-panel admin-chart-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Active Users</h2>
                <p>User activity trend for the selected period.</p>
              </div>
              <span className="admin-chart-value">
                {formatNumber(analytics.summary.activeUsers)} active
              </span>
            </div>
            <SimpleLineChart
              data={analytics.activeUsersTrend}
              valueLabel="Active users"
            />
          </div>
        </section>

        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Platform Engagement</h2>
              <p>Likes, comments and new follows over time.</p>
            </div>
            <span className="admin-chart-value">{analytics.label}</span>
          </div>
          <EngagementChart data={analytics.engagement} />
        </section>

        <section className="admin-analytics-two-column">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Top Creators</h2>
                <p>Ranked by total engagement.</p>
              </div>
              <span className="admin-chart-value">{analytics.label}</span>
            </div>

            <div className="admin-ranking-list">
              {analytics.topCreators.map((creator, index) => (
                <div className="admin-ranking-row" key={creator.id}>
                  <div className="admin-ranking-number">{index + 1}</div>
                  <div className="admin-ranking-details">
                    <div className="admin-ranking-heading">
                      <div>
                        <strong>{creator.name}</strong>
                        <span>{creator.category}</span>
                      </div>
                      <b>{formatNumber(creator.interactions)}</b>
                    </div>
                    <div className="admin-horizontal-track">
                      <div
                        className="admin-horizontal-fill"
                        style={{
                          width: `${
                            (creator.interactions / maxCreatorInteractions) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <div className="admin-ranking-meta">
                      <span>{formatNumber(creator.likes)} likes</span>
                      <span>+{formatNumber(creator.followersGained)} followers</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Most Liked Posts</h2>
                <p>Posts receiving the most reactions.</p>
              </div>
              <span className="admin-chart-value">{analytics.label}</span>
            </div>

            <div className="admin-ranking-list compact-ranking-list">
              {analytics.topPosts.map((post, index) => (
                <div className="admin-ranking-row" key={post.id}>
                  <div className="admin-ranking-number">{index + 1}</div>
                  <div className="admin-ranking-details">
                    <div className="admin-ranking-heading">
                      <div>
                        <strong>{post.title}</strong>
                        <span>{post.creator}</span>
                      </div>
                      <b>♥ {formatNumber(post.likes)}</b>
                    </div>
                    <div className="admin-horizontal-track">
                      <div
                        className="admin-horizontal-fill admin-horizontal-fill-alt"
                        style={{
                          width: `${(post.likes / maxPostLikes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-analytics-three-column">
          <div className="admin-panel admin-donut-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Account Status</h2>
                <p>Current user account distribution.</p>
              </div>
            </div>

            <div className="admin-donut-content">
              <div
                className="admin-donut"
                style={{
                  background: `conic-gradient(
                    #7567df 0 ${analytics.accountDistribution.active}%,
                    #d34a57 ${analytics.accountDistribution.active}% ${analytics.accountDistribution.active + analytics.accountDistribution.suspended}%,
                    #e2a12b ${analytics.accountDistribution.active + analytics.accountDistribution.suspended}% 100%
                  )`,
                }}
              >
                <div className="admin-donut-hole">
                  <strong>{adminStats.totalUsers.toLocaleString()}</strong>
                  <span>Users</span>
                </div>
              </div>

              <div className="admin-donut-legend">
                <span><i className="dot-active" /> Active {analytics.accountDistribution.active}%</span>
                <span><i className="dot-suspended" /> Suspended {analytics.accountDistribution.suspended}%</span>
                <span><i className="dot-pending" /> Pending {analytics.accountDistribution.pending}%</span>
              </div>
            </div>
          </div>

          <div className="admin-panel admin-donut-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Account Types</h2>
                <p>Individual and organisation accounts.</p>
              </div>
            </div>

            <div className="admin-donut-content">
              <div
                className="admin-donut"
                style={{
                  background: `conic-gradient(
                    #514aa6 0 ${analytics.accountTypes.people}%,
                    #c1758b ${analytics.accountTypes.people}% 100%
                  )`,
                }}
              >
                <div className="admin-donut-hole">
                  <strong>{analytics.accountTypes.people}%</strong>
                  <span>People</span>
                </div>
              </div>

              <div className="admin-donut-legend">
                <span><i className="dot-people" /> Individuals {analytics.accountTypes.people}%</span>
                <span><i className="dot-org" /> Organisations {analytics.accountTypes.organisations}%</span>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Report Categories</h2>
                <p>Why content and accounts are reported.</p>
              </div>
            </div>

            <div className="admin-category-bars">
              {analytics.reportCategories.map((category) => (
                <div key={category.name} className="admin-category-row">
                  <div>
                    <span>{category.name}</span>
                    <strong>{category.value}%</strong>
                  </div>
                  <div className="admin-horizontal-track">
                    <div
                      className="admin-horizontal-fill admin-report-fill"
                      style={{ width: `${category.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="admin-analytics-two-column">
          <div className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Collaboration Funnel</h2>
                <p>From opportunity creation to project team formation.</p>
              </div>
            </div>

            <div className="admin-funnel-list">
              {analytics.collaborationFunnel.map((item) => (
                <div className="admin-funnel-item" key={item.label}>
                  <div className="admin-funnel-heading">
                    <span>{item.label}</span>
                    <strong>{formatNumber(item.value)}</strong>
                  </div>
                  <div
                    className="admin-funnel-bar"
                    style={{
                      width: `${Math.max(
                        28,
                        (item.value / maxFunnelValue) * 100
                      )}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel admin-chart-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Event Registrations</h2>
                <p>Registration activity for platform events.</p>
              </div>
              <span className="admin-chart-value">
                {formatNumber(analytics.summary.eventRegistrations)} registrations
              </span>
            </div>
            <SimpleLineChart
              data={analytics.eventRegistrationsTrend}
              valueLabel="Event registrations"
            />
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Most Viewed Profiles</h2>
              <p>
                Preview of profile-view analytics. Real values require
                backend profile-view tracking.
              </p>
            </div>
            <span className="admin-tracking-badge">Tracking needed</span>
          </div>

          <div className="admin-profile-view-grid">
            {analytics.mostViewedProfiles.map((profile, index) => (
              <div className="admin-profile-view-card" key={profile.id}>
                <div className="admin-profile-rank">#{index + 1}</div>
                <div className="admin-profile-view-info">
                  <strong>{profile.name}</strong>
                  <span>{profile.category}</span>
                  <div className="admin-horizontal-track">
                    <div
                      className="admin-horizontal-fill admin-profile-fill"
                      style={{
                        width: `${(profile.views / maxProfileViews) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="admin-profile-view-number">
                  <strong>{formatNumber(profile.views)}</strong>
                  <span>views</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </>
    )
  }

  const renderUsers = () => (
    <section className="admin-panel">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">USER MANAGEMENT</p>
          <h1>Platform Users</h1>
          <p>
            View user accounts and manage their current account status.
          </p>
        </div>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search users by name, email, type or status..."
          className="admin-search-input"
        />
        <span className="admin-result-count">
          {filteredUsers.length} users
        </span>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Account Type</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{user.accountType}</td>
                <td>
                  <span
                    className={`admin-status admin-status-${user.status.toLowerCase()}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td>{user.joinedDate}</td>
                <td>
                  <button
                    className={
                      user.status === 'SUSPENDED'
                        ? 'admin-action-button admin-action-enable'
                        : 'admin-action-button admin-action-danger'
                    }
                    onClick={() => handleUserStatusChange(user.id)}
                  >
                    {user.status === 'SUSPENDED'
                      ? 'Reactivate'
                      : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderReports = () => (
    <section className="admin-panel">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">SAFETY & MODERATION</p>
          <h1>Reports</h1>
          <p>
            Review reported users, posts, portfolio items and events.
          </p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reported By</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Created</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>#{report.id}</td>
                <td>{report.reportedBy}</td>
                <td>
                  <strong>{report.targetType}</strong>
                  <div className="admin-table-secondary">
                    {report.targetName}
                  </div>
                </td>
                <td>{report.reason}</td>
                <td>{report.createdDate}</td>
                <td>
                  <span
                    className={`admin-status admin-status-${report.status.toLowerCase()}`}
                  >
                    {report.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <select
                    className="admin-status-select"
                    value={report.status}
                    onChange={(event) =>
                      handleReportStatusChange(
                        report.id,
                        event.target.value as AdminReport['status']
                      )
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DISMISSED">Dismissed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderContent = () => (
    <section className="admin-panel">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">CONTENT MODERATION</p>
          <h1>Content Management</h1>
          <p>Review platform content that may require moderation.</p>
        </div>
      </div>

      <div className="admin-content-grid">
        <div className="admin-content-card">
          <span>📝</span>
          <h3>Posts</h3>
          <p>Review reported or removed community posts.</p>
          <button>Manage Posts</button>
        </div>

        <div className="admin-content-card">
          <span>🎨</span>
          <h3>Portfolio Items</h3>
          <p>Review reported portfolio content and media.</p>
          <button>Manage Portfolio</button>
        </div>

        <div className="admin-content-card">
          <span>🤝</span>
          <h3>Opportunities</h3>
          <p>Review collaboration opportunities and status.</p>
          <button>Manage Opportunities</button>
        </div>

        <div className="admin-content-card">
          <span>📅</span>
          <h3>Events</h3>
          <p>Review event listings and moderation status.</p>
          <button>Manage Events</button>
        </div>
      </div>
    </section>
  )

  const renderAudit = () => (
    <section className="admin-panel">
      <div className="admin-page-heading">
        <div>
          <p className="admin-eyebrow">ACCOUNTABILITY</p>
          <h1>Audit Logs</h1>
          <p>View recent administrative and platform activity.</p>
        </div>
      </div>

      <div className="admin-activity-list">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="admin-activity-item"
          >
            <div className="admin-activity-dot" />
            <div className="admin-activity-content">
              <strong>{activity.action}</strong>
              <span>{activity.description}</span>
            </div>
            <small>{activity.time}</small>
          </div>
        ))}
      </div>
    </section>
  )

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading">
          <div className="admin-shield">🛡️</div>
          <div>
            <strong>Admin Panel</strong>
            <span>Creative Collab</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <button
            className={activeSection === 'overview' ? 'active' : ''}
            onClick={() => setActiveSection('overview')}
          >
            <span>📊</span>
            Overview
          </button>

          <button
            className={activeSection === 'analytics' ? 'active' : ''}
            onClick={() => setActiveSection('analytics')}
          >
            <span>📈</span>
            Analytics
          </button>

          <button
            className={activeSection === 'users' ? 'active' : ''}
            onClick={() => setActiveSection('users')}
          >
            <span>👥</span>
            User Management
          </button>

          <button
            className={activeSection === 'reports' ? 'active' : ''}
            onClick={() => setActiveSection('reports')}
          >
            <span>🚩</span>
            Reports
          </button>

          <button
            className={activeSection === 'content' ? 'active' : ''}
            onClick={() => setActiveSection('content')}
          >
            <span>🛡️</span>
            Content
          </button>

          <button
            className={activeSection === 'audit' ? 'active' : ''}
            onClick={() => setActiveSection('audit')}
          >
            <span>📋</span>
            Audit Logs
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>ADMIN</span>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'analytics' && renderAnalytics()}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'reports' && renderReports()}
        {activeSection === 'content' && renderContent()}
        {activeSection === 'audit' && renderAudit()}
      </main>
    </div>
  )
}

export default AdminDashboard
