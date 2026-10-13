import { useEffect, useRef, useState } from 'react'

import type { FormEvent } from 'react'

import {

  getAccountSettings,

  getUserSettings,

  updateAccountSettings,

  changePassword,

  updateNotificationSettings,

  updatePrivacySettings,

  updateAppearanceSettings,

  deactivateAccount,

  deleteAccount

} from '../../service/settingsService'

import type {

  AccountSettings,

  UpdateAccountRequest,

  NotificationSettings,

  PrivacySettings,

  AppearanceSettings

} from '../../service/settingsService'

import { hasLoginSession } from '../../service/authService'

import NavigationBar from '../../shared/NavigationBar/NavigationBar'

import './Settings.css'



const issueCategories = [
  {
    value: 'Bug',
    description: 'Something is not working correctly'
  },
  {
    value: 'Login / Account',
    description: 'Sign-in, password or account problems'
  },
  {
    value: 'UI / Display',
    description: 'Layout, styling or display problems'
  },
  {
    value: 'Website workflow',
    description: 'Navigation or workflow problems'
  },
  {
    value: 'Collaboration Issues',
    description: 'Opportunities or collaboration requests'
  },
  {
    value: 'Events & Payments',
    description: 'Event registration or payment problems'
  },
  {
    value: 'Profile & Portfolio Issues',
    description: 'Profile or portfolio problems'
  },
  {
    value: 'Other',
    description: 'Anything not covered above'
  }
]


const severityCategories = [
  {
    value: 'Low',
    description: 'Minor issue with little impact'
  },
  {
    value: 'Medium',
    description: 'Moderate issue affecting normal usage'
  },
  {
    value: 'High',
    description: 'Major issue affecting important features'
  },
  {
    value: 'Critical',
    description: 'Severe issue preventing essential functionality'
  }
]


type Section =

  | 'account'

  | 'security'

  | 'notifications'

  | 'privacy'

  | 'appearance'

  | 'management'
  | 'query'
  | 'issue'
  | 'admin-access'

type Feedback = {

  type: 'success' | 'error' | 'info'

  message: string

}

const demoAccount: AccountSettings = {

  userId: 1,

  fullName: 'Demo User',

  username: 'demo_user',

  email: 'demo@example.com',

  dateOfBirth: null,

  role: 'USER',

  active: true

}

const defaultNotifications: NotificationSettings = {

  eventUpdates: true,

  collaborationRequests: true,

  emailNotifications: false

}

const defaultPrivacy: PrivacySettings = {

  profileVisibility: 'public',

  portfolioVisibility: 'public'

}

const defaultAppearance: AppearanceSettings = {

  theme: 'light'

}

const sections: {

  id: Section

  label: string

  icon: string

  description: string

}[] = [

  {

    id: 'account',

    label: 'Account',

    icon: '👤',

    description: 'Personal information and profile details'

  },

  {

    id: 'security',

    label: 'Security',

    icon: '🔒',

    description: 'Password and account protection'

  },

  {

    id: 'notifications',

    label: 'Notifications',

    icon: '🔔',

    description: 'Choose which updates you receive'

  },

  {

    id: 'privacy',

    label: 'Privacy',

    icon: '🛡️',

    description: 'Control who can view your information'

  },

  {

    id: 'appearance',

    label: 'Appearance',

    icon: '🎨',

    description: 'Personalise your experience'

  },

  {
    id: 'query',
    label: 'Raise a Query',
    icon: '💬',
    description: 'Ask a question or request assistance'
  },
  {
    id: 'issue',
    label: 'Report an Issue',
    icon: '🛠️',
    description: 'Tell us about a problem with the platform'
  },
  {
    id: 'admin-access',
    label: 'Admin Access',
    icon: '🛡️',
    description: 'Information about authorised administrator access'
  },
  {

    id: 'management',

    label: 'Account Management',

    icon: '⚙️',

    description: 'Manage account access and deletion'

  }

]


type SettingsProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
  onSettingsClick: () => void

  currentUserName?: string
  currentUsername?: string
  onLogoutClick?: () => void
}


