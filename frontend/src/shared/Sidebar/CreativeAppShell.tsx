import { useEffect, useState, type ReactNode } from 'react'
import { getCurrentUser } from '../../service/authService'
import Sidebar, { type MainPage } from './Sidebar'
import AdminLayout from '../../webpages/Admin/AdminLayout'
import SuperAdminLive from '../../pages/SuperAdmin/SuperAdminLive'
import './CreativeAppShell.css'

export type CreativeAppShellProps = {
  activePage: MainPage
  onNavigate: (page: MainPage) => void
  onLogout: () => void
  children: ReactNode
}

/**
 * Mount ONCE around the application's existing routed page content.
 * Existing Dashboard/Profile components must no longer render NavigationBar.
 * Security reminder: route gating here is only UI; Spring Boot must enforce ADMIN.
 */
export default function CreativeAppShell({ activePage, onNavigate, onLogout, children }: CreativeAppShellProps) {
  const [user, setUser] = useState<{ role?: string | null; fullName?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getCurrentUser()
      .then(data => { if (!cancelled) setUser(data) })
      .catch(() => { if (!cancelled) setUser(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="cp-shell-loading">Loading account...</div>
  if (!user) return <div className="cp-shell-loading">Session expired. Please sign in again.</div>

  const role = user.role?.replace(/^ROLE_/i, '').toUpperCase()
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const canAccessAdmin = role === 'ADMIN' || isSuperAdmin
  return <div className="cp-app-shell">
    <Sidebar activePage={activePage} isAdmin={canAccessAdmin} onNavigate={onNavigate}
      onLogout={onLogout} displayName={user.fullName ?? undefined} />
    <div className="cp-shell-main">
      {activePage === 'admin' ? (isSuperAdmin ? <SuperAdminLive /> : canAccessAdmin ? <AdminLayout /> : <div className="cp-no-access" role="alert">Admin access required.</div>) : children}
    </div>
  </div>
}
