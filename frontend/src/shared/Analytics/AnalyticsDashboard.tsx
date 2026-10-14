import { useMemo, useState } from 'react'
import './AnalyticsDashboard.css'

export type AnalyticsMode = 'admin' | 'superAdmin'

type Period = 'today' | '7d' | '30d' | '6m' | '1y' | 'custom'
type EngagementMetric = 'engagement' | 'reactions' | 'posts' | 'follows' | 'comments'
type RankingMetric = 'followers' | 'engagement' | 'posts' | 'reactions'

type AnalyticsPoint = {
  label: string
  activeUsers: number
  newUsers: number
  posts: number
  reactions: number
  comments: number
  follows: number
  engagement: number
  reportsReceived: number
  reportsResolved: number
  eventRegistrations: number
  applications: number
}

type TopUser = {
  id: number
  name: string
  username: string
  followers: number
  engagement: number
  posts: number
  reactions: number
}

type TopPost = {
  id: number
  title: string
  creator: string
  reactions: number
  comments: number
}

type PopularEvent = {
  id: number
  title: string
  registrations: number
  type: 'FREE' | 'PAID'
}

type AdminPerformance = {
  id: number
  name: string
  assigned: number
  resolved: number
  open: number
  averageHours: number
}

type Props = {
  mode: AnalyticsMode
}

const topUsers: TopUser[] = [
  { id: 1, name: 'Ravi Kumar', username: '@ravik', followers: 2482, engagement: 1248, posts: 148, reactions: 6420 },
  { id: 2, name: 'Priya Sharma', username: '@priyasharma', followers: 2175, engagement: 1043, posts: 132, reactions: 5710 },
  { id: 3, name: 'Daniel Lee', username: '@danielcreative', followers: 1940, engagement: 895, posts: 121, reactions: 4892 },
  { id: 4, name: 'Sarah Wilson', username: '@sarahw', followers: 1710, engagement: 760, posts: 114, reactions: 4240 },
  { id: 5, name: 'James Brown', username: '@jamesdesign', followers: 1382, engagement: 681, posts: 96, reactions: 3891 },
]

const topPosts: TopPost[] = [
  { id: 240, title: 'Photography Showcase', creator: 'Ravi Kumar', reactions: 842, comments: 96 },
  { id: 255, title: 'Design Collaboration', creator: 'Priya Sharma', reactions: 711, comments: 83 },
  { id: 268, title: 'Film Project Update', creator: 'Daniel Lee', reactions: 625, comments: 71 },
  { id: 281, title: 'Creative Networking Tips', creator: 'Sarah Wilson', reactions: 589, comments: 64 },
]

const popularEvents: PopularEvent[] = [
  { id: 31, title: 'Creative Networking Night', registrations: 182, type: 'PAID' },
  { id: 36, title: 'Photography Workshop', registrations: 147, type: 'PAID' },
  { id: 42, title: 'Design Meetup', registrations: 131, type: 'FREE' },
  { id: 48, title: 'Independent Film Session', registrations: 108, type: 'FREE' },
]

const adminPerformance: AdminPerformance[] = [
  { id: 1, name: 'Arjun Patel', assigned: 34, resolved: 29, open: 5, averageHours: 2.1 },
  { id: 2, name: 'Sarah Wilson', assigned: 31, resolved: 30, open: 1, averageHours: 1.8 },
  { id: 3, name: 'Daniel Lee', assigned: 27, resolved: 23, open: 4, averageHours: 2.6 },
]

const accountDistribution = [
  { label: 'Creative Professional', value: 850 },
  { label: 'Organisation', value: 250 },
  { label: 'Guardian', value: 100 },
  { label: 'Admin', value: 40 },
  { label: 'Super Admin', value: 10 },
]

