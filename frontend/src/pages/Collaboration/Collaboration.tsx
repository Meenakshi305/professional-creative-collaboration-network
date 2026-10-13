import { useState } from 'react'
import './Collaboration.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'

type CollaborationProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
}

type CollaborationOpportunity = {
  id: number
  title: string
  creator: string
  description: string
  roleRequired: string
  category: string
  location: string
  skills: string[]
  closingDate: string
  status: 'OPEN' | 'CLOSED'
}

const initialOpportunities: CollaborationOpportunity[] = [
  {
    id: 1,
    title: 'Brand Identity Designer for Creative Startup',
    creator: 'North Studio',
    description:
      'We are looking for a graphic designer to help develop a fresh visual identity for an emerging creative brand. The project includes logo exploration, colour direction and supporting brand assets.',
    roleRequired: 'Graphic Designer',
    category: 'Design',
    location: 'Adelaide, SA',
    skills: ['Branding', 'Illustrator', 'Graphic Design'],
    closingDate: '18 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 2,
    title: 'Photographer Needed for Live Creative Event',
    creator: 'Frame Collective',
    description:
      'Seeking a photographer to capture a live creative networking event. The collaboration will involve event photography, candid professional portraits and delivery of edited digital images.',
    roleRequired: 'Event Photographer',
    category: 'Photography',
    location: 'Sydney, NSW',
    skills: ['Photography', 'Lightroom', 'Event Coverage'],
    closingDate: '22 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 3,
    title: 'Composer for Independent Short Film',
    creator: 'Silverline Films',
    description:
      'Our production team is searching for a composer interested in creating an original score for an independent short film. We are looking for someone comfortable working closely with a director.',
    roleRequired: 'Music Composer',
    category: 'Music',
    location: 'Remote',
    skills: ['Composition', 'Film Scoring', 'Audio Production'],
    closingDate: '28 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 4,
    title: 'Video Editor for Social Campaign',
    creator: 'Motion House',
    description:
      'Join a small creative team producing a digital campaign for social platforms. We need a video editor who can transform supplied footage into engaging short-form content.',
    roleRequired: 'Video Editor',
    category: 'Film & Video',
    location: 'Melbourne, VIC',
    skills: ['Premiere Pro', 'Video Editing', 'Storytelling'],
    closingDate: '31 Oct 2026',
    status: 'OPEN'
  },
  {
    id: 5,
    title: 'UI/UX Designer for Creative Portfolio Platform',
    creator: 'Pixel Forge',
    description:
      'Looking for a UI/UX designer to collaborate on interface concepts for a portfolio-focused digital product. You will work on user flows, wireframes and polished interface designs.',
    roleRequired: 'UI/UX Designer',
    category: 'Digital Design',
    location: 'Remote',
    skills: ['Figma', 'UI Design', 'UX Design'],
    closingDate: '4 Nov 2026',
    status: 'OPEN'
  },
  {
    id: 6,
    title: 'Illustrator for Editorial Art Project',
    creator: 'Canvas Journal',
    description:
      'We are seeking an illustrator to produce a small collection of original editorial illustrations for an upcoming digital publication focused on contemporary creative culture.',
    roleRequired: 'Illustrator',
    category: 'Illustration',
    location: 'Brisbane, QLD',
    skills: ['Illustration', 'Digital Art', 'Photoshop'],
    closingDate: '8 Nov 2026',
    status: 'OPEN'
  }
]

