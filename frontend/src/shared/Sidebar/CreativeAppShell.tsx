
import { useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser } from '../../service/authService'
import Sidebar, { type MainPage } from './Sidebar'
import AdminLayout from '../../webpages/Admin/AdminLayout'
import SuperAdminLive from '../../pages/SuperAdmin/SuperAdminLive'
import Settings from '../../pages/Settings/Settings'
import './CreativeAppShell.css'

export type CreativeAppShellProps = {
  activePage: MainPage
  onNavigate: (page: MainPage) => void
  onLogout: () => void
  children: ReactNode
}

/**
 * Shared application layout.
 * Preserves existing navigation and role-based admin access.
 */
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

  const renderContent = () => {

    // ADMIN AND SUPERADMIN DASHBOARD
    if (activePage === 'admin') {
      if (isSuperAdmin) {
        return <SuperAdminLive />
      }

      if (canAccessAdmin) {
        return <AdminLayout />
      }

      return (
        <div className="cp-no-access" role="alert">
          Admin access required.
        </div>
      )
    }

    // SETTINGS PAGE
    if (activePage === 'settings') {
      return <Settings />
    }

    // ALL OTHER EXISTING PAGES
    return children
  }

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
        {renderContent()}
      </div>

    </div>
  )
}
