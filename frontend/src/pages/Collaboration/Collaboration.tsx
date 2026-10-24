import { useEffect, useState } from 'react'
import './Collaboration.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'
import {
  applyToOpportunity,
  createOpportunity,
  deleteOpportunity,
  getCurrentUserId,
  getOpportunities,
  getOpportunity,
  getOpportunityApplications,
  updateOpportunity,
  type OpportunityApplicationResponse,
  type OpportunityResponse
} from '../../service/opportunityService'

type CollaborationProps = {
  initialOpportunityId?: number | null
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
}

type CollaborationOpportunity = {
  id: number
  title: string
  creator: string
  creatorId: number
  description: string
  roleRequired: string
  category: string
  location: string
  skills: string[]
  closingDate: string
  deadline: string
  status: 'OPEN' | 'CLOSED'
}

// ============================================
// BACKEND MAPPING
// The backend stores role, category and skills in the
// free-text `requirements` field, one "Label: value" per line.
// ============================================

function buildRequirements(role: string, category: string, skills: string[]): string {
  return `Role: ${role}\nCategory: ${category}\nSkills: ${skills.join(', ')}`
}

function parseRequirements(requirements: string | null) {
  const fields: Record<string, string> = {}
  const otherLines: string[] = []

  ;(requirements ?? '').split('\n').forEach((line) => {
    const match = line.match(/^\s*(role|category|skills)\s*:\s*(.*)$/i)
    if (match) fields[match[1].toLowerCase()] = match[2].trim()
    else if (line.trim()) otherLines.push(line.trim())
  })

  return {
    roleRequired: fields.role || otherLines.join(' ') || 'Open role',
    category: fields.category || 'Other',
    skills: (fields.skills ?? '')
      .split(',')
      .map((skill) => skill.trim())
      .filter((skill) => skill !== '')
  }
}