function Collaboration({
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick
}: CollaborationProps) {
  const [opportunities, setOpportunities] =
    useState<CollaborationOpportunity[]>(initialOpportunities)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLocation, setSelectedLocation] = useState('All')

  // Application state
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<CollaborationOpportunity | null>(null)

  const [coverMessage, setCoverMessage] = useState('')
  const [applicationError, setApplicationError] = useState('')
  const [applicationSuccess, setApplicationSuccess] = useState('')
  const [appliedOpportunityIds, setAppliedOpportunityIds] =
    useState<number[]>([])

  // Post opportunity state
  const [showPostOpportunity, setShowPostOpportunity] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newSkills, setNewSkills] = useState('')
  const [newClosingDate, setNewClosingDate] = useState('')

  const [postOpportunityError, setPostOpportunityError] = useState('')
  const [postOpportunitySuccess, setPostOpportunitySuccess] = useState('')

  // Search/filter data
  const categories = [
    'All',
    ...Array.from(
      new Set(opportunities.map((opportunity) => opportunity.category))
    )
  ]

  const locations = [
    'All',
    ...Array.from(
      new Set(opportunities.map((opportunity) => opportunity.location))
    )
  ]

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const searchValue = searchTerm.toLowerCase().trim()

    const matchesSearch =
      searchValue === '' ||
      opportunity.title.toLowerCase().includes(searchValue) ||
      opportunity.description.toLowerCase().includes(searchValue) ||
      opportunity.roleRequired.toLowerCase().includes(searchValue) ||
      opportunity.creator.toLowerCase().includes(searchValue) ||
      opportunity.skills.some((skill) =>
        skill.toLowerCase().includes(searchValue)
      )

    const matchesCategory =
      selectedCategory === 'All' ||
      opportunity.category === selectedCategory

    const matchesLocation =
      selectedLocation === 'All' ||
      opportunity.location === selectedLocation

    return matchesSearch && matchesCategory && matchesLocation
  })

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedLocation !== 'All'

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All')
    setSelectedLocation('All')
  }

  // Application functions
  const openApplication = (opportunity: CollaborationOpportunity) => {
    if (appliedOpportunityIds.includes(opportunity.id)) {
      return
    }

    setSelectedOpportunity(opportunity)
    setCoverMessage('')
    setApplicationError('')
    setApplicationSuccess('')
  }

  const closeApplication = () => {
    setSelectedOpportunity(null)
    setCoverMessage('')
    setApplicationError('')
    setApplicationSuccess('')
  }

  const submitApplication = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!selectedOpportunity) {
      return
    }

    const trimmedMessage = coverMessage.trim()

    if (!trimmedMessage) {
      setApplicationError(
        'Please enter a cover message before submitting your application.'
      )
      return
    }

    if (trimmedMessage.length < 30) {
      setApplicationError(
        'Your cover message must be at least 30 characters.'
      )
      return
    }

    if (appliedOpportunityIds.includes(selectedOpportunity.id)) {
      setApplicationError(
        'You have already applied for this opportunity.'
      )
      return
    }

    setAppliedOpportunityIds((currentIds) => [
      ...currentIds,
      selectedOpportunity.id
    ])

    setApplicationError('')
    setApplicationSuccess('Application submitted successfully.')
  }

  // Post opportunity functions
  const openPostOpportunity = () => {
    setShowPostOpportunity(true)
    setPostOpportunityError('')
    setPostOpportunitySuccess('')
  }

  const resetPostOpportunityForm = () => {
    setNewTitle('')
    setNewRole('')
    setNewCategory('')
    setNewLocation('')
    setNewDescription('')
    setNewSkills('')
    setNewClosingDate('')
    setPostOpportunityError('')
  }

  const closePostOpportunity = () => {
    setShowPostOpportunity(false)
    resetPostOpportunityForm()
    setPostOpportunitySuccess('')
  }

  const submitOpportunity = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const title = newTitle.trim()
    const role = newRole.trim()
    const category = newCategory.trim()
    const location = newLocation.trim()
    const description = newDescription.trim()

    const skills = newSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill !== '')

    if (
      !title ||
      !role ||
      !category ||
      !location ||
      !description ||
      !newClosingDate
    ) {
      setPostOpportunityError(
        'Please complete all required fields before publishing.'
      )
      return
    }

    if (title.length < 5) {
      setPostOpportunityError(
        'Opportunity title must be at least 5 characters.'
      )
      return
    }

    if (description.length < 30) {
      setPostOpportunityError(
        'Description must be at least 30 characters.'
      )
      return
    }

    if (skills.length === 0) {
      setPostOpportunityError(
        'Please enter at least one required skill.'
      )
      return
    }

    const closingDate = new Date(`${newClosingDate}T00:00:00`)

    if (Number.isNaN(closingDate.getTime())) {
      setPostOpportunityError(
        'Please select a valid closing date.'
      )
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (closingDate < today) {
      setPostOpportunityError(
        'Closing date cannot be in the past.'
      )
      return
    }

    const newOpportunity: CollaborationOpportunity = {
      id:
        opportunities.length > 0
          ? Math.max(
              ...opportunities.map((opportunity) => opportunity.id)
            ) + 1
          : 1,
      title,
      creator: 'You',
      description,
      roleRequired: role,
      category,
      location,
      skills,
      closingDate: closingDate.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      status: 'OPEN'
    }

    setOpportunities((currentOpportunities) => [
      newOpportunity,
      ...currentOpportunities
    ])

    setPostOpportunityError('')
    setPostOpportunitySuccess(
      'Your collaboration opportunity has been published successfully.'
    )
  }

  return (
    <div className="collaboration-screen">
      <NavigationBar
        activePage="collaborations"
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onCollaborationClick={onCollaborationClick}
        onEventsClick={onEventsClick}
      />

      <main className="collaboration-page">
        <section className="collaboration-hero">
          <div className="collaboration-hero-content">
            <p className="collaboration-eyebrow">
              CREATIVE COLLABORATION
            </p>

            <h1>Find Your Next Creative Collaboration</h1>

            <p className="collaboration-description">
              Discover opportunities posted by creative professionals,
              find projects that match your skills and connect with
              people looking to build something together.
            </p>
          </div>

          <button
            className="post-opportunity-button"
            type="button"
            onClick={openPostOpportunity}
          >
            + Post an Opportunity
          </button>
        </section>

        <section
          className="collaboration-filters"
          aria-label="Search and filter collaboration opportunities"
        >
          <div className="collaboration-search">
            <label htmlFor="collaboration-search">
              Search opportunities
            </label>

            <div className="search-input-wrapper">
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>

              <input
                id="collaboration-search"
                type="search"
                placeholder="Search by role, skill, project or creator..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>
          </div>

          <div className="filter-control">
            <label htmlFor="category-filter">Category</label>

            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
            >
              {categories.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-control">
            <label htmlFor="location-filter">Location</label>

            <select
              id="location-filter"
              value={selectedLocation}
              onChange={(event) =>
                setSelectedLocation(event.target.value)
              }
            >
              {locations.map((location) => (
                <option value={location} key={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="clear-filters-button"
              type="button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </section>

        <section className="opportunities-section">
          <div className="opportunities-heading">
            <div>
              <h2>Collaboration Opportunities</h2>
              <p>
                Explore currently available creative projects and roles.
              </p>
            </div>

            <span className="opportunity-count">
              {filteredOpportunities.length}{' '}
              {filteredOpportunities.length === 1
                ? 'opportunity'
                : 'opportunities'}
            </span>
          </div>

          {filteredOpportunities.length > 0 ? (
            <div className="opportunities-grid">
              {filteredOpportunities.map((opportunity) => {
                const hasApplied =
                  appliedOpportunityIds.includes(opportunity.id)

                return (
                  <article
                    className="opportunity-card"
                    key={opportunity.id}
                  >
                    <div className="opportunity-card-top">
                      <span className="opportunity-category">
                        {opportunity.category}
                      </span>

                      <span className="opportunity-status">
                        {opportunity.status}
                      </span>
                    </div>

                    <h3>{opportunity.title}</h3>

                    <p className="opportunity-creator">
                      Posted by {opportunity.creator}
                    </p>

                    <p className="opportunity-description">
                      {opportunity.description}
                    </p>

                    <div className="opportunity-details">
                      <div className="opportunity-detail">
                        <span className="detail-label">
                          Role required
                        </span>
                        <strong>{opportunity.roleRequired}</strong>
                      </div>

                      <div className="opportunity-detail">
                        <span className="detail-label">
                          Location
                        </span>
                        <strong>{opportunity.location}</strong>
                      </div>
                    </div>

                    <div className="opportunity-skills">
                      <span className="detail-label">Skills</span>

                      <div className="skill-list">
                        {opportunity.skills.map((skill) => (
                          <span className="skill-tag" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="opportunity-footer">
                      <div className="closing-date">
                        <span>Applications close</span>
                        <strong>{opportunity.closingDate}</strong>
                      </div>

                      <button
                        className={`apply-button ${
                          hasApplied ? 'applied' : ''
                        }`}
                        type="button"
                        disabled={hasApplied}
                        onClick={() => openApplication(opportunity)}
                      >
                        {hasApplied ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="no-opportunities">
              <div
                className="no-opportunities-icon"
                aria-hidden="true"
              >
                ⌕
              </div>

              <h3>No opportunities found</h3>

              <p>
                We couldn't find any collaboration opportunities
                matching your current search and filters.
              </p>

              <button type="button" onClick={clearFilters}>
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Application Modal */}

      {selectedOpportunity && (
        <div
          className="application-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeApplication()
            }
          }}
        >
          <section
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="application-modal-title"
          >
            <div className="application-modal-header">
              <div>
                <p className="application-modal-eyebrow">
                  APPLY TO OPPORTUNITY
                </p>

                <h2 id="application-modal-title">
                  {selectedOpportunity.title}
                </h2>

                <p>
                  {selectedOpportunity.roleRequired} •{' '}
                  {selectedOpportunity.location}
                </p>
              </div>

              <button
                className="application-modal-close"
                type="button"
                aria-label="Close application form"
                onClick={closeApplication}
              >
                ×
              </button>
            </div>

            {applicationSuccess ? (
              <div className="application-success">
                <div
                  className="application-success-icon"
                  aria-hidden="true"
                >
                  ✓
                </div>

                <h3>Application sent</h3>

                <p>
                  Your application for{' '}
                  <strong>
                    {selectedOpportunity.roleRequired}
                  </strong>{' '}
                  has been submitted successfully.
                </p>

                <button
                  type="button"
                  onClick={closeApplication}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                className="application-form"
                onSubmit={submitApplication}
              >
                <div className="application-opportunity-summary">
                  <span>
                    Applying to {selectedOpportunity.creator}
                  </span>

                  <strong>
                    {selectedOpportunity.roleRequired}
                  </strong>
                </div>

                <label htmlFor="cover-message">
                  Cover message
                </label>

                <textarea
                  id="cover-message"
                  rows={7}
                  maxLength={600}
                  placeholder="Introduce yourself, explain why you're interested and describe the relevant skills or experience you can bring to this collaboration."
                  value={coverMessage}
                  onChange={(event) => {
                    setCoverMessage(event.target.value)

                    if (applicationError) {
                      setApplicationError('')
                    }
                  }}
                />

                <div className="cover-message-meta">
                  <span>Minimum 30 characters</span>
                  <span>{coverMessage.length}/600</span>
                </div>

                {applicationError && (
                  <p
                    className="application-error"
                    role="alert"
                  >
                    {applicationError}
                  </p>
                )}

                <div className="application-modal-actions">
                  <button
                    className="cancel-application-button"
                    type="button"
                    onClick={closeApplication}
                  >
                    Cancel
                  </button>

                  <button
                    className="submit-application-button"
                    type="submit"
                  >
                    Send application
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* Post Opportunity Modal */}

      {showPostOpportunity && (
        <div
          className="post-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePostOpportunity()
            }
          }}
        >
          <section
            className="post-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
          >
            <div className="post-modal-header">
              <div>
                <p className="post-modal-eyebrow">
                  CREATE OPPORTUNITY
                </p>

                <h2 id="post-modal-title">
                  Post a Collaboration Opportunity
                </h2>

                <p>
                  Share your project and find creative professionals
                  with the skills you need.
                </p>
              </div>

              <button
                className="post-modal-close"
                type="button"
                aria-label="Close post opportunity form"
                onClick={closePostOpportunity}
              >
                ×
              </button>
            </div>

            {postOpportunitySuccess ? (
              <div className="post-success">
                <div
                  className="post-success-icon"
                  aria-hidden="true"
                >
                  ✓
                </div>

                <h3>Opportunity published</h3>

                <p>{postOpportunitySuccess}</p>

                <button
                  type="button"
                  onClick={closePostOpportunity}
                >
                  View opportunities
                </button>
              </div>
            ) : (
              <form
                className="post-opportunity-form"
                onSubmit={submitOpportunity}
              >
                <div className="post-form-field">
                  <label htmlFor="new-opportunity-title">
                    Opportunity title *
                  </label>

                  <input
                    id="new-opportunity-title"
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Animator needed for short film"
                    value={newTitle}
                    onChange={(event) => {
                      setNewTitle(event.target.value)

                      if (postOpportunityError) {
                        setPostOpportunityError('')
                      }
                    }}
                  />
                </div>

                <div className="post-form-grid">
                  <div className="post-form-field">
                    <label htmlFor="new-opportunity-role">
                      Role required *
                    </label>

                    <input
                      id="new-opportunity-role"
                      type="text"
                      placeholder="e.g. 3D Animator"
                      value={newRole}
                      onChange={(event) =>
                        setNewRole(event.target.value)
                      }
                    />
                  </div>

                  <div className="post-form-field">
                    <label htmlFor="new-opportunity-category">
                      Category *
                    </label>

                    <select
                      id="new-opportunity-category"
                      value={newCategory}
                      onChange={(event) =>
                        setNewCategory(event.target.value)
                      }
                    >
                      <option value="">Select category</option>
                      <option value="Design">Design</option>
                      <option value="Photography">
                        Photography
                      </option>
                      <option value="Music">Music</option>
                      <option value="Film & Video">
                        Film & Video
                      </option>
                      <option value="Digital Design">
                        Digital Design
                      </option>
                      <option value="Illustration">
                        Illustration
                      </option>
                      <option value="Animation">
                        Animation
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="post-form-field">
                    <label htmlFor="new-opportunity-location">
                      Location *
                    </label>

                    <input
                      id="new-opportunity-location"
                      type="text"
                      placeholder="e.g. Adelaide, SA or Remote"
                      value={newLocation}
                      onChange={(event) =>
                        setNewLocation(event.target.value)
                      }
                    />
                  </div>

                  <div className="post-form-field">
                    <label htmlFor="new-opportunity-closing">
                      Applications close *
                    </label>

                    <input
                      id="new-opportunity-closing"
                      type="date"
                      value={newClosingDate}
                      onChange={(event) =>
                        setNewClosingDate(event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="post-form-field">
                  <label htmlFor="new-opportunity-skills">
                    Required skills *
                  </label>

                  <input
                    id="new-opportunity-skills"
                    type="text"
                    placeholder="e.g. Blender, Animation, Storyboarding"
                    value={newSkills}
                    onChange={(event) =>
                      setNewSkills(event.target.value)
                    }
                  />

                  <span className="post-field-hint">
                    Separate multiple skills with commas.
                  </span>
                </div>

                <div className="post-form-field">
                  <label htmlFor="new-opportunity-description">
                    Description *
                  </label>

                  <textarea
                    id="new-opportunity-description"
                    rows={6}
                    maxLength={700}
                    placeholder="Describe the project, what you are looking for and what the collaborator will be working on."
                    value={newDescription}
                    onChange={(event) => {
                      setNewDescription(event.target.value)

                      if (postOpportunityError) {
                        setPostOpportunityError('')
                      }
                    }}
                  />

                  <div className="post-description-meta">
                    <span>Minimum 30 characters</span>
                    <span>{newDescription.length}/700</span>
                  </div>
                </div>

                {postOpportunityError && (
                  <p
                    className="post-opportunity-error"
                    role="alert"
                  >
                    {postOpportunityError}
                  </p>
                )}

                <div className="post-modal-actions">
                  <button
                    className="cancel-post-button"
                    type="button"
                    onClick={closePostOpportunity}
                  >
                    Cancel
                  </button>

                  <button
                    className="publish-opportunity-button"
                    type="submit"
                  >
                    Publish opportunity
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default Collaboration