
import './AdminSidebar.css'

import {
  LayoutDashboard,
  Flag,
  Users,
  BarChart3,
  ShieldCheck,
  Activity
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

// Must match AdminDashboard section names
export type AdminPage =
  | 'overview'
  | 'reports'
  | 'users'
  | 'analytics'
  | 'moderation'
  | 'activity'

type AdminSidebarProps = {
  activePage: AdminPage
  onNavigate: (page: AdminPage) => void
  assignedReportsCount?: number
}

type AdminNavigationItem = {
  page: AdminPage
  label: string
  icon: LucideIcon
}

export const adminNavigation: AdminNavigationItem[] = [
  {
    page: 'overview',
    label: 'Overview',
    icon: LayoutDashboard
  },
  {
    page: 'reports',
    label: 'My Assigned Reports',
    icon: Flag
  },
  {
    page: 'users',
    label: 'Manage Users',
    icon: Users
  },
  {
    page: 'analytics',
    label: 'Analytics',
    icon: BarChart3
  },
  {
    page: 'moderation',
    label: 'Content Moderation',
    icon: ShieldCheck
  },
  {
    page: 'activity',
    label: 'My Activity',
    icon: Activity
  }
]

export default function AdminSidebar({
  activePage,
  onNavigate,
  assignedReportsCount
}: AdminSidebarProps) {
  return (
    <aside
      className="cp-admin-sidebar"
      aria-label="Admin navigation"
    >
      {/* Admin branding */}
      <div className="cp-admin-brand">
        <strong>Admin</strong>
        <small>Creative Network</small>
      </div>

      {/* Single Admin navigation */}
      <nav className="cp-admin-nav">
        {adminNavigation.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.page

          return (
            <button
              key={item.page}
              type="button"
              className={`cp-admin-link ${
                isActive ? 'is-active' : ''
              }`}
              aria-current={
                isActive ? 'page' : undefined
              }
              onClick={() => onNavigate(item.page)}
            >
              <Icon
                size={19}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>{item.label}</span>

              {item.page === 'reports' &&
                assignedReportsCount !== undefined &&
                assignedReportsCount > 0 && (
                  <span className="cp-admin-report-count">
                    {assignedReportsCount}
                  </span>
                )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
