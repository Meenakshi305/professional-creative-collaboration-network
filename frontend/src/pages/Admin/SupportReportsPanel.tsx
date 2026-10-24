
import { useCallback, useEffect, useState } from 'react'

import {
  adminSupportReportApi,
  type SupportReport,
  type SupportReportSummary
} from '../../service/adminSupportReportService'

type Props = {
  mode?: 'admin' | 'superadmin'
  onReportsChanged?: () => void
}

type ReportStatus = 'ALL' | 'PENDING' | 'UPHELD' | 'DISMISSED'
type ReviewDecision = 'UPHELD' | 'DISMISSED'

export default function SupportReportsPanel({
  mode = 'admin',
  onReportsChanged
}: Props) {
  const [reports, setReports] = useState<SupportReport[]>([])
  const [summary, setSummary] =
    useState<SupportReportSummary | null>(null)

  const [statusFilter, setStatusFilter] =
    useState<ReportStatus>('PENDING')

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selectedReport, setSelectedReport] =
    useState<SupportReport | null>(null)

  const [decision, setDecision] =
    useState<ReviewDecision>('UPHELD')

  const [note, setNote] = useState('')

  // ==========================================
  // LOAD ALL REPORTS AND SUMMARY
  // ==========================================

  const loadReports = useCallback(async () => {
    const [reportData, summaryData] = await Promise.all([
      adminSupportReportApi.all(statusFilter),
      adminSupportReportApi.summary()
    ])

    setReports(reportData)
    setSummary(summaryData)
  }, [statusFilter])

  // ==========================================
  // AUTOMATIC REFRESH EVERY 10 SECONDS
  // ==========================================

  useEffect(() => {
    let active = true

    setLoading(true)

    void loadReports()
      .then(() => {
        if (active) setError('')
      })
      .catch(err => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load Settings reports'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadReports().catch(() => {
          // Manual refresh can show the detailed error.
        })
      }
    }, 10000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [loadReports])

  // ==========================================
  // OPEN REVIEW MODAL
  // ==========================================

  function openReview(report: SupportReport) {
    if (report.status !== 'PENDING') return

    setSelectedReport(report)
    setDecision('UPHELD')
    setNote('')
    setError('')
    setSuccess('')
  }

  function closeReview() {
    if (submitting) return

    setSelectedReport(null)
    setNote('')
  }

  // ==========================================
  // ANY ADMIN / SUPERADMIN CAN REVIEW
  // ==========================================

  async function submitReview() {
    if (!selectedReport || submitting) return

    const cleanNote = note.trim()

    if (cleanNote.length < 10) {
      setError('Please enter a reason of at least 10 characters.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await adminSupportReportApi.resolve(
        selectedReport.id,
        decision,
        cleanNote
      )

      setSuccess(
        `Report #${selectedReport.id} marked as ${decision}.`
      )

      setSelectedReport(null)
      setNote('')

      await loadReports()
      onReportsChanged?.()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to review report'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredReports = reports.filter(report => {
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
      String(value ?? '').toLowerCase().includes(query)
    )
  })

  function formatDate(value: string | null) {
    if (!value) return '—'

    const date = new Date(value)

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString()
  }

  return (
    <section className={`support-reports support-reports-${mode}`}>
      <style>{`
        .support-reports {
          padding: 24px;
          background: #fff;
          border-radius: 14px;
          color: #172033;
          margin-bottom: 24px;
        }

        .support-reports * {
          box-sizing: border-box;
        }

        .support-report-header,
        .support-report-toolbar,
        .support-report-modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .support-report-header h2 {
          margin: 0 0 8px;
          font-size: 22px;
        }

        .support-report-header p {
          color: #64748b;
          margin: 0 0 16px;
        }

        .support-report-summary {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(140px, 1fr)
          );
          gap: 12px;
          margin: 20px 0;
        }

        .support-report-metric {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }

        .support-report-metric span {
          display: block;
          font-size: 13px;
          color: #64748b;
        }

        .support-report-metric strong {
          display: block;
          font-size: 25px;
          margin-top: 7px;
        }

        .support-report-toolbar {
          margin: 18px 0;
        }

        .support-report-toolbar input,
        .support-report-toolbar select,
        .support-report-modal select,
        .support-report-modal textarea {
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #172033;
          font-size: 14px;
        }

        .support-report-toolbar input {
          flex: 1;
          min-width: 180px;
        }

        .support-reports button {
          padding: 9px 14px;
          border: 1px solid #ddd6fe;
          border-radius: 8px;
          color: #5b21b6;
          background: #f5f3ff;
          font-weight: 600;
          cursor: pointer;
        }

        .support-reports button:hover:not(:disabled) {
          background: #ede9fe;
        }

        .support-reports button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .support-report-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .support-report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .support-report-table th,
        .support-report-table td {
          padding: 13px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }

        .support-report-table th {
          background: #f8fafc;
          color: #334155;
          font-weight: 700;
        }

        .support-report-description {
          min-width: 200px;
          max-width: 350px;
          overflow-wrap: anywhere;
        }

        .support-report-review-btn,
        .support-report-confirm-btn {
          background: #6d28d9 !important;
          color: white !important;
          border-color: #6d28d9 !important;
        }

        .support-report-error {
          color: #b91c1c;
          overflow-wrap: anywhere;
        }

        .support-report-success {
          color: #166534;
        }

        .support-report-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.6);
        }

        .support-report-modal {
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          background: #fff;
          padding: 24px;
          border-radius: 14px;
          color: #172033;
        }

        .support-report-modal h3 {
          margin: 0 0 16px;
        }

        .support-report-modal label {
          display: block;
          margin: 16px 0 6px;
          font-weight: 600;
        }

        .support-report-modal select,
        .support-report-modal textarea {
          width: 100%;
        }

        .support-report-modal-actions {
          justify-content: flex-end;
          margin-top: 20px;
        }
      `}</style>

      {/* HEADER */}

      <div className="support-report-header">
        <div>
          <h2>Settings Reports</h2>

          <p>
            Technical issues and user reports.
            Any Admin or SuperAdmin can review pending reports.
            No assignment is required.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('')
            void loadReports().catch(err => {
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

      {/* SUMMARY */}

      {summary && (
        <div className="support-report-summary">
          {[
            ['Total Reports', summary.reports],
            ['Pending', summary.pendingReports],
            ['Upheld', summary.upheldReports],
            ['Dismissed', summary.dismissedReports]
          ].map(([label, value]) => (
            <div
              className="support-report-metric"
              key={label}
            >
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}

      <div className="support-report-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Search Settings reports..."
          onChange={event => setSearch(event.target.value)}
        />

        <select
          value={statusFilter}
          onChange={event => {
            setStatusFilter(event.target.value as ReportStatus)
          }}
        >
          <option value="PENDING">Pending</option>
          <option value="ALL">All Reports</option>
          <option value="UPHELD">Upheld</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {error && (
        <p
          className="support-report-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          className="support-report-success"
          role="status"
        >
          {success}
        </p>
      )}

      {/* REPORT TABLE */}

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="support-report-table-wrapper">
          <table className="support-report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Submitted By</th>
                <th>Reported User</th>
                <th>Description</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Resolved By</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    No Settings reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
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

                    <td>{formatDate(report.createdAt)}</td>

                    <td>{report.status}</td>

                    <td>
                      {report.resolvedBy !== null
                        ? `User #${report.resolvedBy}`
                        : '—'}
                    </td>

                    <td>
                      {report.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="support-report-review-btn"
                          onClick={() => openReview(report)}
                        >
                          Review
                        </button>
                      ) : (
                        <span>Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REVIEW MODAL */}

      {selectedReport && (
        <div className="support-report-modal-backdrop">
          <div
            className="support-report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-report-modal-title"
          >
            <h3 id="support-report-modal-title">
              Review Report #{selectedReport.id}
            </h3>

            <p>
              <strong>Type:</strong>{' '}
              {selectedReport.reportType === 'ISSUE'
                ? 'Technical Issue'
                : 'Report a User'}
            </p>

            <p>
              <strong>Submitted By:</strong>{' '}
              @{selectedReport.reporterUsername}
            </p>

            {selectedReport.reportedUsername && (
              <p>
                <strong>Reported User:</strong>{' '}
                @{selectedReport.reportedUsername}
              </p>
            )}

            <p>
              <strong>Description:</strong>{' '}
              {selectedReport.description}
            </p>

            <label htmlFor="support-report-decision">
              Decision
            </label>

            <select
              id="support-report-decision"
              value={decision}
              disabled={submitting}
              onChange={event =>
                setDecision(
                  event.target.value as ReviewDecision
                )
              }
            >
              <option value="UPHELD">Uphold</option>
              <option value="DISMISSED">Dismiss</option>
            </select>

            <label htmlFor="support-report-note">
              Resolution Note
            </label>

            <textarea
              id="support-report-note"
              rows={4}
              maxLength={2000}
              value={note}
              disabled={submitting}
              onChange={event =>
                setNote(event.target.value)
              }
              placeholder="Explain your decision..."
            />

            <div className="support-report-modal-actions">
              <button
                type="button"
                disabled={submitting}
                onClick={closeReview}
              >
                Cancel
              </button>

              <button
                type="button"
                className="support-report-confirm-btn"
                disabled={
                  submitting || note.trim().length < 10
                }
                onClick={() => void submitReview()}
              >
                {submitting
                  ? 'Processing...'
                  : 'Confirm Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