function isPastDeadline(deadline: string | null): boolean {
  if (!deadline) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${deadline}T00:00:00`) < today
}

function toCollaborationOpportunity(opportunity: OpportunityResponse): CollaborationOpportunity {
  const parsed = parseRequirements(opportunity.requirements)
  const deadline = opportunity.applicationDeadline ?? ''

  return {
    id: opportunity.id,
    title: opportunity.title,
    creator: opportunity.createdByUsername,
    creatorId: opportunity.createdById,
    description: opportunity.description,
    ...parsed,
    location: opportunity.location || 'Not specified',
    closingDate: deadline
      ? new Date(`${deadline}T00:00:00`).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : 'No deadline',
    deadline,
    status: isPastDeadline(opportunity.applicationDeadline) ? 'CLOSED' : 'OPEN'
  }
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function Collaboration({
  initialOpportunityId = null,
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick
}: CollaborationProps) {
  const [opportunities, setOpportunities] =
    useState<CollaborationOpportunity[]>([])
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(true)
  const [opportunitiesError, setOpportunitiesError] = useState('')
  const [linkedOpportunityError, setLinkedOpportunityError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLocation, setSelectedLocation] = useState('All')

  const [detailOpportunity, setDetailOpportunity] =
    useState<CollaborationOpportunity | null>(null)

  useEffect(() => {
    if (initialOpportunityId == null) return
    setLinkedOpportunityError('')
    let cancelled = false

    getOpportunity(initialOpportunityId)
      .then(opportunity => {
        if (!cancelled) {
          setDetailOpportunity(toCollaborationOpportunity(opportunity))
        }
      })
      .catch(error => {
        if (!cancelled) {
          setLinkedOpportunityError(errorText(error, 'This opportunity is no longer available.'))
        }
      })

    return () => { cancelled = true }
  }, [initialOpportunityId])

  useEffect(() => {
    if (!detailOpportunity) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDetailOpportunity(null)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [detailOpportunity])

  // Application state
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<CollaborationOpportunity | null>(null)

  const [coverMessage, setCoverMessage] = useState('')
  const [applicationError, setApplicationError] = useState('')
  const [applicationSuccess, setApplicationSuccess] = useState('')
  const [applicationSubmitting, setApplicationSubmitting] = useState(false)
  // The backend has no "my applications" endpoint, so this tracks
  // applications made (or rejected as duplicates) in this session.
  const [appliedOpportunityIds, setAppliedOpportunityIds] =
    useState<number[]>([])

  // Post / edit opportunity state
  const [showPostOpportunity, setShowPostOpportunity] = useState(false)
  const [editingOpportunityId, setEditingOpportunityId] =
    useState<number | null>(null)

  const [newTitle, setNewTitle] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newSkills, setNewSkills] = useState('')
  const [newClosingDate, setNewClosingDate] = useState('')

  const [postOpportunityError, setPostOpportunityError] = useState('')
  const [postOpportunitySuccess, setPostOpportunitySuccess] = useState('')
  const [postSubmitting, setPostSubmitting] = useState(false)

  // Manage (owner) state
  const [managedOpportunity, setManagedOpportunity] =
    useState<CollaborationOpportunity | null>(null)
  const [applications, setApplications] =
    useState<OpportunityApplicationResponse[] | null>(null)
  const [manageError, setManageError] = useState('')
  const [manageBusy, setManageBusy] = useState(false)

  // Load opportunities from the backend
  useEffect(() => {
    let cancelled = false

    getOpportunities()
      .then((list) => {
        if (cancelled) return
        setOpportunities(list.map(toCollaborationOpportunity))
        setOpportunitiesError('')
      })
      .catch((error) => {
        if (cancelled) return
        setOpportunities([])
        setOpportunitiesError(errorText(error, 'Unable to load opportunities.'))
      })
      .finally(() => {
        if (!cancelled) setOpportunitiesLoading(false)
      })

    return () => { cancelled = true }
  }, [reloadKey])

  useEffect(() => {
    let cancelled = false

    getCurrentUserId()
      .then((userId) => {
        if (!cancelled) setCurrentUserId(userId)
      })
      .catch((error) => console.warn('Current user unavailable:', error))

    return () => { cancelled = true }
  }, [])

  const reloadOpportunities = () => {
    setOpportunitiesLoading(true)
    setReloadKey((key) => key + 1)
  }

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

  const submitApplication = async (
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

    const opportunityId = selectedOpportunity.id
    setApplicationSubmitting(true)

    try {
      await applyToOpportunity(opportunityId, { message: trimmedMessage })

      setAppliedOpportunityIds((currentIds) => [
        ...currentIds,
        opportunityId
      ])

      setApplicationError('')
      setApplicationSuccess('Application submitted successfully.')
    } catch (error) {
      const message = errorText(error, 'Unable to submit your application.')

      if (/already applied/i.test(message)) {
        setAppliedOpportunityIds((currentIds) => [
          ...currentIds,
          opportunityId
        ])
      }

      setApplicationError(message)
    } finally {
      setApplicationSubmitting(false)
    }
  }

  // Post / edit opportunity functions
  const openPostOpportunity = () => {
    resetPostOpportunityForm()
    setEditingOpportunityId(null)
    setShowPostOpportunity(true)
    setPostOpportunitySuccess('')
  }

  const openEditOpportunity = (opportunity: CollaborationOpportunity) => {
    setEditingOpportunityId(opportunity.id)
    setNewTitle(opportunity.title)
    setNewRole(opportunity.roleRequired)
    setNewCategory(opportunity.category)
    setNewLocation(opportunity.location === 'Not specified' ? '' : opportunity.location)
    setNewDescription(opportunity.description)
    setNewSkills(opportunity.skills.join(', '))
    setNewClosingDate(opportunity.deadline)
    setPostOpportunityError('')
    setPostOpportunitySuccess('')
    closeManage()
    setShowPostOpportunity(true)
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
    setEditingOpportunityId(null)
    resetPostOpportunityForm()
    setPostOpportunitySuccess('')
  }

  const submitOpportunity = async (
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

    const request = {
      title,
      description,
      requirements: buildRequirements(role, category, skills),
      location,
      applicationDeadline: newClosingDate
    }

    setPostSubmitting(true)

    try {
      if (editingOpportunityId === null) {
        await createOpportunity(request)
      } else {
        await updateOpportunity(editingOpportunityId, request)
      }

      setPostOpportunityError('')
      setPostOpportunitySuccess(
        editingOpportunityId === null
          ? 'Your collaboration opportunity has been published successfully.'
          : 'Your collaboration opportunity has been updated successfully.'
      )
      reloadOpportunities()
    } catch (error) {
      setPostOpportunityError(
        errorText(error, 'Unable to save this opportunity.')
      )
    } finally {
      setPostSubmitting(false)
    }
  }

  // Manage (owner) functions
  const openManage = async (opportunity: CollaborationOpportunity) => {
    setManagedOpportunity(opportunity)
    setApplications(null)
    setManageError('')
    setManageBusy(true)

    try {
      const [fresh, received] = await Promise.all([
        getOpportunity(opportunity.id),
        getOpportunityApplications(opportunity.id)
      ])
      setManagedOpportunity(toCollaborationOpportunity(fresh))
      setApplications(received)
    } catch (error) {
      setManageError(errorText(error, 'Unable to load applications.'))
    } finally {
      setManageBusy(false)
    }
  }

  const closeManage = () => {
    setManagedOpportunity(null)
    setApplications(null)
    setManageError('')
  }

  const removeOpportunity = async (opportunity: CollaborationOpportunity) => {
    if (!window.confirm(`Delete "${opportunity.title}"? Its applications will be deleted too.`)) {
      return
    }

    setManageBusy(true)
    setManageError('')

    try {
      await deleteOpportunity(opportunity.id)
      setOpportunities((current) =>
        current.filter((item) => item.id !== opportunity.id)
      )
      closeManage()
    } catch (error) {
      setManageError(errorText(error, 'Unable to delete this opportunity.'))
    } finally {
      setManageBusy(false)
    }
  }

  return (
    <div className="collaboration-screen">
      {linkedOpportunityError && <p role="alert" className="opportunities-error">{linkedOpportunityError}</p>}
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

          {opportunitiesError ? (
            <div className="no-opportunities">
              <div
                className="no-opportunities-icon"
                aria-hidden="true"
              >
                !
              </div>

              <h3>Couldn't load opportunities</h3>

              <p>{opportunitiesError}</p>

              <button type="button" onClick={reloadOpportunities}>
                Try again
              </button>
            </div>
          ) : opportunitiesLoading ? (
            <div className="no-opportunities">
              <h3>Loading opportunities…</h3>
            </div>
          ) : filteredOpportunities.length > 0 ? (
            <div className="opportunities-grid">
              {filteredOpportunities.map((opportunity) => {
                const hasApplied =
                  appliedOpportunityIds.includes(opportunity.id)
                const isOwner = opportunity.creatorId === currentUserId

                return (
                  <article
                    className="opportunity-card"
                    key={opportunity.id}
                  >
                    <div className="opportunity-card-top">
                      <span className="opportunity-category">
                        {opportunity.category}
                      </span>

                      <span
                        className={`opportunity-status ${
                          opportunity.status === 'CLOSED' ? 'closed' : ''
                        }`}
                      >
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

                    {opportunity.skills.length > 0 && (
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
                    )}

                    <div className="opportunity-footer">
                      <div className="closing-date">
                        <span>Applications close</span>
                        <strong>{opportunity.closingDate}</strong>
                      </div>

                      {isOwner ? (
                        <button
                          className="apply-button manage-button"
                          type="button"
                          onClick={() => openManage(opportunity)}
                        >
                          Manage
                        </button>
                      ) : (
                        <button
                          className={`apply-button ${
                            hasApplied ? 'applied' : ''
                          }`}
                          type="button"
                          disabled={hasApplied || opportunity.status === 'CLOSED'}
                          onClick={() => openApplication(opportunity)}
                        >
                          {hasApplied
                            ? 'Applied ✓'
                            : opportunity.status === 'CLOSED'
                              ? 'Closed'
                              : 'Apply'}
                        </button>
                      )}
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

      {/* Details for the specific opportunity selected on the Dashboard. */}
      {detailOpportunity && (
        <div
          className="application-modal-backdrop"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setDetailOpportunity(null)
          }}
        >
          <section
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="opportunity-detail-title"
          >
            <div className="application-modal-header">
              <div>
                <p className="application-modal-eyebrow">COLLABORATION OPPORTUNITY</p>
                <h2 id="opportunity-detail-title">{detailOpportunity.title}</h2>
                <p>{detailOpportunity.creator} • {detailOpportunity.location}</p>
              </div>
              <button
                type="button"
                autoFocus
                className="application-modal-close"
                aria-label="Close opportunity details"
                onClick={() => setDetailOpportunity(null)}
              >×</button>
            </div>
            <div style={{ padding: '0 24px 24px', overflowWrap: 'anywhere' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{detailOpportunity.description}</p>
              <p><strong>Role:</strong> {detailOpportunity.roleRequired}</p>
              <p><strong>Category:</strong> {detailOpportunity.category}</p>
              <p><strong>Skills:</strong> {detailOpportunity.skills.join(', ') || 'Not specified'}</p>
              <p><strong>Closing date:</strong> {detailOpportunity.closingDate}</p>
              <p><strong>Status:</strong> {detailOpportunity.status}</p>
              <button
                type="button"
                className="apply-button"
                disabled={currentUserId === null || (
                  detailOpportunity.creatorId !== currentUserId && (
                    detailOpportunity.status === 'CLOSED' ||
                    appliedOpportunityIds.includes(detailOpportunity.id)
                  )
                )}
                onClick={() => {
                  const opportunity = detailOpportunity
                  setDetailOpportunity(null)
                  if (opportunity.creatorId === currentUserId) {
                    void openManage(opportunity)
                  } else {
                    openApplication(opportunity)
                  }
                }}
              >
                {currentUserId === null ? 'Loading account…'
                  : detailOpportunity.creatorId === currentUserId ? 'Manage'
                  : appliedOpportunityIds.includes(detailOpportunity.id) ? 'Applied ✓'
                  : detailOpportunity.status === 'CLOSED' ? 'Closed' : 'Apply'}
              </button>
            </div>
          </section>
        </div>
      )}

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
                    disabled={applicationSubmitting}
                  >
                    {applicationSubmitting ? 'Sending…' : 'Send application'}
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
                  {editingOpportunityId === null
                    ? 'CREATE OPPORTUNITY'
                    : 'EDIT OPPORTUNITY'}
                </p>

                <h2 id="post-modal-title">
                  {editingOpportunityId === null
                    ? 'Post a Collaboration Opportunity'
                    : 'Update Your Opportunity'}
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

                <h3>
                  {editingOpportunityId === null
                    ? 'Opportunity published'
                    : 'Opportunity updated'}
                </h3>

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
                      {newCategory &&
                        ![
                          'Design',
                          'Photography',
                          'Music',
                          'Film & Video',
                          'Digital Design',
                          'Illustration',
                          'Animation',
                          'Other'
                        ].includes(newCategory) && (
                          <option value={newCategory}>{newCategory}</option>
                        )}
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
                    disabled={postSubmitting}
                  >
                    {postSubmitting
                      ? 'Saving…'
                      : editingOpportunityId === null
                        ? 'Publish opportunity'
                        : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* Manage Opportunity Modal (owner) */}

      {managedOpportunity && (
        <div
          className="application-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeManage()
            }
          }}
        >
          <section
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-modal-title"
          >
            <div className="application-modal-header">
              <div>
                <p className="application-modal-eyebrow">
                  MANAGE OPPORTUNITY
                </p>

                <h2 id="manage-modal-title">
                  {managedOpportunity.title}
                </h2>

                <p>
                  {managedOpportunity.roleRequired} •{' '}
                  {managedOpportunity.location} • Closes{' '}
                  {managedOpportunity.closingDate}
                </p>
              </div>

              <button
                className="application-modal-close"
                type="button"
                aria-label="Close manage opportunity"
                onClick={closeManage}
              >
                ×
              </button>
            </div>

            <div className="manage-applications">
              <h3>
                Applications
                {applications ? ` (${applications.length})` : ''}
              </h3>

              {manageError && (
                <p className="application-error" role="alert">
                  {manageError}
                </p>
              )}

              {applications === null ? (
                !manageError && <p className="manage-empty">Loading applications…</p>
              ) : applications.length === 0 ? (
                <p className="manage-empty">No applications yet.</p>
              ) : (
                <ul>
                  {applications.map((application) => (
                    <li key={application.applicationId}>
                      <div className="manage-application-top">
                        <strong>@{application.applicantUsername}</strong>
                        <span className="manage-application-status">
                          {application.status}
                        </span>
                      </div>

                      {application.message && (
                        <p>{application.message}</p>
                      )}

                      <small>
                        Applied{' '}
                        {new Date(application.appliedAt).toLocaleDateString(
                          'en-AU',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="application-modal-actions">
              <button
                className="cancel-application-button delete-opportunity-button"
                type="button"
                disabled={manageBusy}
                onClick={() => removeOpportunity(managedOpportunity)}
              >
                Delete
              </button>

              <button
                className="submit-application-button"
                type="button"
                disabled={manageBusy}
                onClick={() => openEditOpportunity(managedOpportunity)}
              >
                Edit opportunity
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default Collaboration
