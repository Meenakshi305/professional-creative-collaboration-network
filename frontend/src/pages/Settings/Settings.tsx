
import { useState } from 'react'
import './Settings.css'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [eventNotifications, setEventNotifications] = useState(true)
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [theme, setTheme] = useState('light')
  const [message, setMessage] = useState('')

  const showMessage = () => {
    setMessage('Demo only: changes are not saved to the server.')
  }

  return (
    <main className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <span className="settings-eyebrow">PERSONALISE YOUR EXPERIENCE</span>
          <h1>⚙️ Settings</h1>
          <p>
            Manage your account preferences, notifications,
            privacy and appearance.
          </p>
        </header>

        <div className="settings-layout">
          <aside className="settings-sidebar">
            {[
              ['account', '👤 Account Settings'],
              ['notifications', '🔔 Notifications'],
              ['privacy', '🔒 Privacy & Security'],
              ['appearance', '🎨 Appearance']
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`settings-tab ${activeTab === id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(id)
                  setMessage('')
                }}
              >
                {label}
              </button>
            ))}
          </aside>

          <section className="settings-content">
            {activeTab === 'account' && (
              <div>
                <h2>Account Settings</h2>
                <p className="settings-description">
                  Update your basic account information.
                </p>

                <label className="settings-label">
                  Display Name
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </label>

                <label className="settings-label">
                  Email Address
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </label>

                <button className="settings-save" onClick={showMessage}>
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2>Notification Preferences</h2>
                <p className="settings-description">
                  Choose which updates you would like to receive.
                </p>

                <label className="settings-toggle">
                  <span>Email Notifications</span>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                </label>

                <label className="settings-toggle">
                  <span>Event Notifications</span>
                  <input
                    type="checkbox"
                    checked={eventNotifications}
                    onChange={(e) => setEventNotifications(e.target.checked)}
                  />
                </label>

                <button className="settings-save" onClick={showMessage}>
                  Save Preferences
                </button>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div>
                <h2>Privacy & Security</h2>
                <p className="settings-description">
                  Control who can view your creative profile.
                </p>

                <label className="settings-label">
                  Profile Visibility
                  <select
                    value={profileVisibility}
                    onChange={(e) => setProfileVisibility(e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>

                <button className="settings-save" onClick={showMessage}>
                  Save Privacy Settings
                </button>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h2>Appearance</h2>
                <p className="settings-description">
                  Select your preferred interface theme.
                </p>

                <label className="settings-label">
                  Theme Preference
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">System Default</option>
                  </select>
                </label>

                <button className="settings-save" onClick={showMessage}>
                  Save Appearance
                </button>
              </div>
            )}

            {message && (
              <p className="settings-message" role="status">{message}</p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}