function buildPoint(label: string, index: number, scale = 1): AnalyticsPoint {
  const wave = Math.sin(index * 0.85) * 18

  const activeUsers = Math.round((390 + index * 14 + wave) * scale)
  const newUsers = Math.max(1, Math.round((17 + index * 1.8 + Math.cos(index) * 4) * scale))
  const posts = Math.max(1, Math.round((52 + index * 3.2 + Math.sin(index * 1.1) * 9) * scale))
  const reactions = Math.max(1, Math.round((380 + index * 31 + Math.cos(index * 0.7) * 55) * scale))
  const comments = Math.max(1, Math.round((29 + index * 2.2 + Math.sin(index) * 5) * scale))
  const follows = Math.max(1, Math.round((54 + index * 4 + Math.cos(index * 0.8) * 8) * scale))

  return {
    label,
    activeUsers,
    newUsers,
    posts,
    reactions,
    comments,
    follows,
    engagement: reactions + comments + follows,
    reportsReceived: Math.max(1, Math.round(4 + index * 0.7 + Math.sin(index) * 2)),
    reportsResolved: Math.max(0, Math.round(3 + index * 0.65 + Math.cos(index) * 1.5)),
    eventRegistrations: Math.max(1, Math.round((24 + index * 4 + Math.sin(index * 0.6) * 7) * scale)),
    applications: Math.max(1, Math.round((20 + index * 3 + Math.cos(index * 0.7) * 6) * scale)),
  }
}

function getTodaySeries() {
  const hours = ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM']
  return hours.map((hour, index) => buildPoint(hour, index, 0.35))
}

function get7DaySeries() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map((day, index) => buildPoint(day, index, 1))
}

function get30DaySeries() {
  return Array.from({ length: 30 }, (_, index) => buildPoint(`${index + 1} Oct`, index, 1))
}

function get6MonthSeries() {
  const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
  return months.map((month, index) => buildPoint(month, index + 3, 5.2))
}

function get1YearSeries() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month, index) => buildPoint(month, index + 2, 5.5))
}

function getCustomSeries(startDate: string, endDate: string) {
  if (!startDate || !endDate) return get7DaySeries()

  const start = new Date(startDate)
  const end = new Date(endDate)

  const difference = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (Number.isNaN(difference) || difference < 0) return get7DaySeries()

  const count = Math.min(difference + 1, 60)

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    return buildPoint(
      date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      index,
      1,
    )
  })
}

function getSeries(period: Period, startDate: string, endDate: string) {
  switch (period) {
    case 'today':
      return getTodaySeries()
    case '7d':
      return get7DaySeries()
    case '30d':
      return get30DaySeries()
    case '6m':
      return get6MonthSeries()
    case '1y':
      return get1YearSeries()
    case 'custom':
      return getCustomSeries(startDate, endDate)
    default:
      return get7DaySeries()
  }
}

