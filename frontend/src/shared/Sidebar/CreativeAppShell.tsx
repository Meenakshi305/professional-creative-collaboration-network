import { useEffect, useState, type ReactNode } from 'react'
import { Bell } from 'lucide-react'
import { getCurrentUser } from '../../service/authService'
import Sidebar, { type MainPage } from './Sidebar'
import SuperAdminLive from '../../pages/SuperAdmin/SuperAdminLive'
import './CreativeAppShell.css'

export type CreativeAppShellProps = {
  activePage: MainPage
  onNavigate: (page: MainPage) => void
  onLogout: () => void
  children: ReactNode
}

export default function CreativeAppShell({
  activePage,
  onNavigate,
  onLogout,
  children
}: CreativeAppShellProps) {
  const [user, setUser] = useState<{
    role?: string | null
    fullName?: string | null
  } | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getCurrentUser()
      .then(data => {
        if (!cancelled) {
          setUser(data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="cp-shell-loading">
        Loading account...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="cp-shell-loading">
        Session expired. Please sign in again.
      </div>
    )
  }

  const role = user.role
    ?.replace(/^ROLE_/i, '')
    .toUpperCase()

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const canAccessAdmin = role === 'ADMIN' || isSuperAdmin

  const showNotifications =
    activePage === 'home' || activePage === 'profile'

  return (
    <div className="cp-app-shell">
      <Sidebar
        activePage={activePage}
        isAdmin={canAccessAdmin}
        onNavigate={onNavigate}
        onLogout={onLogout}
        displayName={user.fullName ?? undefined}
      />

      <div className="cp-shell-main">
        {showNotifications && (
          <div className="cp-top-notifications">
            <button
              type="button"
              className="cp-notification-button"
              onClick={() => onNavigate('notifications')}
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell
                size={24}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {activePage === 'admin' ? (
          canAccessAdmin ? (
            <SuperAdminLive
              mode={isSuperAdmin ? 'superadmin' : 'admin'}
            />
          ) : (
            <div className="cp-no-access" role="alert">
              Admin access required.
            </div>
          )
        ) : (
          children
        )}
      </div>
    </div>
  )
}