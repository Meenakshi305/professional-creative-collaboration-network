
import { useEffect, useState } from 'react'

import {
  settingsApi,
  type ReportType,
  type HelpItem
} from '../../service/settingsService'

import {
  searchUsers,
  type SearchUser
} from '../../service/userService'

import './Settings.css'

type SettingsTab =
  | 'account'
  | 'report'
  | 'security'
  | 'help'
  | 'guidelines'

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: '👤 Account Settings' },
  { id: 'report', label: '🚩 Report Issue or User' },
  { id: 'security', label: '🔒 Account Security' },
  { id: 'help', label: '❓ Help & Support' },
  { id: 'guidelines', label: '📜 Community Guidelines' }
]

export default function Settings() {
  const [activeTab, setActiveTab] =
    useState<SettingsTab>('account')

  // Account
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [originalEmail, setOriginalEmail] = useState('')

  // Reports
  const [reportType, setReportType] =
    useState<ReportType>('ISSUE')

  const [reportedUsername, setReportedUsername] =
    useState('')

  const [selectedUser, setSelectedUser] =
    useState<SearchUser | null>(null)

  const [userResults, setUserResults] =
    useState<SearchUser[]>([])

  const [searchingUsers, setSearchingUsers] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [description, setDescription] = useState('')

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Help and guidelines
  const [faq, setFaq] = useState<HelpItem[]>([])
  const [guidelines, setGuidelines] = useState<string[]>([])

  // Page status
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load account and support information
  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      try {
        const [profile, help, rules] = await Promise.all([
          settingsApi.profile(),
          settingsApi.help(),
          settingsApi.guidelines()
        ])

        if (cancelled) return

        setDisplayName(profile.displayName ?? '')
        setEmail(profile.email ?? '')
        setOriginalEmail(profile.email ?? '')
        setFaq(help)
        setGuidelines(rules)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load settings.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [])

  // Reuse existing Dashboard user search
  useEffect(() => {
    if (
      activeTab !== 'report' ||
      reportType !== 'USER' ||
      selectedUser
    ) {
      setUserResults([])
      setSearchingUsers(false)
      return
    }

    const query = reportedUsername
      .trim()
      .replace(/^@+/, '')

    if (query.length < 2) {
      setUserResults([])
      setSearchingUsers(false)
      setSearchError('')
      return
    }

    let cancelled = false

    setSearchingUsers(true)
    setSearchError('')
    setUserResults([])

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchUsers(query)

        if (!cancelled) {
          setUserResults(results)
        }
      } catch (err) {
        if (!cancelled) {
          setUserResults([])
          setSearchError(
            err instanceof Error
              ? err.message
              : 'Failed to search users.'
          )
        }
      } finally {
        if (!cancelled) setSearchingUsers(false)
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    activeTab,
    reportType,
    reportedUsername,
    selectedUser
  ])

  function changeTab(tab: SettingsTab) {
    setActiveTab(tab)
    setMessage('')
    setError('')
  }

  function resetUserSearch() {
    setReportedUsername('')
    setSelectedUser(null)
    setUserResults([])
    setSearchError('')
  }

  function selectUser(user: SearchUser) {
    setSelectedUser(user)
    setReportedUsername(`@${user.username}`)
    setUserResults([])
    setSearchError('')
    setError('')
  }

  async function saveAccount() {
    setError('')
    setMessage('')

    if (!displayName.trim() || !email.trim()) {
      setError('Display name and email are required.')
      return
    }

    setSaving(true)

    try {
      const updated = await settingsApi.saveProfile({
        displayName: displayName.trim(),
        email: email.trim()
      })

      setDisplayName(updated.displayName)
      setEmail(updated.email)

      setMessage(
        updated.email !== originalEmail
          ? 'Account updated. Please log out and sign in with your new email.'
          : 'Account updated successfully!'
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update account.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function submitReport() {
    setMessage('')
    setError('')

    const cleanDescription = description.trim()

    if (reportType === 'USER' && !selectedUser) {
      setError('Please select a user from the search results.')
      return
    }

    if (cleanDescription.length < 10) {
      setError(
        `Description needs at least 10 characters. Current: ${cleanDescription.length}.`
      )
      return
    }

    setSaving(true)

    try {
      const response = await settingsApi.report(
        reportType,
        cleanDescription,
        reportType === 'USER'
          ? selectedUser!.username
          : undefined
      )

      setMessage(
        `Report #${response.id} submitted successfully.`
      )

      setDescription('')
      resetUserSearch()
      setReportType('ISSUE')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit report.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    setMessage('')
    setError('')

    if (!currentPassword) {
      setError('Enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSaving(true)

    try {
      const response = await settingsApi.changePassword(
        currentPassword,
        newPassword
      )

      setMessage(response.message)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to change password.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1>⚙️ Settings</h1>
          <p>
            Manage your account, report issues and access support.
          </p>
        </header>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`settings-tab ${
                  activeTab === tab.id ? 'active' : ''
                }`}
                onClick={() => changeTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          <section className="settings-content">

            {loading && <p>Loading settings...</p>}

            {!loading && activeTab === 'account' && (
              <div>
                <h2>Account Settings</h2>
                <p className="settings-description">
                  Update your display name and email address.
                </p>

                <label className="settings-label">
                  Display Name
                  <input
                    value={displayName}
                    maxLength={150}
                    onChange={e =>
                      setDisplayName(e.target.value)
                    }
                    placeholder="Enter display name"
                  />
                </label>

                <label className="settings-label">
                  Email Address
                  <input
                    type="email"
                    value={email}
                    maxLength={150}
                    onChange={e =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter email address"
                  />
                </label>

                <button
                  type="button"
                  className="settings-save"
                  disabled={saving}
                  onClick={() => void saveAccount()}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {!loading && activeTab === 'report' && (
              <div>
                <h2>Report Issue or User</h2>
                <p className="settings-description">
                  Report a technical problem or inappropriate account.
                </p>

                <label className="settings-label">
                  Report Type
                  <select
                    value={reportType}
                    onChange={e => {
                      setReportType(e.target.value as ReportType)
                      resetUserSearch()
                      setError('')
                      setMessage('')
                    }}
                  >
                    <option value="ISSUE">
                      Technical Issue
                    </option>
                    <option value="USER">
                      Report a User
                    </option>
                  </select>
                </label>

                {reportType === 'USER' && (
                  <div className="settings-label">
                    <label htmlFor="settings-username-search">
                      Username
                    </label>

                    <div className="settings-user-search">
                      <input
                        id="settings-username-search"
                        type="search"
                        autoComplete="off"
                        placeholder="Search users, e.g. @msr"
                        value={reportedUsername}
                        onChange={e => {
                          setReportedUsername(e.target.value)
                          setSelectedUser(null)
                          setUserResults([])
                          setError('')
                        }}
                      />

                      {selectedUser && (
                        <p className="settings-selected-user">
                          ✓ Selected: @{selectedUser.username}
                          {' — '}
                          {selectedUser.fullName}
                        </p>
                      )}

                      {!selectedUser && searchingUsers && (
                        <p className="settings-search-status">
                          Searching users...
                        </p>
                      )}

                      {!selectedUser && searchError && (
                        <p className="settings-error" role="alert">
                          {searchError}
                        </p>
                      )}

                      {!selectedUser &&
                        !searchingUsers &&
                        userResults.length > 0 && (
                          <div className="settings-user-results">
                            {userResults.map(user => (
                              <button
                                key={user.userId}
                                type="button"
                                className="settings-user-result"
                                onClick={() => selectUser(user)}
                              >
                                <strong>@{user.username}</strong>
                                <span>{user.fullName}</span>
                              </button>
                            ))}
                          </div>
                        )}

                      {!selectedUser &&
                        !searchingUsers &&
                        !searchError &&
                        reportedUsername.trim()
                          .replace(/^@+/, '').length >= 2 &&
                        userResults.length === 0 && (
                          <p className="settings-search-status">
                            No matching users found.
                          </p>
                        )}
                    </div>
                  </div>
                )}

                <label className="settings-label">
                  Description
                  <textarea
                    rows={6}
                    maxLength={2000}
                    value={description}
                    onChange={e =>
                      setDescription(e.target.value)
                    }
                    placeholder={
                      reportType === 'USER'
                        ? 'Explain why you are reporting this user...'
                        : 'Describe the technical issue...'
                    }
                  />
                </label>

                <p className="settings-description">
                  {description.trim().length}/2000 characters
                  {' · '}Minimum 10 characters
                </p>

                <button
                  type="button"
                  className="settings-save"
                  disabled={saving}
                  onClick={() => void submitReport()}
                >
                  {saving ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            )}

            {!loading && activeTab === 'security' && (
              <div>
                <h2>Account Security</h2>
                <p className="settings-description">
                  Change your account password.
                </p>

                <label className="settings-label">
                  Current Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={e =>
                      setCurrentPassword(e.target.value)
                    }
                  />
                </label>

                <label className="settings-label">
                  New Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e =>
                      setNewPassword(e.target.value)
                    }
                  />
                </label>

                <label className="settings-label">
                  Confirm New Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </label>

                <button
                  type="button"
                  className="settings-save"
                  disabled={saving}
                  onClick={() => void changePassword()}
                >
                  {saving ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            )}

            {!loading && activeTab === 'help' && (
              <div>
                <h2>Help &amp; Support</h2>
                <p className="settings-description">
                  Frequently asked questions and troubleshooting.
                </p>

                {faq.map((item, index) => (
                  <details
                    key={index}
                    className="settings-faq"
                  >
                    <summary>{item.question}</summary>
                    <p>{item.answer}</p>
                  </details>
                ))}

                <button
                  type="button"
                  className="settings-save"
                  onClick={() => {
                    setReportType('ISSUE')
                    resetUserSearch()
                    changeTab('report')
                  }}
                >
                  Contact Support
                </button>
              </div>
            )}

            {!loading && activeTab === 'guidelines' && (
              <div>
                <h2>Community Guidelines</h2>
                <p className="settings-description">
                  Keep Creative Network safe and respectful.
                </p>

                <ul>
                  {guidelines.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}

            {message && (
              <p className="settings-message" role="status">
                {message}
              </p>
            )}

            {error && (
              <p
                className="settings-message settings-error"
                role="alert"
              >
                {error}
              </p>
            )}

          </section>
        </div>
      </div>
    </main>
  )
}
