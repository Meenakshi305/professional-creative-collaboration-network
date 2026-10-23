
import { useEffect, useState } from 'react'
import './OwnFollowModal.css'

import {
  getMyFollowers,
  getMyFollowing,
  type FollowPerson
} from '../../service/followService'

type FollowTab = 'followers' | 'following'

type OwnFollowModalProps = {
  type?: FollowTab
  initialTab?: FollowTab
  onClose: () => void
  onUserClick?: (userId: number) => void
}

function getInitials(
  fullName: string,
  username: string
): string {
  const name = fullName?.trim() || username?.trim() || ''

  const parts = name.split(/[\s_.-]+/).filter(Boolean)

  if (parts.length >= 2) {
    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase()
  }

  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : 'U'
}

function FollowAvatar({ user }: { user: FollowPerson }) {
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [user.profileImageUrl])

  if (user.profileImageUrl && !imageFailed) {
    return (
      <img
        className="own-follow-modal-avatar"
        src={user.profileImageUrl}
        alt={user.fullName || user.username}
        onError={() => setImageFailed(true)}
        style={{ objectFit: 'cover' }}
      />
    )
  }

  return (
    <div className="own-follow-modal-avatar">
      {getInitials(user.fullName, user.username)}
    </div>
  )
}

function OwnFollowModal({
  type,
  initialTab,
  onClose,
  onUserClick
}: OwnFollowModalProps) {
  const [activeTab, setActiveTab] = useState<FollowTab>(
    initialTab ?? type ?? 'followers'
  )

  const [users, setUsers] = useState<FollowPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError('')
    setUsers([])

    const loadUsers = async () => {
      try {
        const result =
          activeTab === 'followers'
            ? await getMyFollowers()
            : await getMyFollowing()

        if (!cancelled) {
          setUsers(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load follow list.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadUsers()

    return () => {
      cancelled = true
    }
  }, [activeTab])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div
      className="own-follow-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="own-follow-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Followers and Following"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="own-follow-modal-header">
          <h2>Connections</h2>

          <button
            type="button"
            className="own-follow-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="own-follow-modal-tabs">
          <button
            type="button"
            className={activeTab === 'followers' ? 'active' : ''}
            onClick={() => setActiveTab('followers')}
          >
            Followers
          </button>

          <button
            type="button"
            className={activeTab === 'following' ? 'active' : ''}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
        </div>

        <div className="own-follow-modal-content">
          {loading && (
            <p className="own-follow-modal-status">
              Loading {activeTab}...
            </p>
          )}

          {!loading && error && (
            <p className="own-follow-modal-error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && users.length === 0 && (
            <p className="own-follow-modal-status">
              {activeTab === 'followers'
                ? 'You do not have any followers yet.'
                : 'You are not following anyone yet.'}
            </p>
          )}

          {!loading && !error && users.map(user => (
            <div
              className="own-follow-modal-user"
              key={user.userId}
            >
              <FollowAvatar user={user} />

              <div className="own-follow-modal-user-info">
                <strong>
                  {user.fullName || user.username}
                </strong>
                <span>@{user.username}</span>
              </div>

              {onUserClick && (
                <button
                  type="button"
                  className="own-follow-modal-view"
                  onClick={() => {
                    onClose()
                    onUserClick(user.userId)
                  }}
                >
                  View
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OwnFollowModal
