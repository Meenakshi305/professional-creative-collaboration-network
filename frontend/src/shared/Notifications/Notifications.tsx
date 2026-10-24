import {
  useEffect,
  useId,
  useRef,
  useState
} from 'react'

import {
  Bell,
  UserRound,
  Heart,
  MessageCircle,
  Handshake,
  X
} from 'lucide-react'

import {
  getNotifications,
  dismissNotification as dismissNotificationApi,
  type NotificationItem
} from '../../service/notificationService'

import './Notifications.css'

type NotificationsProps = {
  enabled?: boolean
  token: string
}

const notificationIcons = {
  follow: UserRound,
  like: Heart,
  comment: MessageCircle,
  collaboration: Handshake
}

function formatTime(createdAt: string): string {
  const timestamp = new Date(createdAt).getTime()

  if (Number.isNaN(timestamp)) return ''

  const minutes = Math.floor(
    Math.max(0, Date.now() - timestamp) / 60000
  )

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  }

  return new Date(createdAt).toLocaleString()
}

export default function Notifications({
  enabled = true,
  token
}: NotificationsProps) {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([])

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dismissingId, setDismissingId] =
    useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Prevent an older polling response from restoring dismissed items.
  const dismissedIds = useRef(new Set<number>())
  const dismissalInProgress = useRef(false)
  const accountVersion = useRef(0)

  const dropdownId = useId()

  useEffect(() => {
    accountVersion.current += 1
    dismissedIds.current.clear()
    dismissalInProgress.current = false
    setNotifications([])
    setDismissingId(null)
    setIsOpen(false)
    setError('')
    setLoading(true)
  }, [token])

  useEffect(() => {
    if (!enabled) {
      setIsOpen(false)
      return
    }

    if (!token) {
      setLoading(false)
      setError('Please sign in to view notifications.')
      return
    }

    let cancelled = false
    let fetching = false

    const controller = new AbortController()

    async function loadNotifications() {
      if (fetching) return
      fetching = true

      try {
        const data = await getNotifications(
          token,
          controller.signal
        )

        if (!cancelled) {
          setNotifications(
            data.filter(item => !dismissedIds.current.has(item.id))
          )
          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load notifications.'
          )
        }
      } finally {
        fetching = false

        if (!cancelled) setLoading(false)
      }
    }

    void loadNotifications()

    const interval = window.setInterval(() => {
      void loadNotifications()
    }, 30000)

    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(interval)
    }
  }, [enabled, token, isOpen])

  useEffect(() => {
    if (!isOpen || !enabled) return

    function handleOutsideClick(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsideClick
      )
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, enabled])

  async function handleDismiss(id: number) {
    if (dismissalInProgress.current || !token) return

    const version = accountVersion.current

    dismissalInProgress.current = true
    setDismissingId(id)
    setError('')

    try {
      await dismissNotificationApi(id, token)

      if (version !== accountVersion.current) return

      dismissedIds.current.add(id)

      setNotifications(previous =>
        previous.filter(item => item.id !== id)
      )

      triggerRef.current?.focus()
    } catch (err) {
      if (version !== accountVersion.current) return

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to dismiss notification.'
      )
    } finally {
      if (version === accountVersion.current) {
        dismissalInProgress.current = false
        setDismissingId(null)
      }
    }
  }

  const visibleNotifications = notifications.slice(0, 2)

  return (
    <div className="notifications-wrapper" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`notification-trigger${
          isOpen ? ' is-open' : ''
        }`}
        disabled={!enabled}
        onClick={() => setIsOpen(previous => !previous)}
        aria-label={`Notifications, ${notifications.length} remaining`}
        aria-expanded={isOpen && enabled}
        aria-controls={dropdownId}
        title="Notifications"
      >
        <Bell
          size={24}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        {notifications.length > 0 && (
          <span
            className="notification-badge"
            aria-hidden="true"
          >
            {notifications.length > 99
              ? '99+'
              : notifications.length}
          </span>
        )}
      </button>

      {isOpen && enabled && (
        <section
          id={dropdownId}
          className="notifications-dropdown"
          aria-label="Notifications"
          aria-busy={loading}
        >
          <div className="notifications-heading">
            <h3>Notifications</h3>

            <span aria-live="polite">
              {notifications.length} remaining
            </span>
          </div>

          {error && (
            <p className="notifications-error" role="alert">
              {error}
            </p>
          )}

          {loading && notifications.length === 0 ? (
            <div className="notifications-empty" role="status">
              Loading notifications...
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="notifications-empty">
              {error
                ? 'Notifications could not be loaded.'
                : "You're all caught up."}
            </div>
          ) : (
            <div className="notifications-list">
              {visibleNotifications.map(notification => {
                const Icon =
                  notificationIcons[notification.type] ?? Bell

                return (
                  <div
                    className="notifications-item"
                    key={notification.id}
                  >
                    <span
                      className={`notifications-type-icon notifications-type-${notification.type}`}
                      aria-hidden="true"
                    >
                      <Icon size={18} strokeWidth={1.9} />
                    </span>

                    <div className="notifications-message">
                      <p>{notification.message}</p>

                      <small>
                        {formatTime(notification.createdAt)}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="notifications-dismiss"
                      disabled={dismissingId !== null}
                      aria-label={`Dismiss: ${notification.message}`}
                      onClick={() => {
                        void handleDismiss(notification.id)
                      }}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}