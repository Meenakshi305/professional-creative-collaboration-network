import './AdminSidebar.css'
export type AdminPage = 'overview' | 'users' | 'reports' | 'posts' | 'events' | 'moderation'
export const adminNavigation: { page: AdminPage; label: string; icon: string }[] = [
  { page: 'overview', label: 'Overview', icon: '▦' },
  { page: 'users', label: 'Users', icon: '♙' },
  { page: 'reports', label: 'Reports', icon: '⚑' },
  { page: 'posts', label: 'Posts', icon: '▤' },
  { page: 'events', label: 'Events', icon: '▣' },
  { page: 'moderation', label: 'Moderation', icon: '♜' }
]
export default function AdminSidebar({ activePage, onNavigate }: {
  activePage: AdminPage
  onNavigate: (page: AdminPage) => void
}) {
  return <aside className="cp-admin-sidebar" aria-label="Admin navigation">
    <div className="cp-admin-brand"><strong>Admin Workspace</strong><small>Platform management</small></div>
    <nav className="cp-admin-nav">
      {adminNavigation.map(item => <button key={item.page} type="button"
        className={`cp-admin-link ${activePage === item.page ? 'is-active' : ''}`}
        aria-current={activePage === item.page ? 'page' : undefined}
        onClick={() => onNavigate(item.page)}>
        <span aria-hidden="true">{item.icon}</span> {item.label}
      </button>)}
    </nav>
  </aside>
}
