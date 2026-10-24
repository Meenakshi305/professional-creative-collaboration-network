import './SuperAdminLive.css'

export type SharedAnalyticsTotals = {
  users: number; posts: number; events: number; administrators: number;
  reports: number; pendingReports: number; upheldReports: number; dismissedReports: number
}

export default function LiveAnalyticsCharts({ data }: { data: SharedAnalyticsTotals }) {
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
