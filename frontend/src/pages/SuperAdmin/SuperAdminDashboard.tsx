import { useMemo, useState } from 'react'

import './SuperAdminDashboard.css'

import {
  adminAccounts,
  rolePermissions,
  superAdminAuditLogs,
  superAdminStats,
  systemHealth,
  systemModules,
  systemUsageTrend,
  type AdminAccountStatus,
  type AdminRole,
  type SuperAdminAccount,
  type SystemModule
} from './superAdminMockData'

type SuperAdminSection =
  | 'overview'
  | 'admins'
  | 'roles'
  | 'modules'
  | 'system'
  | 'audit'

function SuperAdminDashboard() {
  const [
    activeSection,
    setActiveSection
  ] = useState<SuperAdminSection>('overview')

  const [
    admins,
    setAdmins
  ] = useState<SuperAdminAccount[]>(adminAccounts)

  const [
    modules,
    setModules
  ] = useState<SystemModule[]>(systemModules)

  const [
    adminSearch,
    setAdminSearch
  ] = useState('')

  const filteredAdmins = useMemo(() => {
    const search =
      adminSearch
        .trim()
        .toLowerCase()

    if (!search) {
      return admins
    }

    return admins.filter((admin) =>
      admin.name.toLowerCase().includes(search)
      ||
      admin.email.toLowerCase().includes(search)
      ||
      admin.role.toLowerCase().includes(search)
      ||
      admin.status.toLowerCase().includes(search)
    )
  }, [adminSearch, admins])

  const changeAdminStatus = (
    adminId: number
  ) => {
    setAdmins((currentAdmins) =>
      currentAdmins.map((admin) => {
        if (admin.id !== adminId) {
          return admin
        }

        const nextStatus: AdminAccountStatus =
          admin.status === 'SUSPENDED'
            ? 'ACTIVE'
            : 'SUSPENDED'

        return {
          ...admin,
          status: nextStatus
        }
      })
    )
  }

  const changeAdminRole = (
    adminId: number,
    role: AdminRole
  ) => {
    setAdmins((currentAdmins) =>
      currentAdmins.map((admin) =>
        admin.id === adminId
          ? {
              ...admin,
              role
            }
          : admin
      )
    )
  }

  const toggleModule = (
    moduleId: number
  ) => {
    setModules((currentModules) =>
      currentModules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              status:
                module.status === 'ENABLED'
                  ? 'DISABLED'
                  : 'ENABLED'
            }
          : module
      )
    )
  }

  const maxUsers = Math.max(
    ...systemUsageTrend.map(
      (item) => item.users
    )
  )

  const maxReports = Math.max(
    ...systemUsageTrend.map(
      (item) => item.reports
    )
  )

  const renderOverview = () => (
    <>
      <section className="super-welcome-section">
        <div>
          <p className="super-eyebrow">
            SUPER ADMINISTRATION
          </p>

          <h1>
            Super Admin Dashboard
          </h1>

          <p className="super-welcome-text">
            Manage administrators, permissions,
            system modules and platform-wide
            governance from one place.
          </p>
        </div>

        <div className="super-role-badge">
          Super Administrator
        </div>
      </section>

      <section className="super-stats-grid">
        <div className="super-stat-card">
          <div className="super-stat-icon">
            👥
          </div>

          <div>
            <span>Total Users</span>
            <strong>
              {superAdminStats.totalUsers.toLocaleString()}
            </strong>
            <small>Platform accounts</small>
          </div>
        </div>

        <div className="super-stat-card">
          <div className="super-stat-icon">
            ✅
          </div>

          <div>
            <span>Active Users</span>
            <strong>
              {superAdminStats.activeUsers.toLocaleString()}
            </strong>
            <small>Currently active</small>
          </div>
        </div>

        <div className="super-stat-card">
          <div className="super-stat-icon">
            🛡️
          </div>

          <div>
            <span>Administrators</span>
            <strong>
              {superAdminStats.totalAdmins}
            </strong>
            <small>
              {superAdminStats.activeAdmins} active
            </small>
          </div>
        </div>

        <div className="super-stat-card">
          <div className="super-stat-icon">
            🚩
          </div>

          <div>
            <span>Open Reports</span>
            <strong>
              {superAdminStats.openReports}
            </strong>
            <small>Needs moderation</small>
          </div>
        </div>

        <div className="super-stat-card">
          <div className="super-stat-icon">
            🧩
          </div>

          <div>
            <span>Enabled Modules</span>
            <strong>
              {superAdminStats.enabledModules}
              /
              {superAdminStats.totalModules}
            </strong>
            <small>Global features</small>
          </div>
        </div>

        <div className="super-stat-card">
          <div className="super-stat-icon">
            📋
          </div>

          <div>
            <span>Audit Actions Today</span>
            <strong>
              {superAdminStats.auditActionsToday}
            </strong>
            <small>Admin activity</small>
          </div>
        </div>
      </section>

      <section className="super-overview-grid">
        <div className="super-panel">
          <div className="super-panel-header">
            <div>
              <h2>User Growth</h2>
              <p>
                Platform growth across the
                latest six months.
              </p>
            </div>

            <span className="super-panel-pill">
              Mock analytics
            </span>
          </div>

          <div className="super-chart">
            <div className="super-chart-bars">
              {systemUsageTrend.map((item) => (
                <div
                  key={item.month}
                  className="super-chart-column"
                >
                  <div
                    className="super-chart-bar super-chart-bar-primary"
                    style={{
                      height:
                        `${Math.max(
                          12,
                          (item.users / maxUsers) * 170
                        )}px`
                    }}
                    title={`${item.month}: ${item.users} users`}
                  />

                  <strong>
                    {item.users}
                  </strong>

                  <span>
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="super-panel">
          <div className="super-panel-header">
            <div>
              <h2>System Health</h2>
              <p>
                Current integration and
                platform readiness.
              </p>
            </div>
          </div>

          <div className="super-health-list">
            {systemHealth.map((item) => (
              <div
                key={item.id}
                className="super-health-item"
              >
                <div>
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    {item.value}
                  </span>
                </div>

                <span
                  className={`super-health-badge super-health-${item.status.toLowerCase()}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="super-overview-grid">
        <div className="super-panel">
          <div className="super-panel-header">
            <div>
              <h2>Administrator Accounts</h2>
              <p>
                Current administration team.
              </p>
            </div>

            <button
              className="super-text-button"
              onClick={() =>
                setActiveSection('admins')
              }
            >
              Manage admins
            </button>
          </div>

          <div className="super-table-wrapper">
            <table className="super-table">
              <thead>
                <tr>
                  <th>Administrator</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {admins
                  .slice(0, 5)
                  .map((admin) => (
                    <tr key={admin.id}>
                      <td>
                        <div className="super-user-cell">
                          <strong>
                            {admin.name}
                          </strong>

                          <span>
                            {admin.email}
                          </span>
                        </div>
                      </td>

                      <td>
                        {admin.role.replace(
                          '_',
                          ' '
                        )}
                      </td>

                      <td>
                        <span
                          className={`super-status super-status-${admin.status.toLowerCase()}`}
                        >
                          {admin.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="super-panel">
          <div className="super-panel-header">
            <div>
              <h2>Recent Audit Activity</h2>
              <p>
                Latest privileged actions.
              </p>
            </div>

            <button
              className="super-text-button"
              onClick={() =>
                setActiveSection('audit')
              }
            >
              View all
            </button>
          </div>

          <div className="super-audit-list">
            {superAdminAuditLogs
              .slice(0, 4)
              .map((log) => (
                <div
                  key={log.id}
                  className="super-audit-item"
                >
                  <div className="super-audit-dot" />

                  <div>
                    <strong>
                      {log.action.replaceAll(
                        '_',
                        ' '
                      )}
                    </strong>

                    <span>
                      {log.actor}
                      {' → '}
                      {log.target}
                    </span>
                  </div>

                  <small>
                    {log.date}
                  </small>
                </div>
              ))}
          </div>
        </div>
      </section>
    </>
  )

  const renderAdmins = () => (
    <section className="super-panel">
      <div className="super-page-heading">
        <div>
          <p className="super-eyebrow">
            ADMINISTRATOR MANAGEMENT
          </p>

          <h1>
            Admin Accounts
          </h1>

          <p>
            Manage administrator status,
            access level and account roles.
          </p>
        </div>

        <button
          className="super-primary-button"
          type="button"
        >
          + Add Administrator
        </button>
      </div>

      <div className="super-toolbar">
        <input
          type="text"
          value={adminSearch}
          onChange={(event) =>
            setAdminSearch(
              event.target.value
            )
          }
          placeholder="Search administrators..."
          className="super-search-input"
        />

        <span className="super-result-count">
          {filteredAdmins.length} accounts
        </span>
      </div>

      <div className="super-table-wrapper">
        <table className="super-table">
          <thead>
            <tr>
              <th>Administrator</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created</th>
              <th>Account Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id}>
                <td>
                  <div className="super-user-cell">
                    <strong>
                      {admin.name}
                    </strong>

                    <span>
                      {admin.email}
                    </span>
                  </div>
                </td>

                <td>
                  <select
                    className="super-select"
                    value={admin.role}
                    onChange={(event) =>
                      changeAdminRole(
                        admin.id,
                        event.target.value as AdminRole
                      )
                    }
                  >
                    <option value="ADMIN">
                      Admin
                    </option>

                    <option value="SUPER_ADMIN">
                      Super Admin
                    </option>
                  </select>
                </td>

                <td>
                  <span
                    className={`super-status super-status-${admin.status.toLowerCase()}`}
                  >
                    {admin.status}
                  </span>
                </td>

                <td>
                  {admin.lastLogin}
                </td>

                <td>
                  {admin.createdDate}
                </td>

                <td>
                  <button
                    className={
                      admin.status === 'SUSPENDED'
                        ? 'super-action-button super-action-enable'
                        : 'super-action-button super-action-danger'
                    }
                    onClick={() =>
                      changeAdminStatus(
                        admin.id
                      )
                    }
                  >
                    {
                      admin.status === 'SUSPENDED'
                        ? 'Reactivate'
                        : 'Suspend'
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderRoles = () => (
    <section className="super-panel">
      <div className="super-page-heading">
        <div>
          <p className="super-eyebrow">
            ACCESS CONTROL
          </p>

          <h1>
            Roles & Permissions
          </h1>

          <p>
            Compare administrator and
            super administrator privileges.
          </p>
        </div>
      </div>

      <div className="super-permission-summary">
        <div className="super-permission-card">
          <span>🛡️</span>

          <div>
            <strong>Admin</strong>
            <p>
              Day-to-day moderation, user
              management and content review.
            </p>
          </div>
        </div>

        <div className="super-permission-card super-permission-card-highlight">
          <span>👑</span>

          <div>
            <strong>Super Admin</strong>
            <p>
              Full administrative control,
              including roles, modules and
              system-wide governance.
            </p>
          </div>
        </div>
      </div>

      <div className="super-table-wrapper">
        <table className="super-table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Admin</th>
              <th>Super Admin</th>
            </tr>
          </thead>

          <tbody>
            {rolePermissions.map(
              (permission) => (
                <tr key={permission.id}>
                  <td>
                    <strong>
                      {permission.permission}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={
                        permission.admin
                          ? 'super-permission-yes'
                          : 'super-permission-no'
                      }
                    >
                      {
                        permission.admin
                          ? '✓ Allowed'
                          : '— Not allowed'
                      }
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        permission.superAdmin
                          ? 'super-permission-yes'
                          : 'super-permission-no'
                      }
                    >
                      {
                        permission.superAdmin
                          ? '✓ Allowed'
                          : '— Not allowed'
                      }
                    </span>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  )

  const renderModules = () => (
    <section className="super-panel">
      <div className="super-page-heading">
        <div>
          <p className="super-eyebrow">
            SYSTEM CONFIGURATION
          </p>

          <h1>
            System Modules
          </h1>

          <p>
            Enable or disable platform
            features globally.
          </p>
        </div>

        <div className="super-module-count">
          {
            modules.filter(
              (module) =>
                module.status === 'ENABLED'
            ).length
          }
          /
          {modules.length}
          {' enabled'}
        </div>
      </div>

      <div className="super-module-grid">
        {modules.map((module) => (
          <div
            key={module.id}
            className="super-module-card"
          >
            <div className="super-module-top">
              <div className="super-module-icon">
                🧩
              </div>

              <span
                className={`super-status super-status-${module.status.toLowerCase()}`}
              >
                {module.status}
              </span>
            </div>

            <h3>
              {module.name}
            </h3>

            <span className="super-module-code">
              {module.code}
            </span>

            <p>
              {module.description}
            </p>

            {
              module.parentModule
              &&
              (
                <small>
                  Parent:
                  {' '}
                  {module.parentModule}
                </small>
              )
            }

            <button
              className={
                module.status === 'ENABLED'
                  ? 'super-module-button super-module-disable'
                  : 'super-module-button super-module-enable'
              }
              onClick={() =>
                toggleModule(
                  module.id
                )
              }
            >
              {
                module.status === 'ENABLED'
                  ? 'Disable Module'
                  : 'Enable Module'
              }
            </button>
          </div>
        ))}
      </div>
    </section>
  )

  const renderSystem = () => (
    <>
      <section className="super-panel">
        <div className="super-page-heading">
          <div>
            <p className="super-eyebrow">
              PLATFORM MONITORING
            </p>

            <h1>
              System Statistics
            </h1>

            <p>
              High-level operational overview
              and platform usage.
            </p>
          </div>
        </div>

        <div className="super-system-stats">
          <div>
            <span>Organisations</span>
            <strong>
              {superAdminStats.organisations}
            </strong>
          </div>

          <div>
            <span>Active Events</span>
            <strong>
              {superAdminStats.activeEvents}
            </strong>
          </div>

          <div>
            <span>Open Opportunities</span>
            <strong>
              {superAdminStats.openOpportunities}
            </strong>
          </div>

          <div>
            <span>Suspended Users</span>
            <strong>
              {superAdminStats.suspendedUsers}
            </strong>
          </div>
        </div>
      </section>

      <section className="super-overview-grid">
        <div className="super-panel">
          <div className="super-panel-header">
            <div>
              <h2>User Growth</h2>
              <p>
                Six-month account trend.
              </p>
            </div>
          </div>

          <div className="super-chart">
            <div className="super-chart-bars">
              {systemUsageTrend.map(
                (item) => (
                  <div
                    key={item.month}
                    className="super-chart-column"
                  >
                    <div
                      className="super-chart-bar super-chart-bar-primary"
                      style={{
                        height:
                          `${Math.max(
                            12,
                            (item.users / maxUsers) * 180
                          )}px`
                      }}
                    />

                    <strong>
                      {item.users}
                    </strong>

                    <span>
                      {item.month}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="super-panel">
          <div className="super-panel-header">
            <div>
              <h2>Reports Trend</h2>
              <p>
                Monthly reports requiring
                administrative handling.
              </p>
            </div>
          </div>

          <div className="super-chart">
            <div className="super-chart-bars">
              {systemUsageTrend.map(
                (item) => (
                  <div
                    key={item.month}
                    className="super-chart-column"
                  >
                    <div
                      className="super-chart-bar super-chart-bar-secondary"
                      style={{
                        height:
                          `${Math.max(
                            12,
                            (item.reports / maxReports) * 180
                          )}px`
                      }}
                    />

                    <strong>
                      {item.reports}
                    </strong>

                    <span>
                      {item.month}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="super-panel">
        <div className="super-panel-header">
          <div>
            <h2>System Health</h2>
            <p>
              Current project integration
              readiness.
            </p>
          </div>
        </div>

        <div className="super-health-grid">
          {systemHealth.map((item) => (
            <div
              key={item.id}
              className="super-health-card"
            >
              <strong>
                {item.name}
              </strong>

              <span>
                {item.value}
              </span>

              <div
                className={`super-health-badge super-health-${item.status.toLowerCase()}`}
              >
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="super-panel">
        <div className="super-panel-header">
          <div>
            <h2>Global Settings</h2>
            <p>
              Frontend preview of system-wide
              configuration controls.
            </p>
          </div>
        </div>

        <div className="super-settings-list">
          <label>
            <div>
              <strong>
                New User Registrations
              </strong>

              <span>
                Allow new users to create
                accounts.
              </span>
            </div>

            <input
              type="checkbox"
              defaultChecked
            />
          </label>

          <label>
            <div>
              <strong>
                Event Creation
              </strong>

              <span>
                Allow eligible users to
                publish events.
              </span>
            </div>

            <input
              type="checkbox"
              defaultChecked
            />
          </label>

          <label>
            <div>
              <strong>
                Collaboration Applications
              </strong>

              <span>
                Allow applications to open
                opportunities.
              </span>
            </div>

            <input
              type="checkbox"
              defaultChecked
            />
          </label>

          <label>
            <div>
              <strong>
                Maintenance Mode
              </strong>

              <span>
                Temporarily restrict normal
                user access.
              </span>
            </div>

            <input
              type="checkbox"
            />
          </label>
        </div>
      </section>
    </>
  )

  const renderAudit = () => (
    <section className="super-panel">
      <div className="super-page-heading">
        <div>
          <p className="super-eyebrow">
            FULL ACCOUNTABILITY
          </p>

          <h1>
            Audit Logs
          </h1>

          <p>
            Review privileged administrator
            and super administrator actions.
          </p>
        </div>
      </div>

      <div className="super-table-wrapper">
        <table className="super-table">
          <thead>
            <tr>
              <th>Audit ID</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action</th>
              <th>Target</th>
              <th>Date</th>
              <th>IP Address</th>
            </tr>
          </thead>

          <tbody>
            {superAdminAuditLogs.map(
              (log) => (
                <tr key={log.id}>
                  <td>
                    #{log.id}
                  </td>

                  <td>
                    <strong>
                      {log.actor}
                    </strong>
                  </td>

                  <td>
                    {log.role.replace(
                      '_',
                      ' '
                    )}
                  </td>

                  <td>
                    <span className="super-action-tag">
                      {log.action.replaceAll(
                        '_',
                        ' '
                      )}
                    </span>
                  </td>

                  <td>
                    {log.target}
                  </td>

                  <td>
                    {log.date}
                  </td>

                  <td>
                    <code>
                      {log.ipAddress}
                    </code>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  )

  return (
    <div className="super-admin-dashboard">
      <aside className="super-sidebar">
        <div className="super-sidebar-heading">
          <div className="super-crown">
            👑
          </div>

          <div>
            <strong>
              Super Admin
            </strong>

            <span>
              Creative Collab
            </span>
          </div>
        </div>

        <nav className="super-sidebar-nav">
          <button
            className={
              activeSection === 'overview'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveSection(
                'overview'
              )
            }
          >
            <span>📊</span>
            Overview
          </button>

          <button
            className={
              activeSection === 'admins'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveSection(
                'admins'
              )
            }
          >
            <span>🛡️</span>
            Admin Accounts
          </button>

          <button
            className={
              activeSection === 'roles'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveSection(
                'roles'
              )
            }
          >
            <span>🔐</span>
            Roles & Permissions
          </button>

          <button
            className={
              activeSection === 'modules'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveSection(
                'modules'
              )
            }
          >
            <span>🧩</span>
            System Modules
          </button>

          <button
            className={
              activeSection === 'system'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveSection(
                'system'
              )
            }
          >
            <span>⚙️</span>
            System
          </button>

          <button
            className={
              activeSection === 'audit'
                ? 'active'
                : ''
            }
            onClick={() =>
              setActiveSection(
                'audit'
              )
            }
          >
            <span>📋</span>
            Full Audit Logs
          </button>
        </nav>

        <div className="super-sidebar-footer">
          <div className="super-avatar">
            S
          </div>

          <div>
            <strong>
              Super Administrator
            </strong>

            <span>
              SUPER_ADMIN
            </span>
          </div>
        </div>
      </aside>

      <main className="super-main">
        {
          activeSection === 'overview'
          &&
          renderOverview()
        }

        {
          activeSection === 'admins'
          &&
          renderAdmins()
        }

        {
          activeSection === 'roles'
          &&
          renderRoles()
        }

        {
          activeSection === 'modules'
          &&
          renderModules()
        }

        {
          activeSection === 'system'
          &&
          renderSystem()
        }

        {
          activeSection === 'audit'
          &&
          renderAudit()
        }
      </main>
    </div>
  )
}

export default SuperAdminDashboard
