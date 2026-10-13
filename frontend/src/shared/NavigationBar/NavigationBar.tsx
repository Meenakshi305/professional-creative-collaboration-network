import type { ReactNode } from 'react'
import logoWebsite from '../../assets/logoWebsite.png'
import './NavigationBar.css'

type NavigationBarProps = {
  activePage: 'home' | 'profile' | 'collaborations' | 'events'
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
  searchArea?: ReactNode
}

function NavigationBar({
  activePage,
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick,
  searchArea
}: NavigationBarProps) {

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

          <button className="nav-item">
            <span>⚙️</span>
            <small>Settings</small>
          </button>

        </nav>

      </div>
    </header>
  )
}

export default NavigationBar