function Settings({
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick,
  onSettingsClick,
  currentUserName,
  currentUsername,
  onLogoutClick
}: SettingsProps) {

  const [activeSection, setActiveSection] =

    useState<Section>('account')

  const [isDemo] = useState(() => !hasLoginSession())

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)

  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const [account, setAccount] =

    useState<AccountSettings>(demoAccount)

  const [accountForm, setAccountForm] =

    useState<UpdateAccountRequest>({

      fullName: '',

      username: '',

      email: ''

    })

  const [passwordForm, setPasswordForm] = useState({

    currentPassword: '',

    newPassword: '',

    confirmPassword: ''

  })

  const [notifications, setNotifications] =

    useState<NotificationSettings>(defaultNotifications)

  const [privacy, setPrivacy] =

    useState<PrivacySettings>(defaultPrivacy)

  const [appearance, setAppearance] =

    useState<AppearanceSettings>(defaultAppearance)

  const [confirmation, setConfirmation] =

    useState<'deactivate' | 'delete' | null>(null)

  // Frontend-only drafts: no network request, database save or admin navigation.
  const [queryForm, setQueryForm] = useState({
    subject: '', category: 'General', description: ''
  })
  const [issueForm, setIssueForm] = useState({
    title: '', type: 'Bug', severity: 'Medium', steps: '', description: ''
  })  
const [issueDropdownOpen, setIssueDropdownOpen] = useState(false)
const [issueSearch, setIssueSearch] = useState('')
const issueDropdownRef = useRef<HTMLDivElement>(null)

const [severityDropdownOpen, setSeverityDropdownOpen] = useState(false)
const [severitySearch, setSeveritySearch] = useState('')
const severityDropdownRef = useRef<HTMLDivElement>(null)

const filteredSeverityCategories = severityCategories.filter(category =>
  `${category.value} ${category.description}`
    .toLowerCase()
    .includes(severitySearch.toLowerCase())
)

const filteredIssueCategories = issueCategories.filter(category =>
  `${category.value} ${category.description}`
    .toLowerCase()
    .includes(issueSearch.toLowerCase())
)

