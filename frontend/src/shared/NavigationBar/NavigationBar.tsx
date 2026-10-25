
import type { ReactNode } from 'react'
import logoWebsite from '../../assets/logoWebsite.png'
import './NavigationBar.css'

type NavigationBarProps = {
  activePage:
    | 'home'
    | 'profile'
    | 'collaborations'
    | 'events'
    | 'admin'

  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void

  onNotificationsClick?: () => void
  onSettingsClick?: () => void
  onAdminClick?: () => void
  onLogoutClick?: () => void

  isAdmin?: boolean
  searchArea?: ReactNode
}

function NavigationBar({
  activePage,
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick,
  onNotificationsClick,
  onSettingsClick,
  onAdminClick,
  onLogoutClick,
  isAdmin = false,
  searchArea
}: NavigationBarProps) {
  return (
    <header className="dashboard-header">
      <div className="header-container">

        {/* BRAND */}
        <div className="dashboard-brand">
          <div className="brand-logo">
            <img
              src={logoWebsite}
              alt="Professional Creative Collaboration Network"
            />
          </div>

          <div className="brand-text">
            <strong>
              Professional Creative Collaboration Network
            </strong>
            <span>Create • Connect • Collaborate</span>
          </div>
        </div>

        {/* DASHBOARD SEARCH */}
        {searchArea}

        {/* MAIN NAVIGATION */}
        <nav
          className="dashboard-navigation"
          aria-label="Main navigation"
        >
          <button
            type="button"
            className={`nav-item ${
              activePage === 'home' ? 'active' : ''
            }`}
            onClick={onHomeClick}
          >
            <span>🏠</span>
            <small>Home</small>
          </button>

          <button
            type="button"
            className={`nav-item ${
              activePage === 'profile' ? 'active' : ''
            }`}
            onClick={onProfileClick}
          >
            <span>👤</span>
            <small>Profile</small>
          </button>

          <button
            type="button"
            className={`nav-item ${
              activePage === 'collaborations' ? 'active' : ''
            }`}
            onClick={onCollaborationClick}
          >
            <span>🤝</span>
            <small>Collaborations</small>
          </button>

          <button
            type="button"
            className={`nav-item ${
              activePage === 'events' ? 'active' : ''
            }`}
            onClick={onEventsClick}
          >
            <span>📅</span>
            <small>Events</small>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={onNotificationsClick}
            disabled={!onNotificationsClick}
          >
            <span>🔔</span>
            <small>Notifications</small>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={onSettingsClick}
            disabled={!onSettingsClick}
          >
            <span>⚙️</span>
            <small>Settings</small>
          </button>

          {/* ADMIN ONLY */}
          {isAdmin && onAdminClick && (
            <button
              type="button"
              className={`nav-item admin-nav-item ${
                activePage === 'admin' ? 'active' : ''
              }`}
              onClick={onAdminClick}
            >
              <span>🛡️</span>
              <small>Admin Panel</small>
            </button>
          )}

          {/* LOGOUT */}
          {onLogoutClick && (
            <button
              type="button"
              className="nav-item logout-nav-item"
              onClick={onLogoutClick}
            >
              <span>🚪</span>
              <small>Logout</small>
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

export default NavigationBar
