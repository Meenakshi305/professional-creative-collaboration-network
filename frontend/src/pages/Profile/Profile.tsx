import { useState } from 'react'
import './Profile.css'

type EditableProfile = {
  displayName: string
  professionalTitle: string
  location: string
  website: string
  bio: string
}

type Visibility = 'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE'

function Profile() {
  const [activeTab, setActiveTab] = useState<
    'portfolio' | 'posts' | 'achievements'
  >('portfolio')

  const [isEditing, setIsEditing] = useState(false)
  const [isAddingSkill, setIsAddingSkill] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC')

  const [profile, setProfile] = useState({
    displayName: 'Sonny Hayes',
    professionalTitle: 'Professional Racing Driver',
    location: 'United States',
    website: 'sonnyhayes.racing',
    bio: 'Veteran racing driver with decades of experience behind the wheel. Focused on performance, teamwork and pushing every lap to the limit.',

    stats: {
      followers: '1.2M',
      following: 184,
      collaborations: 27
    },

    skills: [
      'Race Craft',
      'Vehicle Development',
      'Race Strategy',
      'Driver Mentoring',
      'Performance Analysis'
    ],

    portfolio: [
      {
        id: 1,
        title: 'APXGP Formula 1',
        category: 'Motorsport',
        description:
          'Competing at the highest level of motorsport while working closely with the team to improve performance on and off the track.',
        symbol: 'F1'
      },
      {
        id: 2,
        title: 'Race Development',
        category: 'Performance',
        description:
          'Working with engineers and the racing team to analyse vehicle behaviour, race performance and competitive strategy.',
        symbol: '01'
      },
      {
        id: 3,
        title: 'Driver Mentorship',
        category: 'Collaboration',
        description:
          'Sharing racing experience and working alongside the next generation of drivers in a competitive team environment.',
        symbol: 'SH'
      }
    ],

    posts: [
      {
        id: 1,
        text:
          'Every lap gives you information. The challenge is knowing what matters, adapting quickly and giving the team everything you have.',
        date: '2 days ago',
        likes: '42K'
      },
      {
        id: 2,
        text:
          'Long day at the circuit with the team. Plenty of data to work through, but we are moving in the right direction.',
        date: '5 days ago',
        likes: '31K'
      },
      {
        id: 3,
        text:
          'Racing has always been a team effort. Drivers get the spotlight, but every person behind the car contributes to what happens on Sunday.',
        date: '2 weeks ago',
        likes: '58K'
      }
    ],

    achievements: [
      {
        id: 1,
        title: 'Formula 1 Return',
        description:
          'Returned to elite single-seater competition as part of the APXGP racing programme.',
        date: 'Recent'
      },
      {
        id: 2,
        title: 'Endurance Racing Experience',
        description:
          'Built extensive experience across demanding endurance and professional motorsport environments.',
        date: 'Career'
      },
      {
        id: 3,
        title: 'Driver Development',
        description:
          'Contributed racing knowledge and experience to support team performance and driver development.',
        date: 'Career'
      }
    ]
  })

  const [editForm, setEditForm] = useState<EditableProfile>({
    displayName: profile.displayName,
    professionalTitle: profile.professionalTitle,
    location: profile.location,
    website: profile.website,
    bio: profile.bio
  })

  const openEditProfile = () => {
    setEditForm({
      displayName: profile.displayName,
      professionalTitle: profile.professionalTitle,
      location: profile.location,
      website: profile.website,
      bio: profile.bio
    })

    setIsEditing(true)
  }

  const handleEditChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target

    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }))
  }

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setProfile((currentProfile) => ({
      ...currentProfile,
      displayName: editForm.displayName.trim(),
      professionalTitle: editForm.professionalTitle.trim(),
      location: editForm.location.trim(),
      website: editForm.website.trim(),
      bio: editForm.bio.trim()
    }))

    setIsEditing(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const addSkill = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const skill = newSkill.trim()

    if (!skill) {
      return
    }

    const skillAlreadyExists = profile.skills.some(
      (existingSkill) =>
        existingSkill.toLowerCase() === skill.toLowerCase()
    )

    if (skillAlreadyExists) {
      return
    }

    setProfile((currentProfile) => ({
      ...currentProfile,
      skills: [...currentProfile.skills, skill]
    }))

    setNewSkill('')
    setIsAddingSkill(false)
  }

  const removeSkill = (skillToRemove: string) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      skills: currentProfile.skills.filter(
        (skill) => skill !== skillToRemove
      )
    }))
  }

  const closeSkillModal = () => {
    setNewSkill('')
    setIsAddingSkill(false)
  }

  const getVisibilityLabel = () => {
    if (visibility === 'PUBLIC') {
      return 'Public'
    }

    if (visibility === 'MEMBERS_ONLY') {
      return 'Members Only'
    }

    return 'Private'
  }

  return (
    <main className="profile-page">
      <div className="profile-content">
        <section className="profile-card">
          <div className="profile-banner">
            <div className="banner-number">7</div>
            <div className="banner-label">APXGP</div>
          </div>

          <div className="profile-main-info">
            <div className="profile-avatar">SH</div>

            <div className="profile-heading">
              <div className="profile-name-row">
                <div>
                  <div className="profile-name-line">
                    <h1>{profile.displayName}</h1>
                    <span className="verified-badge">✓</span>
                  </div>

                  <p className="profile-title">
                    {profile.professionalTitle}
                  </p>
                </div>

                <button
                  className="edit-profile-button"
                  onClick={openEditProfile}
                >
                  Edit Profile
                </button>
              </div>

              <div className="profile-meta">
                <span>📍 {profile.location}</span>
                <span>🏁 APXGP Racing</span>
                <span>🔗 {profile.website}</span>
              </div>

              <p className="profile-bio">
                {profile.bio}
              </p>

              <div className="profile-stats">
                <div className="profile-stat">
                  <strong>{profile.stats.followers}</strong>
                  <span>Followers</span>
                </div>

                <div className="profile-stat">
                  <strong>{profile.stats.following}</strong>
                  <span>Following</span>
                </div>

                <div className="profile-stat">
                  <strong>{profile.stats.collaborations}</strong>
                  <span>Collaborations</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-section-card">
          <div className="profile-section-heading">
            <div>
              <p className="section-eyebrow">
                PROFESSIONAL EXPERTISE
              </p>

              <h2>Skills & Experience</h2>
            </div>

            <button
              className="profile-small-button"
              onClick={() => setIsAddingSkill(true)}
            >
              + Add Skill
            </button>
          </div>

          <div className="skills-list">
            {profile.skills.map((skill) => (
              <div className="skill-chip" key={skill}>
                <span>{skill}</span>

                <button
                  className="remove-skill-button"
                  onClick={() => removeSkill(skill)}
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="visibility-section">
            <div className="visibility-heading">
              <div>
                <p className="section-eyebrow">
                  PROFILE PRIVACY
                </p>

                <h3>Profile Visibility</h3>

                <p>
                  Choose who can view your professional profile.
                </p>
              </div>

              <span className="visibility-status">
                {getVisibilityLabel()}
              </span>
            </div>

            <div className="visibility-options">
              <button
                className={
                  visibility === 'PUBLIC'
                    ? 'visibility-option active'
                    : 'visibility-option'
                }
                onClick={() => setVisibility('PUBLIC')}
              >
                <strong>Public</strong>
                <span>
                  Anyone can view your profile
                </span>
              </button>

              <button
                className={
                  visibility === 'MEMBERS_ONLY'
                    ? 'visibility-option active'
                    : 'visibility-option'
                }
                onClick={() => setVisibility('MEMBERS_ONLY')}
              >
                <strong>Members Only</strong>
                <span>
                  Only registered creatives can view it
                </span>
              </button>

              <button
                className={
                  visibility === 'PRIVATE'
                    ? 'visibility-option active'
                    : 'visibility-option'
                }
                onClick={() => setVisibility('PRIVATE')}
              >
                <strong>Private</strong>
                <span>
                  Your profile is visible only to you
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="profile-section-card profile-work-section">
          <div className="profile-tabs">
            <button
              className={
                activeTab === 'portfolio'
                  ? 'profile-tab active'
                  : 'profile-tab'
              }
              onClick={() => setActiveTab('portfolio')}
            >
              Career
            </button>

            <button
              className={
                activeTab === 'posts'
                  ? 'profile-tab active'
                  : 'profile-tab'
              }
              onClick={() => setActiveTab('posts')}
            >
              Posts
            </button>

            <button
              className={
                activeTab === 'achievements'
                  ? 'profile-tab active'
                  : 'profile-tab'
              }
              onClick={() => setActiveTab('achievements')}
            >
              Achievements
            </button>
          </div>

          {activeTab === 'portfolio' && (
            <div className="portfolio-grid">
              {profile.portfolio.map((project) => (
                <article
                  className="portfolio-card"
                  key={project.id}
                >
                  <div className="portfolio-image-placeholder">
                    <span className="project-symbol">
                      {project.symbol}
                    </span>

                    <span className="project-background-text">
                      RACING
                    </span>
                  </div>

                  <div className="portfolio-card-content">
                    <span className="portfolio-category">
                      {project.category}
                    </span>

                    <h3>{project.title}</h3>

                    <p>{project.description}</p>

                    <button className="portfolio-view-button">
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="profile-posts">
              {profile.posts.map((post) => (
                <article
                  className="profile-post"
                  key={post.id}
                >
                  <div className="profile-post-header">
                    <div className="profile-post-avatar">
                      SH
                    </div>

                    <div>
                      <div className="post-name">
                        <strong>
                          {profile.displayName}
                        </strong>

                        <span className="small-verified">
                          ✓
                        </span>
                      </div>

                      <span>
                        {profile.professionalTitle} • {post.date}
                      </span>
                    </div>
                  </div>

                  <p>{post.text}</p>

                  <div className="profile-post-footer">
                    <span>
                      ♡ {post.likes} likes
                    </span>

                    <span>
                      💬 Comments
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="achievements-list">
              {profile.achievements.map((achievement) => (
                <article
                  className="achievement-card"
                  key={achievement.id}
                >
                  <div className="achievement-icon">
                    ★
                  </div>

                  <div className="achievement-info">
                    <div className="achievement-title-row">
                      <h3>
                        {achievement.title}
                      </h3>

                      <span>
                        {achievement.date}
                      </span>
                    </div>

                    <p>
                      {achievement.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {isEditing && (
        <div
          className="edit-modal-overlay"
          onMouseDown={cancelEdit}
        >
          <div
            className="edit-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="edit-modal-header">
              <div>
                <p className="section-eyebrow">
                  PROFESSIONAL IDENTITY
                </p>

                <h2>Edit Profile</h2>
              </div>

              <button
                className="edit-modal-close"
                onClick={cancelEdit}
                type="button"
              >
                ×
              </button>
            </div>

            <form
              className="edit-profile-form"
              onSubmit={saveProfile}
            >
              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label htmlFor="displayName">
                    Display Name
                  </label>

                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={editForm.displayName}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="edit-form-group">
                  <label htmlFor="professionalTitle">
                    Professional Title
                  </label>

                  <input
                    id="professionalTitle"
                    name="professionalTitle"
                    type="text"
                    value={editForm.professionalTitle}
                    onChange={handleEditChange}
                    required
                  />
                </div>
              </div>

              <div className="edit-form-row">
                <div className="edit-form-group">
                  <label htmlFor="location">
                    Location
                  </label>

                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={editForm.location}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="edit-form-group">
                  <label htmlFor="website">
                    Website
                  </label>

                  <input
                    id="website"
                    name="website"
                    type="text"
                    value={editForm.website}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="edit-form-group">
                <label htmlFor="bio">
                  Professional Bio
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  value={editForm.bio}
                  onChange={handleEditChange}
                  rows={5}
                />
              </div>

              <div className="edit-modal-actions">
                <button
                  className="edit-cancel-button"
                  type="button"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>

                <button
                  className="edit-save-button"
                  type="submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddingSkill && (
        <div
          className="edit-modal-overlay"
          onMouseDown={closeSkillModal}
        >
          <div
            className="skill-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="edit-modal-header">
              <div>
                <p className="section-eyebrow">
                  PROFESSIONAL EXPERTISE
                </p>

                <h2>Add Skill</h2>
              </div>

              <button
                className="edit-modal-close"
                type="button"
                onClick={closeSkillModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={addSkill}>
              <div className="edit-form-group">
                <label htmlFor="newSkill">
                  Skill or Expertise
                </label>

                <input
                  id="newSkill"
                  type="text"
                  value={newSkill}
                  onChange={(event) =>
                    setNewSkill(event.target.value)
                  }
                  placeholder="e.g. Wet Weather Racing"
                  autoFocus
                />
              </div>

              <div className="edit-modal-actions">
                <button
                  className="edit-cancel-button"
                  type="button"
                  onClick={closeSkillModal}
                >
                  Cancel
                </button>

                <button
                  className="edit-save-button"
                  type="submit"
                >
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Profile