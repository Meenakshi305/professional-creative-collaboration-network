import { useEffect, useState, type ReactNode } from 'react'
import {
  getCurrentUser,
  getToken
} from '../../service/authService'
import { getConsentRequests, getLinkedChildren } from '../../service/guardianService'
import Sidebar, { type MainPage } from './Sidebar'
import Notifications from '../Notifications/Notifications'
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
    dateOfBirth?: string | null
    guardianConsentRequired?: boolean
    fullName?: string | null
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [hasGuardianLinks, setHasGuardianLinks] = useState(false)

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

  useEffect(() => {
    if (!user?.dateOfBirth || user.guardianConsentRequired) return
    let live = true
    async function refreshGuardianLinks() {
      try {
        const [requests, children] = await Promise.all([getConsentRequests(), getLinkedChildren()])
        if (live) setHasGuardianLinks(requests.length > 0 || children.length > 0)
      } catch { /* Keep the last known state during temporary connectivity failures. */ }
    }
    void refreshGuardianLinks()
    const timer = window.setInterval(() => void refreshGuardianLinks(), 15000)
    const refresh = () => { void refreshGuardianLinks() }
    window.addEventListener('focus', refresh)
    window.addEventListener('guardian-links-changed', refresh)
    return () => {
      live = false; window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('guardian-links-changed', refresh)
    }
  }, [user])

  if (loading) {
    return (
      <div className="cp-shell-loading">
        Loading account...
      </div>
    )
  }

  const token = getToken()

  if (!user || !token) {
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
        canUseGuardian={!!user.dateOfBirth && !user.guardianConsentRequired && hasGuardianLinks}
        onNavigate={onNavigate}
        onLogout={onLogout}
        displayName={user.fullName ?? undefined}
      />

      <div className="cp-shell-main">
        <div
          className="cp-top-notifications"
          hidden={!showNotifications}
        >
          <Notifications
            enabled={showNotifications}
            token={token}
          />
        </div>

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