useEffect(() => {
  function handleOutsideClick(event: MouseEvent) {
    if (
      issueDropdownRef.current &&
      !issueDropdownRef.current.contains(event.target as Node)
    ) {
      setIssueDropdownOpen(false)
    }
    if (
      severityDropdownRef.current &&
      !severityDropdownRef.current.contains(event.target as Node)
    ) {
      setSeverityDropdownOpen(false)
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setIssueDropdownOpen(false)
      setSeverityDropdownOpen(false)
    }
  }

  document.addEventListener('mousedown', handleOutsideClick)
  document.addEventListener('keydown', handleEscape)

  return () => {
    document.removeEventListener('mousedown', handleOutsideClick)
    document.removeEventListener('keydown', handleEscape)
  }
}, [])

  function submitSupportPreview(event: FormEvent<HTMLFormElement>, kind: 'query' | 'issue') {
    event.preventDefault()
    const valid = kind === 'query'
      ? queryForm.subject.trim() && queryForm.description.trim()
      : issueForm.title.trim() && issueForm.description.trim() && issueForm.steps.trim()
    if (!valid) {
      showFeedback('error', 'Please complete the required fields.')
      return
    }
    showFeedback('info', kind === 'query'
      ? 'Query preview validated. Not submitted: support backend integration is pending.'
      : 'Issue preview validated. Not submitted: issue-reporting backend integration is pending.')
  }

  const [deleteConfirmationText, setDeleteConfirmationText] =

    useState('')

  useEffect(() => {

    let cancelled = false

    async function loadSettings() {

      if (isDemo) {

        setAccount(demoAccount)

        setAccountForm({

          fullName: demoAccount.fullName,

          username: demoAccount.username,

          email: demoAccount.email

        })

        setLoading(false)

        return

      }

      try {

        const [user, preferences] = await Promise.all([

          getAccountSettings(),

          getUserSettings()

        ])

        if (cancelled) return

        setAccount(user)

        setAccountForm({

          fullName: user.fullName,

          username: user.username,

          email: user.email

        })

        setNotifications(preferences.notifications)

        setPrivacy(preferences.privacy)

        setAppearance(preferences.appearance)

      } catch (error) {

        if (cancelled) return

        setFeedback({

          type: 'error',

          message: error instanceof Error

            ? error.message

            : 'Unable to load account settings.'

        })

      } finally {

        if (!cancelled) setLoading(false)

      }

    }

    void loadSettings()

    return () => {

      cancelled = true

    }

  }, [isDemo])

  function showFeedback(type: Feedback['type'], message: string) {

    setFeedback({ type, message })

  }

  function selectSection(section: Section) {

    setActiveSection(section)

    setFeedback(null)

    setConfirmation(null)

  }

  async function handleAccountSave(event: FormEvent<HTMLFormElement>) {

    event.preventDefault()

    if (

      !accountForm.fullName.trim() ||

      !accountForm.username.trim() ||

      !accountForm.email.trim()

    ) {

      showFeedback('error', 'Please complete all required fields.')

      return

    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.email)) {

      showFeedback('error', 'Please enter a valid email address.')

      return

    }

    if (isDemo) {

      setAccount(previous => ({

        ...previous,

        ...accountForm

      }))

      showFeedback(

        'info',

        'Demo preview updated. These changes have not been saved to the database.'

      )

      return

    }

    setSaving(true)

    try {

      const updated = await updateAccountSettings(accountForm)

      setAccount(updated)

      showFeedback('success', 'Account information saved successfully.')

    } catch (error) {

      showFeedback(

        'error',

        error instanceof Error ? error.message : 'Unable to save account.'

      )

    } finally {

      setSaving(false)

    }

  }

  async function handlePasswordSave(event: FormEvent<HTMLFormElement>) {

    event.preventDefault()

    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword || !newPassword || !confirmPassword) {

      showFeedback('error', 'Please complete all password fields.')

      return

    }

    if (newPassword.length < 8) {

      showFeedback('error', 'New password must contain at least 8 characters.')

      return

    }

    if (newPassword !== confirmPassword) {

      showFeedback('error', 'New passwords do not match.')

      return

    }

    if (isDemo) {

      showFeedback(

        'info',

        'Password changes require a real authenticated backend session.'

      )

      return

    }

    setSaving(true)

    try {

      await changePassword(passwordForm)

      setPasswordForm({

        currentPassword: '',

        newPassword: '',

        confirmPassword: ''

      })

      showFeedback('success', 'Password updated successfully.')

    } catch (error) {

      showFeedback(

        'error',

        error instanceof Error ? error.message : 'Unable to update password.'

      )

    } finally {

      setSaving(false)

    }

  }

  async function saveNotifications() {

    if (isDemo) {

      showFeedback(

        'info',

        'Notification preferences updated for this preview only. No database changes were made.'

      )

      return

    }

    setSaving(true)

    try {

      const updated = await updateNotificationSettings(notifications)

      setNotifications(updated)

      showFeedback('success', 'Notification preferences saved.')

    } catch (error) {

      showFeedback(

        'error',

        error instanceof Error ? error.message : 'Unable to save notifications.'

      )

    } finally {

      setSaving(false)

    }

  }

  async function savePrivacy() {

    if (isDemo) {

      showFeedback(

        'info',

        'Privacy preferences updated for this preview only. No database changes were made.'

      )

      return

    }

    setSaving(true)

    try {

      const updated = await updatePrivacySettings(privacy)

      setPrivacy(updated)

      showFeedback('success', 'Privacy preferences saved.')

    } catch (error) {

      showFeedback(

        'error',

        error instanceof Error ? error.message : 'Unable to save privacy settings.'

      )

    } finally {

      setSaving(false)

    }

  }

  async function saveAppearance() {

    if (isDemo) {

      showFeedback(

        'info',

        'Appearance preference selected for preview only. App-wide theming is not connected yet.'

      )

      return

    }

    setSaving(true)

    try {

      const updated = await updateAppearanceSettings(appearance)

      setAppearance(updated)

      showFeedback(

        'success',

        'Appearance preference saved. App-wide theming requires integration.'

      )

    } catch (error) {

      showFeedback(

        'error',

        error instanceof Error ? error.message : 'Unable to save appearance.'

      )

    } finally {

      setSaving(false)

    }

  }

  async function handleAccountAction() {

    if (!confirmation) return

    if (confirmation === 'delete' && deleteConfirmationText !== 'DELETE') {

      showFeedback('error', 'Type DELETE to confirm account deletion.')

      return

    }

    if (isDemo) {

      showFeedback(

        'info',

        'Account deactivation and deletion are unavailable in demo mode.'

      )

      setConfirmation(null)

      setDeleteConfirmationText('')

      return

    }

    setSaving(true)

    try {

      if (confirmation === 'deactivate') {

        await deactivateAccount()

      } else {

        await deleteAccount()

      }

      showFeedback(

        'success',

        'Account request completed. Please sign out and contact the backend team to confirm the account lifecycle.'

      )

      setConfirmation(null)

      setDeleteConfirmationText('')

    } catch (error) {

      showFeedback(

        'error',

        error instanceof Error ? error.message : 'Unable to complete account action.'

      )

    } finally {

      setSaving(false)

    }

  }

  if (loading) {

    return (

        <>

    <NavigationBar
    activePage="settings"
    onHomeClick={onHomeClick}
    onProfileClick={onProfileClick}
    onCollaborationClick={onCollaborationClick}
    onEventsClick={onEventsClick}
    onSettingsClick={onSettingsClick}
    currentUserName={currentUserName}
    currentUsername={currentUsername}
    onLogoutClick={onLogoutClick}
    />

      <main className="settings-page">

        <div className="settings-loading">Loading settings...</div>

      </main>

      </>

    )

  }

  return (

    <>

    <NavigationBar
    activePage="settings"
    onHomeClick={onHomeClick}
    onProfileClick={onProfileClick}
    onCollaborationClick={onCollaborationClick}
    onEventsClick={onEventsClick}
    onSettingsClick={onSettingsClick}
    currentUserName={currentUserName}
    currentUsername={currentUsername}
    onLogoutClick={onLogoutClick}
    />

    <main className="settings-page">

      <div className="settings-heading">

        <div>

          <span className="settings-eyebrow">YOUR WORKSPACE</span>

          <h1>Settings</h1>

          <p>Manage your account, privacy and personal preferences.</p>

        </div>

        <div className="settings-heading-badge">

          {isDemo ? 'Demo Preview' : 'Account Settings'}

        </div>

      </div>

      {isDemo && (

        <div className="settings-demo-notice">

          <span aria-hidden="true">ℹ️</span>

          <div>

            <strong>Frontend preview mode</strong>

            <p>

              You can explore the Settings interface, but changes are not

              saved to the backend database.

            </p>

          </div>

        </div>

      )}

      <div className="settings-layout">

        <aside className="settings-sidebar" aria-label="Settings navigation">

          <div className="settings-sidebar-title">PREFERENCES</div>

          {sections.map(section => (
            <div key={section.id} className="settings-nav-entry">
              {section.id === 'query' && (
                <div className="settings-sidebar-title settings-support-label">HELP &amp; SUPPORT</div>
              )}


            <button

              key={section.id}

              type="button"

              className={`settings-nav-item ${

                activeSection === section.id ? 'active' : ''

              }`}

              onClick={() => selectSection(section.id)}

            >

              <span className="settings-nav-icon" aria-hidden="true">

                {section.icon}

              </span>

              <span>{section.label}</span>

              {activeSection === section.id && (

                <span className="settings-nav-arrow" aria-hidden="true">

                  →

                </span>

              )}

            </button>
            </div>
          ))}

        </aside>

        <section className="settings-content">

          <div className="settings-section-header">

            <div className="settings-section-icon" aria-hidden="true">

              {sections.find(item => item.id === activeSection)?.icon}

            </div>

            <div>

              <h2>

                {sections.find(item => item.id === activeSection)?.label}

              </h2>

              <p>

                {sections.find(item => item.id === activeSection)?.description}

              </p>

            </div>

          </div>

          {feedback && (

            <div

              className={`settings-feedback settings-feedback-${feedback.type}`}

              role="status"

            >

              {feedback.message}

            </div>

          )}

          {activeSection === 'account' && (

            <form className="settings-form" onSubmit={handleAccountSave}>

              <div className="settings-subheading">

                <h3>Personal Information</h3>

                <p>Keep your account details accurate and up to date.</p>

              </div>

              <div className="settings-form-grid">

                <label className="settings-field">

                  <span>Full Name *</span>

                  <input

                    value={accountForm.fullName}

                    onChange={event =>

                      setAccountForm(previous => ({

                        ...previous,

                        fullName: event.target.value

                      }))

                    }

                    placeholder="Enter your full name"

                    required

                  />

                </label>

                <label className="settings-field">

                  <span>Username *</span>

                  <input

                    value={accountForm.username}

                    onChange={event =>

                      setAccountForm(previous => ({

                        ...previous,

                        username: event.target.value

                      }))

                    }

                    placeholder="Enter your username"

                    required

                  />

                </label>

                <label className="settings-field settings-field-full">

                  <span>Email Address *</span>

                  <input

                    type="email"

                    value={accountForm.email}

                    onChange={event =>

                      setAccountForm(previous => ({

                        ...previous,

                        email: event.target.value

                      }))

                    }

                    placeholder="Enter your email"

                    required

                  />

                </label>

                <label className="settings-field">

                  <span>Date of Birth</span>

                  <input

                    value={account.dateOfBirth || 'Not provided'}

                    disabled

                  />

                </label>

                <label className="settings-field">

                  <span>Account Role</span>

                  <input value={account.role} disabled />

                </label>

              </div>

              <div className="settings-form-footer">

                <span>Fields marked * are required.</span>

                <button

                  type="submit"

                  className="settings-primary-button"

                  disabled={saving}

                >

                  {saving ? 'Saving...' : 'Save Changes'}

                </button>

              </div>

            </form>

          )}

          {activeSection === 'security' && (

            <form className="settings-form" onSubmit={handlePasswordSave}>

              <div className="settings-subheading">

                <h3>Change Password</h3>

                <p>Use a strong password to keep your account secure.</p>

              </div>

              <div className="settings-form-grid">

                {([

                  ['currentPassword', 'Current Password'],

                  ['newPassword', 'New Password'],

                  ['confirmPassword', 'Confirm New Password']

                ] as const).map(([key, label]) => (

                  <label

                    key={key}

                    className="settings-field settings-field-full"

                  >

                    <span>{label}</span>

                    <input

                      type="password"

                      autoComplete={

                        key === 'currentPassword'

                          ? 'current-password'

                          : 'new-password'

                      }

                      value={passwordForm[key]}

                      onChange={event =>

                        setPasswordForm(previous => ({

                          ...previous,

                          [key]: event.target.value

                        }))

                      }

                      placeholder={label}

                      required

                    />

                  </label>

                ))}

              </div>

              <div className="settings-form-footer">

                <span>Use at least 8 characters.</span>

                <button

                  type="submit"

                  className="settings-primary-button"

                  disabled={saving}

                >

                  {saving ? 'Updating...' : 'Update Password'}

                </button>

              </div>

            </form>

          )}

          {activeSection === 'notifications' && (

            <div className="settings-form">

              <div className="settings-subheading">

                <h3>Notification Preferences</h3>

                <p>Choose the updates you want to receive.</p>

              </div>

              {([

                ['eventUpdates', 'Event Updates',

                  'Receive updates about events and activities.'],

                ['collaborationRequests', 'Collaboration Requests',

                  'Know when someone invites you to collaborate.'],

                ['emailNotifications', 'Email Notifications',

                  'Receive important notifications by email.']

              ] as const).map(([key, label, description]) => (

                <label className="settings-toggle-row" key={key}>

                  <span>

                    <strong>{label}</strong>

                    <small>{description}</small>

                  </span>

                  <input

                    type="checkbox"

                    className="settings-toggle"

                    checked={notifications[key]}

                    onChange={event =>

                      setNotifications(previous => ({

                        ...previous,

                        [key]: event.target.checked

                      }))

                    }

                  />

                </label>

              ))}

              <div className="settings-form-footer">

                <span>Manage how you stay informed.</span>

                <button

                  type="button"

                  className="settings-primary-button"

                  onClick={() => void saveNotifications()}

                  disabled={saving}

                >

                  {saving ? 'Saving...' : 'Save Preferences'}

                </button>

              </div>

            </div>

          )}

          {activeSection === 'privacy' && (

            <div className="settings-form">

              <div className="settings-subheading">

                <h3>Privacy Controls</h3>

                <p>Choose who can discover your work and profile.</p>

              </div>

              {([

                ['profileVisibility', 'Profile Visibility',

                  'Control who can view your profile.'],

                ['portfolioVisibility', 'Portfolio Visibility',

                  'Control who can view your creative portfolio.']

              ] as const).map(([key, label, description]) => (

                <label className="settings-field" key={key}>

                  <span>{label}</span>

                  <small className="settings-field-description">

                    {description}

                  </small>

                  <select

                    value={privacy[key]}

                    onChange={event =>

                      setPrivacy(previous => ({

                        ...previous,

                        [key]: event.target.value as 'public' | 'private'

                      }))

                    }

                  >

                    <option value="public">Public</option>

                    <option value="private">Private</option>

                  </select>

                </label>

              ))}

              <div className="settings-form-footer">

                <span>Visibility changes require backend support.</span>

                <button

                  type="button"

                  className="settings-primary-button"

                  onClick={() => void savePrivacy()}

                  disabled={saving}

                >

                  {saving ? 'Saving...' : 'Save Privacy Settings'}

                </button>

              </div>

            </div>

          )}

          {activeSection === 'appearance' && (

            <div className="settings-form">

              <div className="settings-subheading">

                <h3>Appearance Preferences</h3>

                <p>Choose how you would like the platform to look.</p>

              </div>

              <div className="settings-theme-options">

                {([

                  ['light', '☀️', 'Light', 'A bright, clean workspace'],

                  ['dark', '🌙', 'Dark', 'A darker viewing experience'],

                  ['system', '💻', 'System', 'Follow your device settings']

                ] as const).map(([value, icon, label, description]) => (

                  <label

                    key={value}

                    className={`settings-theme-option ${

                      appearance.theme === value ? 'selected' : ''

                    }`}

                  >

                    <input

                      type="radio"

                      name="settings-theme"

                      checked={appearance.theme === value}

                      onChange={() =>

                        setAppearance({ theme: value })

                      }

                    />

                    <span className="settings-theme-icon">{icon}</span>

                    <strong>{label}</strong>

                    <small>{description}</small>

                  </label>

                ))}

              </div>

              <div className="settings-form-footer">

                <span>App-wide theme switching is not connected yet.</span>

                <button

                  type="button"

                  className="settings-primary-button"

                  onClick={() => void saveAppearance()}

                  disabled={saving}

                >

                  {saving ? 'Saving...' : 'Save Appearance'}

                </button>

              </div>

            </div>

          )}

          {activeSection === 'query' && (
            <form className="settings-form settings-support-form" onSubmit={event => submitSupportPreview(event, 'query')}>
              <div className="settings-subheading">
                <h3>Raise a Query</h3>
                <p>Ask for guidance or assistance. This is a frontend preview and will not send your query.</p>
              </div>
              <label className="settings-field">
                <span>Subject *</span>
                <input required maxLength={120} value={queryForm.subject}
                  onChange={event => setQueryForm(previous => ({ ...previous, subject: event.target.value }))}
                  placeholder="What do you need help with?" />
              </label>
              <label className="settings-field">
                <span>Category *</span>
                <select value={queryForm.category}
                  onChange={event => setQueryForm(previous => ({ ...previous, category: event.target.value }))}>
                  <option>General</option><option>Account</option><option>Collaboration</option>
                  <option>Events</option><option>Other</option>
                </select>
              </label>
              <label className="settings-field">
                <span>Description *</span>
                <textarea required rows={6} maxLength={2000} value={queryForm.description}
                  onChange={event => setQueryForm(previous => ({ ...previous, description: event.target.value }))}
                  placeholder="Describe your question in detail..." />
              </label>
              <div className="settings-support-note">Preview only — no message is sent or stored.</div>
              <div className="settings-form-footer">
                <span>All fields marked * are required.</span>
                <button className="settings-primary-button" type="submit">Validate Query Preview</button>
              </div>
            </form>
          )}

          {activeSection === 'issue' && (
            <form className="settings-form settings-support-form" onSubmit={event => submitSupportPreview(event, 'issue')}>
              <div className="settings-subheading">
                <h3>Report an Issue</h3>
                <p>Describe a technical problem. This preview does not send reports to a support team.</p>
              </div>
              <label className="settings-field">
                <span>Issue title *</span>
                <input required maxLength={120} value={issueForm.title}
                  onChange={event => setIssueForm(previous => ({ ...previous, title: event.target.value }))}
                  placeholder="Briefly describe the problem" />
              </label>
              <div className="settings-form-grid">                
                <div className="settings-field">
                <span id="settings-issue-type-label">Issue type *</span>

                <div
                    className="settings-issue-dropdown"
                    ref={issueDropdownRef}
                >
                    <button
                    type="button"
                    className="settings-issue-trigger"
                    aria-expanded={issueDropdownOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="settings-issue-type-label"
                    onClick={() => {
                        setIssueDropdownOpen(previous => !previous)
                        setIssueSearch('')
                    }}
                    >
                    <span className="settings-issue-trigger-label">

                        <span>{issueForm.type}</span>
                    </span>

                    <span
                        className="settings-issue-chevron"
                        aria-hidden="true"
                    >
                        ▼
                    </span>
                    </button>

                    {issueDropdownOpen && (
                    <div className="settings-issue-menu">
                        <input
                        type="search"
                        className="settings-issue-search"
                        placeholder="Search issue categories..."
                        aria-label="Search issue categories"
                        value={issueSearch}
                        onChange={event =>
                            setIssueSearch(event.target.value)
                        }
                        />

                        <div
                        className="settings-issue-options"
                        role="listbox"
                        aria-labelledby="settings-issue-type-label"
                        >
                        {filteredIssueCategories.map(category => (
                            <button
                            key={category.value}
                            type="button"
                            role="option"
                            aria-selected={
                                issueForm.type === category.value
                            }
                            className={`settings-issue-option ${
                                issueForm.type === category.value
                                ? 'selected'
                                : ''
                            }`}
                            onClick={() => {
                                setIssueForm(previous => ({
                                ...previous,
                                type: category.value
                                }))
                                setIssueDropdownOpen(false)
                                setIssueSearch('')
                            }}
                            >

                            <span className="settings-issue-option-text">
                                <strong>{category.value}</strong>
                                <small>{category.description}</small>
                            </span>

                            {issueForm.type === category.value && (
                                <span
                                className="settings-issue-check"
                                aria-hidden="true"
                                >
                                ✓
                                </span>
                            )}
                            </button>
                        ))}

                        {filteredIssueCategories.length === 0 && (
                            <div className="settings-issue-empty">
                            No matching issue categories found.
                            </div>
                        )}
                        </div>
                    </div>
                    )}
                </div>
                </div>                
                <div className="settings-field">
                <span id="settings-severity-label">Severity *</span>

                <div
                    className="settings-issue-dropdown"
                    ref={severityDropdownRef}
                >
                    <button
                    type="button"
                    className="settings-issue-trigger"
                    aria-expanded={severityDropdownOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="settings-severity-label"
                    onClick={() => {
                        setSeverityDropdownOpen(previous => !previous)
                        setIssueDropdownOpen(false)
                        setSeveritySearch('')
                    }}
                    >
                    <span className="settings-issue-trigger-label">
                        <span>{issueForm.severity}</span>
                    </span>

                    <span
                        className="settings-issue-chevron"
                        aria-hidden="true"
                    >
                        ▼
                    </span>
                    </button>

                    {severityDropdownOpen && (
                    <div className="settings-issue-menu">
                        <input
                        type="search"
                        className="settings-issue-search"
                        placeholder="Search severity levels..."
                        aria-label="Search severity levels"
                        value={severitySearch}
                        onChange={event =>
                            setSeveritySearch(event.target.value)
                        }
                        />

                        <div
                        className="settings-issue-options"
                        role="listbox"
                        aria-labelledby="settings-severity-label"
                        >
                        {filteredSeverityCategories.map(category => (
                            <button
                            key={category.value}
                            type="button"
                            role="option"
                            aria-selected={
                                issueForm.severity === category.value
                            }
                            className={`settings-issue-option ${
                                issueForm.severity === category.value
                                ? 'selected'
                                : ''
                            }`}
                            onClick={() => {
                                setIssueForm(previous => ({
                                ...previous,
                                severity: category.value
                                }))
                                setSeverityDropdownOpen(false)
                                setSeveritySearch('')
                            }}
                            >
                            <span className="settings-issue-option-text">
                                <strong>{category.value}</strong>
                                <small>{category.description}</small>
                            </span>

                            {issueForm.severity === category.value && (
                                <span
                                className="settings-issue-check"
                                aria-hidden="true"
                                >
                                ✓
                                </span>
                            )}
                            </button>
                        ))}

                        {filteredSeverityCategories.length === 0 && (
                            <div className="settings-issue-empty">
                            No matching severity levels found.
                            </div>
                        )}
                        </div>
                    </div>
                    )}
                </div>
                </div>
              </div>
              <label className="settings-field">
                <span>What happened? *</span>
                <textarea required rows={4} maxLength={2000} value={issueForm.description}
                  onChange={event => setIssueForm(previous => ({ ...previous, description: event.target.value }))}
                  placeholder="Explain what went wrong..." />
              </label>
              <label className="settings-field">
                <span>Steps to reproduce *</span>
                <textarea required rows={4} maxLength={2000} value={issueForm.steps}
                  onChange={event => setIssueForm(previous => ({ ...previous, steps: event.target.value }))}
                  placeholder="1. Open... 2. Click... 3. Observe..." />
              </label>
              <div className="settings-support-note">Preview only — no issue is sent or stored. Screenshot upload is not connected.</div>
              <div className="settings-form-footer">
                <span>All fields marked * are required.</span>
                <button className="settings-primary-button" type="submit">Validate Issue Preview</button>
              </div>
            </form>
          )}

          {activeSection === 'admin-access' && (
            <div className="settings-form settings-support-form">
              <div className="settings-subheading">
                <h3>Administrator Access</h3>
                <p>Admin features require an authenticated account with server-verified administrator permissions.</p>
              </div>
              <div className="settings-admin-status">
                <span aria-hidden="true">🛡️</span>
                <div>
                  <strong>{isDemo ? 'Demo mode — admin access unavailable' : 'Protected administrator area'}</strong>
                  <p>{isDemo
                    ? 'Demo accounts cannot access administrative functions.'
                    : 'Your current account role is shown below. Access must still be authorised by the backend.'}</p>
                </div>
              </div>
              <div className="settings-admin-meta">
                <span>Account role</span><strong>{isDemo ? 'DEMO (not verified)' : account.role}</strong>
              </div>
              <div className="settings-support-note">
                {isDemo || account.role !== 'ADMIN'
                  ? 'Admin Dashboard is unavailable for this account. No permission bypass is provided.'
                  : 'Your account reports an ADMIN role. The Admin Dashboard link is not connected here; backend authorisation and routing must be integrated separately.'}
              </div>
              <button type="button" className="settings-outline-button" disabled>
                Open Admin Dashboard — integration pending
              </button>
            </div>
          )}

          {activeSection === 'management' && (

            <div className="settings-form">

              <div className="settings-subheading">

                <h3>Account Management</h3>

                <p>Manage your account status and personal data.</p>

              </div>

              <div className="settings-danger-card">

                <div>

                  <h4>Deactivate Account</h4>

                  <p>

                    Request account deactivation. Backend support is

                    required to enforce this action.

                  </p>

                </div>

                <button

                  type="button"

                  className="settings-outline-button"

                  onClick={() => setConfirmation('deactivate')}

                >

                  Deactivate

                </button>

              </div>

              <div className="settings-danger-card">

                <div>

                  <h4>Delete Account</h4>

                  <p>

                    Permanently deleting your account may remove

                    your profile and associated content.

                  </p>

                </div>

                <button

                  type="button"

                  className="settings-danger-button"

                  onClick={() => setConfirmation('delete')}

                >

                  Delete Account

                </button>

              </div>

              {confirmation && (

                <div className="settings-confirmation">

                  <h4>

                    Confirm account {confirmation === 'delete'

                      ? 'deletion'

                      : 'deactivation'}

                  </h4>

                  <p>

                    {confirmation === 'delete'

                      ? 'This action may be irreversible.'

                      : 'You may lose access to your account.'}

                  </p>

                  {confirmation === 'delete' && (

                    <label className="settings-field">

                      <span>Type DELETE to confirm</span>

                      <input

                        value={deleteConfirmationText}

                        onChange={event =>

                          setDeleteConfirmationText(event.target.value)

                        }

                        placeholder="DELETE"

                      />

                    </label>

                  )}

                  <div className="settings-confirmation-actions">

                    <button

                      type="button"

                      className="settings-outline-button"

                      onClick={() => {

                        setConfirmation(null)

                        setDeleteConfirmationText('')

                      }}

                    >

                      Cancel

                    </button>

                    <button

                      type="button"

                      className="settings-danger-button"

                      disabled={saving}

                      onClick={() => void handleAccountAction()}

                    >

                      {saving ? 'Processing...' : 'Confirm'}

                    </button>

                  </div>

                </div>

              )}

            </div>

          )}

        </section>

      </div>

    </main>

    </>

  )

}

export default Settings