function LineChart({
  data,
  series,
}: {
  data: AnalyticsPoint[]
  series: { key: keyof AnalyticsPoint; label: string }[]
}) {
  const width = 900
  const height = 280
  const paddingLeft = 48
  const paddingRight = 25
  const paddingTop = 25
  const paddingBottom = 48

  const allValues = series.flatMap((item) =>
    data.map((point) => Number(point[item.key])),
  )

  const maximum = Math.max(...allValues, 1)
  const minimum = Math.min(...allValues, 0)
  const range = maximum - minimum || 1

  const xPosition = (index: number) =>
    paddingLeft +
    (index / Math.max(data.length - 1, 1)) *
      (width - paddingLeft - paddingRight)

  const yPosition = (value: number) =>
    height -
    paddingBottom -
    ((value - minimum) / range) *
      (height - paddingTop - paddingBottom)

  const visibleLabels =
    data.length <= 12
      ? data.map((_, index) => index)
      : data
          .map((_, index) => index)
          .filter(
            (index) =>
              index === 0 ||
              index === data.length - 1 ||
              index % Math.ceil(data.length / 8) === 0,
          )

  return (
    <div className="analytics-chart-wrapper">
      <svg
        className="analytics-line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Analytics chart"
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const y =
            paddingTop +
            (step / 4) *
              (height - paddingTop - paddingBottom)

          return (
            <line
              key={step}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              className="analytics-grid-line"
            />
          )
        })}

        {series.map((currentSeries, seriesIndex) => {
          const points = data
            .map(
              (item, index) =>
                `${xPosition(index)},${yPosition(
                  Number(item[currentSeries.key]),
                )}`,
            )
            .join(' ')

          return (
            <g key={currentSeries.label}>
              <polyline
                points={points}
                fill="none"
                className={`analytics-series analytics-series-${seriesIndex + 1}`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {data.length <= 30 &&
                data.map((item, index) => (
                  <circle
                    key={`${currentSeries.label}-${index}`}
                    cx={xPosition(index)}
                    cy={yPosition(Number(item[currentSeries.key]))}
                    r="4"
                    className={`analytics-dot analytics-dot-${seriesIndex + 1}`}
                  />
                ))}
            </g>
          )
        })}

        {visibleLabels.map((index) => (
          <text
            key={`label-${index}`}
            x={xPosition(index)}
            y={height - 14}
            textAnchor="middle"
            className="analytics-axis-label"
          >
            {data[index].label}
          </text>
        ))}
      </svg>

      <div className="analytics-chart-legend">
        {series.map((item, index) => (
          <div key={item.label}>
            <span
              className={`analytics-legend-dot analytics-legend-${index + 1}`}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function RankingBars({
  users,
  metric,
}: {
  users: TopUser[]
  metric: RankingMetric
}) {
  const maximum = Math.max(...users.map((user) => user[metric]), 1)

  return (
    <div className="analytics-ranking-bars">
      {users.map((user, index) => (
        <div className="analytics-ranking-row" key={user.id}>
          <div className="analytics-rank-number">{index + 1}</div>

          <div className="analytics-ranking-user">
            <strong>{user.name}</strong>
            <span>{user.username}</span>
          </div>

          <div className="analytics-ranking-progress">
            <span
              style={{
                width: `${(user[metric] / maximum) * 100}%`,
              }}
            />
          </div>

          <strong className="analytics-ranking-value">
            {user[metric].toLocaleString()}
          </strong>
        </div>
      ))}
    </div>
  )
}

function AnalyticsDashboard({ mode }: Props) {
  const [period, setPeriod] = useState<Period>('7d')
  const [engagementMetric, setEngagementMetric] =
    useState<EngagementMetric>('engagement')
  const [rankingMetric, setRankingMetric] =
    useState<RankingMetric>('followers')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const data = useMemo(
    () => getSeries(period, customStartDate, customEndDate),
    [period, customStartDate, customEndDate],
  )

  const totals = useMemo(() => {
    return data.reduce(
      (result, point) => {
        result.newUsers += point.newUsers
        result.posts += point.posts
        result.reactions += point.reactions
        result.comments += point.comments
        result.follows += point.follows
        result.engagement += point.engagement
        result.reportsReceived += point.reportsReceived
        result.reportsResolved += point.reportsResolved
        result.eventRegistrations += point.eventRegistrations
        result.applications += point.applications
        return result
      },
      {
        newUsers: 0,
        posts: 0,
        reactions: 0,
        comments: 0,
        follows: 0,
        engagement: 0,
        reportsReceived: 0,
        reportsResolved: 0,
        eventRegistrations: 0,
        applications: 0,
      },
    )
  }, [data])

  const latestActiveUsers =
    data.length > 0 ? data[data.length - 1].activeUsers : 0

  const rankedUsers = useMemo(
    () =>
      [...topUsers].sort(
        (first, second) =>
          second[rankingMetric] - first[rankingMetric],
      ),
    [rankingMetric],
  )

  const handleRefresh = () => {
    setRefreshError('')
    setIsRefreshing(true)

    window.setTimeout(() => {
      setLastUpdated(new Date())
      setIsRefreshing(false)
    }, 500)
  }

  const exportCsv = () => {
    try {
      const headers = [
        'Period',
        'Active Users',
        'New Users',
        'Posts',
        'Reactions',
        'Comments',
        'Follows',
        'Engagement',
        'Reports Received',
        'Reports Resolved',
        'Event Registrations',
        'Applications',
      ]

      const rows = data.map((point) => [
        point.label,
        point.activeUsers,
        point.newUsers,
        point.posts,
        point.reactions,
        point.comments,
        point.follows,
        point.engagement,
        point.reportsReceived,
        point.reportsResolved,
        point.eventRegistrations,
        point.applications,
      ])

      const csv = [headers, ...rows]
        .map((row) => row.join(','))
        .join('\n')

      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `creative-collab-${mode}-analytics.csv`
      link.click()

      URL.revokeObjectURL(url)
    } catch {
      setRefreshError('Unable to export analytics.')
    }
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-toolbar">
        <div className="analytics-period-buttons">
          <button
            className={period === 'today' ? 'active' : ''}
            onClick={() => setPeriod('today')}
          >
            Today
          </button>

          <button
            className={period === '7d' ? 'active' : ''}
            onClick={() => setPeriod('7d')}
          >
            7 Days
          </button>

          <button
            className={period === '30d' ? 'active' : ''}
            onClick={() => setPeriod('30d')}
          >
            30 Days
          </button>

          <button
            className={period === '6m' ? 'active' : ''}
            onClick={() => setPeriod('6m')}
          >
            6 Months
          </button>

          <button
            className={period === '1y' ? 'active' : ''}
            onClick={() => setPeriod('1y')}
          >
            1 Year
          </button>

          <button
            className={period === 'custom' ? 'active' : ''}
            onClick={() => setPeriod('custom')}
          >
            Custom
          </button>
        </div>

        <div className="analytics-toolbar-actions">
          <div className="analytics-live-status">
            <span className="analytics-live-dot" />

            <div>
              <strong>Live</strong>
              <small>
                Updated{' '}
                {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </small>
            </div>
          </div>

          <button
            className="analytics-secondary-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            className="analytics-primary-button"
            onClick={exportCsv}
          >
            Export CSV
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="analytics-custom-range">
          <label>
            From
            <input
              type="date"
              value={customStartDate}
              onChange={(event) =>
                setCustomStartDate(event.target.value)
              }
            />
          </label>

          <label>
            To
            <input
              type="date"
              value={customEndDate}
              onChange={(event) =>
                setCustomEndDate(event.target.value)
              }
            />
          </label>
        </div>
      )}

      {refreshError && (
        <div className="analytics-error">
          {refreshError}
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      <section className="analytics-metric-grid">
        <article>
          <span>Total Users</span>
          <strong>1,250</strong>
          <small>Registered platform accounts</small>
        </article>

        <article>
          <span>Active Users</span>
          <strong>{latestActiveUsers.toLocaleString()}</strong>
          <small>Current period activity</small>
        </article>

        <article>
          <span>New Users</span>
          <strong>{totals.newUsers.toLocaleString()}</strong>
          <small>Registrations in selected period</small>
        </article>

        <article>
          <span>Engagement</span>
          <strong>{totals.engagement.toLocaleString()}</strong>
          <small>Reactions + comments + follows</small>
        </article>

        <article>
          <span>Reports</span>
          <strong>{totals.reportsReceived.toLocaleString()}</strong>
          <small>Reports received</small>
        </article>

        <article>
          <span>Event Registrations</span>
          <strong>
            {totals.eventRegistrations.toLocaleString()}
          </strong>
          <small>Registrations in selected period</small>
        </article>
      </section>

      <section className="analytics-card">
        <div className="analytics-card-heading">
          <div>
            <h3>User Growth & Activity</h3>
            <p>
              Active users and new registrations over the selected
              period.
            </p>
          </div>
        </div>

        <LineChart
          data={data}
          series={[
            { key: 'activeUsers', label: 'Active Users' },
            { key: 'newUsers', label: 'New Users' },
          ]}
        />
      </section>

      <section className="analytics-card">
        <div className="analytics-card-heading">
          <div>
            <h3>Engagement Analytics</h3>
            <p>Track how users interact with platform content.</p>
          </div>

          <select
            value={engagementMetric}
            onChange={(event) =>
              setEngagementMetric(
                event.target.value as EngagementMetric,
              )
            }
          >
            <option value="engagement">Total Engagement</option>
            <option value="reactions">Reactions</option>
            <option value="posts">Posts</option>
            <option value="follows">Follows</option>
            <option value="comments">Comments</option>
          </select>
        </div>

        <div className="analytics-small-metrics">
          <div>
            <span>Posts</span>
            <strong>{totals.posts.toLocaleString()}</strong>
          </div>

          <div>
            <span>Reactions</span>
            <strong>{totals.reactions.toLocaleString()}</strong>
          </div>

          <div>
            <span>Comments</span>
            <strong>{totals.comments.toLocaleString()}</strong>
          </div>

          <div>
            <span>Follows</span>
            <strong>{totals.follows.toLocaleString()}</strong>
          </div>
        </div>

        <LineChart
          data={data}
          series={[
            {
              key: engagementMetric,
              label:
                engagementMetric === 'engagement'
                  ? 'Total Engagement'
                  : engagementMetric.charAt(0).toUpperCase() +
                    engagementMetric.slice(1),
            },
          ]}
        />
      </section>

      <section className="analytics-two-column">
        <article className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h3>Top Users</h3>
              <p>Highest-performing platform members.</p>
            </div>

            <select
              value={rankingMetric}
              onChange={(event) =>
                setRankingMetric(
                  event.target.value as RankingMetric,
                )
              }
            >
              <option value="followers">Followers</option>
              <option value="engagement">Engagement</option>
              <option value="posts">Posts</option>
              <option value="reactions">Reactions</option>
            </select>
          </div>

          <RankingBars users={rankedUsers} metric={rankingMetric} />
        </article>

        <article className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h3>Account Distribution</h3>
              <p>Accounts grouped by assigned platform role.</p>
            </div>
          </div>

          <div className="analytics-distribution-list">
            {accountDistribution.map((item) => {
              const percentage = (item.value / 1250) * 100

              return (
                <div key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <strong>
                      {item.value.toLocaleString()} (
                      {percentage.toFixed(1)}%)
                    </strong>
                  </div>

                  <div className="analytics-distribution-bar">
                    <span
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="analytics-two-column">
        <article className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h3>Top Performing Posts</h3>
              <p>Content receiving the highest interaction.</p>
            </div>
          </div>

          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Creator</th>
                  <th>Reactions</th>
                  <th>Comments</th>
                </tr>
              </thead>

              <tbody>
                {topPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <strong>{post.title}</strong>
                      <small>Post #{post.id}</small>
                    </td>

                    <td>{post.creator}</td>
                    <td>{post.reactions.toLocaleString()}</td>
                    <td>{post.comments.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h3>Popular Events</h3>
              <p>Events with the highest registrations.</p>
            </div>
          </div>

          <div className="analytics-event-list">
            {popularEvents.map((event, index) => (
              <div key={event.id}>
                <span className="analytics-event-rank">
                  {index + 1}
                </span>

                <div>
                  <strong>{event.title}</strong>
                  <span>
                    {event.type} • Event #{event.id}
                  </span>
                </div>

                <strong>
                  {event.registrations.toLocaleString()}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="analytics-two-column">
        <article className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h3>Report Analytics</h3>
              <p>
                Reports received compared with reports resolved.
              </p>
            </div>
          </div>

          <LineChart
            data={data}
            series={[
              { key: 'reportsReceived', label: 'Received' },
              { key: 'reportsResolved', label: 'Resolved' },
            ]}
          />

          <div className="analytics-small-metrics">
            <div>
              <span>Received</span>
              <strong>{totals.reportsReceived}</strong>
            </div>

            <div>
              <span>Resolved</span>
              <strong>{totals.reportsResolved}</strong>
            </div>

            <div>
              <span>Resolution Rate</span>
              <strong>
                {totals.reportsReceived > 0
                  ? `${(
                      (totals.reportsResolved /
                        totals.reportsReceived) *
                      100
                    ).toFixed(1)}%`
                  : '0%'}
              </strong>
            </div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h3>Collaboration Funnel</h3>
              <p>Opportunity and application activity.</p>
            </div>
          </div>

          <div className="analytics-funnel">
            <div>
              <span>Opportunities</span>
              <strong>420</strong>
            </div>

            <span className="analytics-funnel-arrow">↓</span>

            <div>
              <span>Applications</span>
              <strong>{totals.applications.toLocaleString()}</strong>
            </div>

            <span className="analytics-funnel-arrow">↓</span>

            <div>
              <span>Accepted</span>
              <strong>314</strong>
            </div>

            <span className="analytics-funnel-arrow">↓</span>

            <div>
              <span>Teams Formed</span>
              <strong>201</strong>
            </div>
          </div>
        </article>
      </section>

      {mode === 'superAdmin' && (
        <>
          <section className="analytics-card">
            <div className="analytics-card-heading">
              <div>
                <h3>Administrator Performance</h3>
                <p>
                  Assigned workload, resolutions and average handling
                  time.
                </p>
              </div>
            </div>

            <div className="analytics-table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Administrator</th>
                    <th>Assigned</th>
                    <th>Resolved</th>
                    <th>Open</th>
                    <th>Resolution Rate</th>
                    <th>Avg. Time</th>
                  </tr>
                </thead>

                <tbody>
                  {adminPerformance.map((admin) => {
                    const resolutionRate =
                      (admin.resolved / admin.assigned) * 100

                    return (
                      <tr key={admin.id}>
                        <td>
                          <strong>{admin.name}</strong>
                        </td>
                        <td>{admin.assigned}</td>
                        <td>{admin.resolved}</td>
                        <td>{admin.open}</td>
                        <td>{resolutionRate.toFixed(1)}%</td>
                        <td>{admin.averageHours}h</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="analytics-two-column">
            <article className="analytics-card">
              <div className="analytics-card-heading">
                <div>
                  <h3>Administrative Activity</h3>
                  <p>
                    High-level moderation and management activity.
                  </p>
                </div>
              </div>

              <div className="analytics-action-list">
                <div>
                  <span>Resolve Report</span>
                  <strong>74</strong>
                </div>
                <div>
                  <span>Assign Report</span>
                  <strong>41</strong>
                </div>
                <div>
                  <span>Suspend User</span>
                  <strong>32</strong>
                </div>
                <div>
                  <span>Remove Content</span>
                  <strong>18</strong>
                </div>
                <div>
                  <span>Role Change</span>
                  <strong>5</strong>
                </div>
                <div>
                  <span>Module Change</span>
                  <strong>2</strong>
                </div>
              </div>
            </article>

            <article className="analytics-card">
              <div className="analytics-card-heading">
                <div>
                  <h3>System Snapshot</h3>
                  <p>
                    Platform health and administrative overview.
                  </p>
                </div>
              </div>

              <div className="analytics-action-list">
                <div>
                  <span>Active Administrators</span>
                  <strong>3</strong>
                </div>
                <div>
                  <span>Unassigned Reports</span>
                  <strong>2</strong>
                </div>
                <div>
                  <span>Enabled Modules</span>
                  <strong>7</strong>
                </div>
                <div>
                  <span>API Status</span>
                  <strong className="analytics-healthy">
                    Healthy
                  </strong>
                </div>
                <div>
                  <span>Database</span>
                  <strong className="analytics-healthy">
                    Connected
                  </strong>
                </div>
              </div>
            </article>
          </section>
        </>
      )}

      <div className="analytics-development-note">
        <strong>Integration note:</strong>{' '}
        The current analytics values are frontend demonstration data.
        The filters, charts, CSV export and dashboard structure are ready
        to be connected to Spring Boot analytics APIs and MySQL aggregate
        queries.
      </div>
    </div>
  )
}

export default AnalyticsDashboard
