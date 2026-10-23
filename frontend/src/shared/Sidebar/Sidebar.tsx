import './Sidebar.css'
import logoWebsite from '../../assets/logoWebsite.png'
import {
  House,
  UserRound,
  Handshake,
  CalendarDays,
  Bell,
  Settings,
  ShieldCheck,
  LogOut,
  type LucideIcon
} from 'lucide-react'

export type MainPage =
  | 'home'
  | 'profile'
  | 'collaborations'
  | 'events'
  | 'notifications'
  | 'settings'
  | 'admin'

type Props = {
  activePage: MainPage
  isAdmin: boolean
  onNavigate: (page: MainPage) => void
  onLogout: () => void
  displayName?: string
}

type SidebarItem = {
  page: MainPage
  label: string
  icon: LucideIcon
}

const items: SidebarItem[] = [
  { page: 'home', label: 'Home', icon: House },
  { page: 'profile', label: 'Profile', icon: UserRound },
  { page: 'collaborations', label: 'Collaborations', icon: Handshake },
  { page: 'events', label: 'Events', icon: CalendarDays },
  { page: 'notifications', label: 'Notifications', icon: Bell },
  { page: 'settings', label: 'Settings', icon: Settings }
]

const adminItem: SidebarItem = {
  page: 'admin',
  label: 'Admin Panel',
  icon: ShieldCheck
}

export default function Sidebar({
  activePage,
  isAdmin,
  onNavigate,
  onLogout,
  displayName
}: Props) {
  const visibleItems = isAdmin ? [...items, adminItem] : items

  return (
    <aside className="cp-sidebar" aria-label="Main navigation">
      <div className="cp-side-brand" title="Creative Network">
        <img
          src={logoWebsite}
          alt="Professional Creative Collaboration Network"
          className="cp-side-logo"
        />
        <strong>Creative Network</strong>
        <small>Create • Connect • Collaborate</small>
      </div>

      <nav className="cp-side-nav" aria-label="Creative Network navigation">
        {visibleItems.map(({ page, label, icon: Icon }) => {
          const selected = activePage === page
          return (
            <button
              key={page}
              type="button"
              className={`cp-side-link${selected ? ' is-active' : ''}`}
              aria-current={selected ? 'page' : undefined}
              title={label}
              onClick={() => onNavigate(page)}
            >
              <span className="cp-side-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.9} />
              </span>
              <span className="cp-side-label">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="cp-side-bottom">
        {displayName && (
          <span className="cp-side-user" title={displayName}>
            {displayName}
          </span>
        )}
        <button
          type="button"
          className="cp-side-link cp-side-logout"
          onClick={onLogout}
          title="Logout"
        >
          <span className="cp-side-icon" aria-hidden="true">
            <LogOut size={22} strokeWidth={1.9} />
          </span>
          <span className="cp-side-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}
