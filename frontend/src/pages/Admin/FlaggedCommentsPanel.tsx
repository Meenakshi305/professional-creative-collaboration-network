
import { useCallback, useEffect, useState } from 'react'
import { getToken } from '../../service/authService'

import './FlaggedCommentsPanel.css'

const API = 'http://localhost:8080/api'

type Status = 'PENDING' | 'UPHELD' | 'DISMISSED'
type Filter = 'ALL' | Status

type Action =
  | 'REMOVE_COMMENT'
  | 'BAN_USER'
  | 'REMOVE_AND_BAN'
  | 'DISMISS'

type Flag = {
  id: number
  commentId: number
  postId: number
  commentUserId: number
  commentText: string
  matchedWords: string
  status: Status
  detectedAt?: string
  reviewedBy?: number | null
  reviewedAt?: string | null
  reviewNote?: string | null
}

type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

type ActionResult = {
  flagId: number
  status: Status
  commentRemoved: boolean
  accountDeactivated: boolean
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  if (!token) {
    throw new Error('Please log in again.')
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers
    }
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(
      `Request failed (${response.status}): ${message}`
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

const actions: { value: Action; label: string }[] = [
  { value: 'REMOVE_COMMENT', label: 'Remove Comment' },
  { value: 'BAN_USER', label: 'Ban User' },
  { value: 'REMOVE_AND_BAN', label: 'Remove & Ban' },
  { value: 'DISMISS', label: 'Dismiss' }
]

export default function FlaggedCommentsPanel() {
  const [rows, setRows] = useState<Flag[]>([])
  const [filter, setFilter] = useState<Filter>('PENDING')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [selected, setSelected] = useState<Flag | null>(null)
  const [action, setAction] =
    useState<Action>('REMOVE_COMMENT')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const data = await apiRequest<PageResponse<Flag>>(
      `/admin/flagged-comments?status=${filter}&page=${page}&size=50`
    )

    setRows(data.content)
    setTotalPages(data.totalPages)
    setTotal(data.totalElements)
  }, [filter, page])

  useEffect(() => {
    let active = true

    setLoading(true)

    load()
      .then(() => {
        if (active) setError('')
      })
      .catch(err => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load flagged comments'
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void load().catch(() => {})
      }
    }, 10000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [load])

  function openReview(flag: Flag) {
    setSelected(flag)
    setAction('REMOVE_COMMENT')
    setReason('')
    setError('')
    setSuccess('')
  }

  function closeReview() {
    if (submitting) return
    setSelected(null)
    setReason('')
  }

  async function submitReview() {
    if (!selected || submitting) return

    if (reason.trim().length < 10) {
      setError('Enter a reason of at least 10 characters.')
      return
    }

    if (action !== 'DISMISS') {
      const confirmed = window.confirm(
        `Confirm ${actions.find(a => a.value === action)?.label}?`
      )

      if (!confirmed) return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const result = await apiRequest<ActionResult>(
        `/admin/flagged-comments/${selected.id}/action`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            action,
            reason: reason.trim()
          })
        }
      )

      const extra = result.accountDeactivated
        ? ' The user account is deactivated.'
        : ''

      setSuccess(
        `Report #${result.flagId} reviewed successfully.` + extra
      )

      setSelected(null)
      setReason('')

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to process the report'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const visibleRows = rows.filter(flag => {
    const query = search.trim().toLowerCase()

    if (!query) return true

    return [
      flag.id,
      flag.commentId,
      flag.postId,
      flag.commentUserId,
      flag.commentText,
      flag.matchedWords,
      flag.status
    ].some(value =>
      String(value ?? '').toLowerCase().includes(query)
    )
  })

  return (
    <section className="flagged-panel">
      <div className="flagged-panel-heading">
        <div>
          <h2>Automatically Flagged Comments</h2>
          <p>
            Any Admin or SuperAdmin can review pending reports.
            No assignment is required.
          </p>
        </div>

        <button
          type="button"
          className="flagged-refresh"
          onClick={() => {
            setLoading(true)
            void load()
              .catch(err => setError(String(err)))
              .finally(() => setLoading(false))
          }}
        >
          Refresh
        </button>
      </div>

      <div className="flagged-panel-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Search visible reports..."
          onChange={event => setSearch(event.target.value)}
        />

        <select
          value={filter}
          onChange={event => {
            setFilter(event.target.value as Filter)
            setPage(0)
          }}
        >
          <option value="PENDING">Pending</option>
          <option value="UPHELD">Upheld</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="ALL">All</option>
        </select>

        <span>{total} matching reports</span>
      </div>

      {error && (
        <p role="alert" className="flagged-error">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="flagged-success">
          {success}
        </p>
      )}

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="flagged-table-scroll">
          <table className="flagged-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Post</th>
                <th>User ID</th>
                <th>Comment</th>
                <th>Detected Words</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    No reports found.
                  </td>
                </tr>
              ) : (
                visibleRows.map(flag => (
                  <tr key={flag.id}>
                    <td>#{flag.id}</td>
                    <td>#{flag.postId}</td>
                    <td>#{flag.commentUserId}</td>

                    <td className="flagged-comment-text">
                      {flag.commentText}
                    </td>

                    <td>{flag.matchedWords}</td>

                    <td>
                      <span
                        className={`flagged-status flagged-status-${flag.status.toLowerCase()}`}
                      >
                        {flag.status}
                      </span>
                    </td>

                    <td>
                      {flag.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="flagged-review-button"
                          onClick={() => openReview(flag)}
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

      <div className="flagged-pagination">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => setPage(p => Math.max(0, p - 1))}
        >
          Previous
        </button>

        <span>
          Page {page + 1} of {Math.max(totalPages, 1)}
        </span>

        <button
          type="button"
          disabled={loading || page + 1 >= totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>

      {selected && (
        <div className="flagged-modal-backdrop">
          <div
            className="flagged-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flagged-review-title"
          >
            <h3 id="flagged-review-title">
              Review Report #{selected.id}
            </h3>

            <p>
              <strong>Comment:</strong> {selected.commentText}
            </p>

            <p>
              <strong>Matched words:</strong>{' '}
              {selected.matchedWords}
            </p>

            <label htmlFor="flagged-action">
              Moderation action
            </label>

            <select
              id="flagged-action"
              value={action}
              disabled={submitting}
              onChange={event =>
                setAction(event.target.value as Action)
              }
            >
              {actions.map(item => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <label htmlFor="flagged-reason">
              Reason (minimum 10 characters)
            </label>

            <textarea
              id="flagged-reason"
              rows={4}
              maxLength={2000}
              value={reason}
              disabled={submitting}
              onChange={event => setReason(event.target.value)}
              placeholder="Explain the moderation decision..."
            />

            <div className="flagged-modal-actions">
              <button
                type="button"
                disabled={submitting}
                onClick={closeReview}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  submitting || reason.trim().length < 10
                }
                onClick={() => void submitReview()}
              >
                {submitting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
