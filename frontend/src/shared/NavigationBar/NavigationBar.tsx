import { useState, type ReactNode } from 'react'
import logoWebsite from '../../assets/logoWebsite.png'
import './NavigationBar.css'

type NavigationBarProps = {
  activePage: 'home' | 'profile' | 'collaborations' | 'events' | 'settings'
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
  onSettingsClick?: () => void
  searchArea?: ReactNode

  // Account dropdown
  currentUserName?: string
  currentUsername?: string
  onLogoutClick?: () => void
}

function NavigationBar({
  activePage,
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick,
  onSettingsClick,
  searchArea,
  currentUserName,
  currentUsername,
  onLogoutClick
}: NavigationBarProps) {

  const [isAccountOpen, setIsAccountOpen] = useState(false)

  const userInitials = (currentUserName || 'User')
    .trim()
    .split(/\s+/)
    .map(name => name.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="dashboard-header">
      <div className="header-container">

        <div className="dashboard-brand">
          <div className="brand-logo">
            <img
              src={logoWebsite}
              alt="Professional Creative Collaboration Network"
            />
          </div>

          <div className="brand-text">
            <strong>Professional Creative Collaboration Network</strong>
            <span>Create • Connect • Collaborate</span>
          </div>
        </div>
        {searchArea}
        <nav className="dashboard-navigation">

          <button
            className={`nav-item ${activePage === 'home' ? 'active' : ''}`}
            onClick={onHomeClick}
          >
            <span>🏠</span>
            <small>Home</small>
          </button>

          <button
            className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
            onClick={onProfileClick}
          >
            <span>👤</span>
            <small>Profile</small>
          </button>

          <button
            className={`nav-item ${
              activePage === 'collaborations' ? 'active' : ''
            }`}
            onClick={onCollaborationClick}
          >
            <span>🤝</span>
            <small>Collaborations</small>
          </button>

          <button
            className={`nav-item ${activePage === 'events' ? 'active' : ''}`}
            onClick={onEventsClick}
          >
            <span>📅</span>
            <small>Events</small>
          </button>

          <button className="nav-item">
            <span>🔔</span>
            <small>Notifications</small>
          </button>

          <button
          type="button"
          className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
          onClick={onSettingsClick}
        >
          <span>⚙️</span>
          <small>Settings</small>
        </button>

        
        </nav>

        {/* ACCOUNT DROPDOWN */}
        <div className="account-menu">
          <button
            type="button"
            className="account-trigger"
            aria-label="Account menu"
            aria-expanded={isAccountOpen}
            aria-haspopup="menu"
            onClick={() => setIsAccountOpen(!isAccountOpen)}
          >
            <span className="account-avatar">
              {userInitials}
            </span>
            <span className="account-chevron">
              {isAccountOpen ? '⌃' : '⌄'}
            </span>
          </button>

          {isAccountOpen && (
            <div className="account-dropdown" role="menu">
              <div className="account-dropdown-user">
                <strong>{currentUserName || 'My Account'}</strong>
                {currentUsername && (
                  <span>@{currentUsername}</span>
                )}
              </div>

              <div className="account-dropdown-divider" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsAccountOpen(false)
                  onProfileClick()
                }}
              >
                <span>👤</span> My Profile
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsAccountOpen(false)
                  onSettingsClick?.()
                }}
              >
                <span>⚙️</span> Settings
              </button>

              <div className="account-dropdown-divider" />

              {onLogoutClick && (
                <button
                  type="button"
                  role="menuitem"
                  className="account-logout"
                  onClick={() => {
                    setIsAccountOpen(false)
                    onLogoutClick()
                  }}
                >
                  <span>↪</span> Log Out
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </header>

  )
}

export default NavigationBar