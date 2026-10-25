
import { useState } from 'react'

import AdminSidebar, {
  type AdminPage
} from '../../shared/AdminSidebar/AdminSidebar'

import AdminDashboard, {
  type Section
} from '../../pages/Admin/AdminDashboard'

import './AdminLayout.css'

export default function AdminLayout() {
  const [activePage, setActivePage] =
    useState<AdminPage>('overview')

  // Clicking shared Admin sidebar
  const handleNavigation = (page: AdminPage) => {
    setActivePage(page)
  }

  // Navigation triggered from Admin content
  const handleSectionChange = (section: Section) => {
    setActivePage(section as AdminPage)
  }

  return (
    <div className="cp-admin-layout">

      {/* One Admin navigation sidebar */}
      <AdminSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
      />

      {/* Actual Admin content */}
      <main className="cp-admin-main">
        <AdminDashboard
          activeSection={activePage as Section}
          onSectionChange={handleSectionChange}
        />
      </main>

    </div>
  )
}
