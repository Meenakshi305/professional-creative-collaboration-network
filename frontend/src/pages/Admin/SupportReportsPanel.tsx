
import { useCallback, useEffect, useState } from 'react'

import {
  adminSupportReportApi,
  type SupportReport,
  type SupportReportSummary,
  type ReportStatus
} from '../../service/adminSupportReportService'

type Props = {
  mode?: 'admin' | 'superadmin'
  onReportsChanged?: () => void
}

type Filter = 'ALL' | ReportStatus
type Decision = 'UPHELD' | 'DISMISSED'

export default function SupportReportsPanel({
  mode = 'admin',
  onReportsChanged
}: Props) {

  const [reports, setReports] = useState<SupportReport[]>([])
  const [summary, setSummary] =
    useState<SupportReportSummary | null>(null)

  const [filter, setFilter] = useState<Filter>('PENDING')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [selected, setSelected] =
    useState<SupportReport | null>(null)

  const [decision, setDecision] =
    useState<Decision>('UPHELD')

  const [note, setNote] = useState('')

  // ==========================================
  // LOAD REPORTS
  // ==========================================

  const load = useCallback(async () => {

    const [list, counters] = await Promise.all([
      adminSupportReportApi.all(filter),
      adminSupportReportApi.summary()
    ])

    setReports(list)
    setSummary(counters)

  }, [filter])

  useEffect(() => {
    let active = true

    setLoading(true)

    void load()
      .then(() => {
        if (active) setError('')
      })
      .catch(err => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load Settings Reports'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [load])

  // ==========================================
  // REVIEW A PENDING REPORT
  // ==========================================

  function openReview(report: SupportReport) {

    if (report.status !== 'PENDING') return

    setSelected(report)
    setDecision('UPHELD')
    setNote('')
    setError('')
    setMessage('')
  }

  async function submitReview() {

    if (!selected || saving) return

    if (note.trim().length < 10) {
      setError('Enter a reason of at least 10 characters.')
      return
    }

    setSaving(true)
    setError('')

    try {

      await adminSupportReportApi.resolve(
        selected.id,
        decision,
        note.trim()
      )

      setMessage(
        `Report #${selected.id} ${decision.toLowerCase()} successfully.`
      )

      setSelected(null)
      setNote('')

      await load()
      onReportsChanged?.()

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Review failed'
      )

      // Refresh status in case another moderator
      // already reviewed the report.
      try {
        await load()
      } catch {
        // Preserve the original review error.
      }

    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // SEARCH CURRENTLY LOADED REPORTS
  // ==========================================

  const filtered = reports.filter(report => {
    const query = search.trim().toLowerCase()

    if (!query) return true

    return [
      report.id,
      report.reportType,
      report.reporterUsername,
      report.reportedUsername,
      report.description,
      report.status
    ].some(value =>
      String(value ?? '')
        .toLowerCase()
        .includes(query)
    )
  })

  function formatDate(value: string | null) {
    if (!value) return '—'

    const parsed = new Date(value)

    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleString()
  }

  return (
    <section className={`support-reports support-reports-${mode}`}>

      <style>{`
        .support-reports {
          background: #fff;
          color: #172033;
          padding: 20px;
          border-radius: 12px;
        }

        .support-report-header,
        .support-report-toolbar,
        .support-report-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .support-report-header h2 {
          margin: 0 0 8px;
        }

        .support-report-header p {
          color: #64748b;
        }

        .support-report-summary {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
          margin: 20px 0;
        }

        .support-report-count {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 14px;
          border-radius: 10px;
        }

        .support-report-count span {
          display: block;
          color: #64748b;
          font-size: 13px;
        }

        .support-report-count strong {
          display: block;
          font-size: 25px;
          margin-top: 4px;
        }

        .support-report-toolbar {
          margin-bottom: 18px;
        }

        .support-report-toolbar input {
          flex: 1;
          min-width: 160px;
        }

        .support-reports input,
        .support-reports select,
        .support-reports textarea {
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #172033;
          box-sizing: border-box;
        }

        .support-reports button {
          padding: 9px 14px;
          border-radius: 8px;
          border: 1px solid #d8b4fe;
          background: #f5f3ff;
          color: #5b21b6;
          cursor: pointer;
        }

        .support-reports button:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .support-report-tablewrap {
          overflow-x: auto;
        }

        .support-report-table {
          border-collapse: collapse;
          width: 100%;
          font-size: 14px;
        }

        .support-report-table th,
        .support-report-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
          vertical-align: top;
        }

        .support-report-table th {
          background: #f8fafc;
        }

        .support-report-description {
          min-width: 180px;
          max-width: 330px;
          overflow-wrap: anywhere;
        }

        .support-report-primary {
          background: #6d28d9 !important;
          color: white !important;
        }

        .support-report-error {
          color: #b91c1c;
          overflow-wrap: anywhere;
        }

        .support-report-success {
          color: #166534;
        }

        .support-report-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15,23,42,.6);
          z-index: 10000;
          padding: 16px;
        }

        .support-report-modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 540px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-sizing: border-box;
        }

        .support-report-modal label {
          display: block;
          margin: 16px 0 6px;
        }

        .support-report-modal select,
        .support-report-modal textarea {
          width: 100%;
        }

        .support-report-actions {
          justify-content: flex-end;
          margin-top: 18px;
        }
      `}</style>

      <div className="support-report-header">
        <div>
          <h2>Settings Reports</h2>
          <p>
            Technical issues and user reports.
            Review without administrator assignment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('')
            void load().catch(err => {
              setError(
                err instanceof Error
                  ? err.message
                  : 'Refresh failed'
              )
            })
          }}
        >
          Refresh
        </button>
      </div>

      {summary && (
        <div className="support-report-summary">

          {[
            ['Total', summary.reports],
            ['Pending', summary.pendingReports],
            ['Upheld', summary.upheldReports],
            ['Dismissed', summary.dismissedReports]
          ].map(([label, value]) => (
            <div
              key={label}
              className="support-report-count"
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}

        </div>
      )}

      <div className="support-report-toolbar">

        <input
          type="search"
          placeholder="Search reports..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <button
          type="button"
          onClick={() => setSearch('')}
        >
          Clear
        </button>

        <select
          value={filter}
          onChange={e =>
            setFilter(e.target.value as Filter)
          }
        >
          <option value="PENDING">Pending</option>
          <option value="ALL">All</option>
          <option value="UPHELD">Upheld</option>
          <option value="DISMISSED">Dismissed</option>
        </select>

      </div>

      {error && (
        <p className="support-report-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="support-report-success" role="status">
          {message}
        </p>
      )}

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="support-report-tablewrap">

          <table className="support-report-table">

            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Submitted By</th>
                <th>Reported User</th>
                <th>Description</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Reviewed By</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>

              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    No Settings Reports found.
                  </td>
                </tr>
              ) : (
                filtered.map(report => (
                  <tr key={report.id}>

                    <td>#{report.id}</td>

                    <td>
                      {report.reportType === 'ISSUE'
                        ? 'Technical Issue'
                        : 'Report a User'}
                    </td>

                    <td>@{report.reporterUsername}</td>

                    <td>
                      {report.reportedUsername
                        ? `@${report.reportedUsername}`
                        : '—'}
                    </td>

                    <td className="support-report-description">
                      {report.description}
                    </td>

                    <td>{report.status}</td>

                    <td>{formatDate(report.createdAt)}</td>

                    <td>
                      {report.resolvedBy == null
                        ? '—'
                        : `User #${report.resolvedBy}`}
                    </td>

                    <td>
                      {report.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="support-report-primary"
                          onClick={() => openReview(report)}
                        >
                          Review
                        </button>
                      ) : (
                        'Reviewed'
                      )}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      )}

      {selected && (
        <div className="support-report-overlay">

          <div
            className="support-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
          >

            <h3 id="support-title">
              Review Report #{selected.id}
            </h3>

            <p>
              <strong>Submitted by:</strong>{' '}
              @{selected.reporterUsername}
            </p>

            <p>
              <strong>Description:</strong>{' '}
              {selected.description}
            </p>

            <label htmlFor="support-decision">
              Decision
            </label>

            <select
              id="support-decision"
              value={decision}
              disabled={saving}
              onChange={e =>
                setDecision(e.target.value as Decision)
              }
            >
              <option value="UPHELD">Uphold</option>
              <option value="DISMISSED">Dismiss</option>
            </select>

            <label htmlFor="support-note">
              Resolution note
            </label>

            <textarea
              id="support-note"
              rows={4}
              value={note}
              maxLength={2000}
              disabled={saving}
              onChange={e => setNote(e.target.value)}
            />

            <div className="support-report-actions">

              <button
                type="button"
                disabled={saving}
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="support-report-primary"
                disabled={saving || note.trim().length < 10}
                onClick={() => void submitReview()}
              >
                {saving ? 'Saving...' : 'Confirm Review'}
              </button>

            </div>

          </div>

        </div>
      )}

    </section>
  )
}
