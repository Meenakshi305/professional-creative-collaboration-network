
import { useEffect, useRef, useState } from 'react'
import './Notifications.css'

type NotificationType = 'follow' | 'like' | 'comment' | 'collaboration'

type NotificationItem = {
  id: number
  message: string
  time: string
  type: NotificationType
  createdAt: number
}

const sampleNotifications: NotificationItem[] = [
  {
    id: 1,
    message: 'Vamsi followed you back.',
    time: '10 min ago',
    type: 'follow',
    createdAt: 400
  },
  {
    id: 2,
    message: 'Khushi liked your post.',
    time: '25 min ago',
    type: 'like',
    createdAt: 300
  },
  {
    id: 3,
    message: 'Meenakshi commented on your portfolio.',
    time: '1 hour ago',
    type: 'comment',
    createdAt: 200
  },
  {
    id: 4,
    message: 'Arjun invited you to collaborate.',
    time: '2 hours ago',
    type: 'collaboration',
    createdAt: 100
  }
]

function Notifications() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(sampleNotifications)

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedNotifications = [...notifications].sort(
    (a, b) => b.createdAt - a.createdAt
  )

  const visibleNotifications = sortedNotifications.slice(0, 2)

  const dismissNotification = (id: number) => {
    setNotifications(previous =>
      previous.filter(notification => notification.id !== id)
    )
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'follow':
        return '👤'
      case 'like':
        return '❤️'
      case 'comment':
        return '💬'
      case 'collaboration':
        return '🤝'
    }
  }

  return (
    <div className="notifications-wrapper" ref={containerRef}>
      <button
        type="button"
        className="nav-item notification-trigger"
        onDoubleClick={() => setIsOpen(previous => !previous)}
        aria-label={`Notifications, ${notifications.length} remaining`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="notification-bell">
          🔔
          {notifications.length > 0 && (
            <span className="notification-badge">
              {notifications.length}
            </span>
          )}
        </span>
        <small>Notifications</small>
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-heading">
            <h3>Notifications</h3>
            <span>{notifications.length} remaining</span>
          </div>

          {visibleNotifications.length === 0 ? (
            <div className="notifications-empty">
              No notifications remaining
            </div>
          ) : (
            <div className="notifications-list">
              {visibleNotifications.map(notification => (
                <div
                  className="notifications-item"
                  key={notification.id}
                >
                  <span className="notifications-type-icon">
                    {getIcon(notification.type)}
                  </span>

                  <div className="notifications-message">
                    <p>{notification.message}</p>
                    <small>{notification.time}</small>
                  </div>

                  <button
                    type="button"
                    className="notifications-dismiss"
                    aria-label={`Dismiss ${notification.message}`}
                    onClick={() => dismissNotification(notification.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Notifications
