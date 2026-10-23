import { useState } from 'react'
import AdminSidebar, { type AdminPage } from '../../shared/AdminSidebar/AdminSidebar'
import './AdminLayout.css'

const pageCopy: Record<AdminPage, { title: string; description: string; items: string[] }> = {
  overview: { title: 'Admin Overview', description: 'Platform management overview', items: ['Registered users', 'Pending reports', 'Published posts', 'Upcoming events'] },
  users: { title: 'User Management', description: 'Review registered accounts and account status', items: ['Search users', 'Review account details', 'Suspend or restore accounts'] },
  reports: { title: 'Reports', description: 'Review user-submitted safety reports', items: ['Pending reports', 'Under review', 'Resolved reports'] },
  posts: { title: 'Post Management', description: 'Review published posts and reported content', items: ['Published posts', 'Reported posts', 'Removed posts'] },
  events: { title: 'Event Management', description: 'Review platform events and event reports', items: ['Upcoming events', 'Reported events', 'Past events'] },
  moderation: { title: 'Moderation', description: 'Review content and enforce community standards', items: ['Review queue', 'Moderation history', 'Safety guidelines'] }
}

/** UI navigation only. Connect these panels to ADMIN-protected API endpoints later. */
export default function AdminLayout() {
  const [activePage, setActivePage] = useState<AdminPage>('overview')
  const page = pageCopy[activePage]

  return <div className="cp-admin-layout">
    <AdminSidebar activePage={activePage} onNavigate={setActivePage} />
    <main className="cp-admin-main">
      <div className="cp-admin-heading">
        <div><p>CREATIVE PRO / ADMIN</p><h1>{page.title}</h1><span>{page.description}</span></div>
        <span className="cp-admin-role">Administrator</span>
      </div>
      {activePage === 'overview' && <div className="cp-admin-metrics">
        {page.items.map(name => <div className="cp-admin-metric" key={name}><small>{name}</small><strong>—</strong><span>Connect admin API to show actual counts</span></div>)}
      </div>}
      <section className="cp-admin-panel">
        <h2>{activePage === 'overview' ? 'Management areas' : `${page.title} tools`}</h2>
        <p>This section is ready for integration with your Spring Boot admin endpoints. No sample data or unsafe actions are used.</p>
        <div className="cp-admin-tiles">
          {page.items.map(name => <div className="cp-admin-tile" key={name}><span className="cp-admin-tile-mark">✦</span><strong>{name}</strong><small>Backend integration pending</small></div>)}
        </div>
      </section>
    </main>
  </div>
}
