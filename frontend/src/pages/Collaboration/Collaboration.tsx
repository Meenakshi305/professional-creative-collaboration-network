
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { getCurrentUser } from '../../service/authService'
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  applyToOpportunity,
  getOpportunityApplications,
  getMyApplications,
  updateApplicationStatus
} from '../../service/collaborationService'
import type {
  Opportunity,
  OpportunityInput,
  OpportunityApplication
} from '../../service/collaborationService'
import './Collaboration.css'

type CollaborationProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
}

type Tab = 'browse' | 'mine' | 'applications'

const emptyForm: OpportunityInput = {
  title: '',
  description: '',
  requirements: '',
  location: '',
  applicationDeadline: ''
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

function formatDate(value: string | null): string {
  if (!value) return 'Not specified'

  const date = new Date(`${value.slice(0, 10)}T12:00:00`)

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
}

function isExpired(value: string | null): boolean {
  if (!value) return false

  const today = new Date()
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')

  return value.slice(0, 10) < localToday
}

function Collaboration(_props: CollaborationProps) {
  const [tab, setTab] = useState<Tab>('browse')
  const [userId, setUserId] = useState<number | null>(null)

  const [opportunities, setOpportunities] =
    useState<Opportunity[]>([])

  const [myApplications, setMyApplications] =
    useState<OpportunityApplication[]>([])

  const [selectedApplicants, setSelectedApplicants] =
    useState<OpportunityApplication[]>([])

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('All')

  const [loading, setLoading] = useState(true)
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [showPostOpportunity, setShowPostOpportunity] =
    useState(false)

  const [editingOpportunity, setEditingOpportunity] =
    useState<Opportunity | null>(null)

  const [form, setForm] =
    useState<OpportunityInput>({ ...emptyForm })

  const [applyingTo, setApplyingTo] =
    useState<Opportunity | null>(null)

  const [coverMessage, setCoverMessage] = useState('')
  const [viewingApplicants, setViewingApplicants] = useState(false)

  const refresh = useCallback(async () => {
    const [opportunityData, applicationData] = await Promise.all([
      getOpportunities(),
      getMyApplications()
    ])

    setOpportunities(opportunityData)
    setMyApplications(applicationData)
  }, [])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const user = await getCurrentUser()
        if (!active) return

        setUserId(user.userId)

        const [opportunityData, applicationData] = await Promise.all([
          getOpportunities(),
          getMyApplications()
        ])

        if (!active) return

        setOpportunities(opportunityData)
        setMyApplications(applicationData)
      } catch (err) {
        if (active) setError(errorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  const myOpportunities = useMemo(
    () =>
      opportunities.filter(
        opportunity => opportunity.createdById === userId
      ),
    [opportunities, userId]
  )

  const locations = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(
          opportunities
            .map(opportunity => opportunity.location)
            .filter(
              (value): value is string => Boolean(value)
            )
        )
      )
    ],
    [opportunities]
  )

  const filteredOpportunities = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    return opportunities.filter(opportunity => {
      const matchesSearch =
        !search ||
        [
          opportunity.title,
          opportunity.description,
          opportunity.requirements ?? '',
          opportunity.createdByUsername
        ].some(value =>
          value.toLowerCase().includes(search)
        )

      const matchesLocation =
        locationFilter === 'All' ||
        opportunity.location === locationFilter

      return matchesSearch && matchesLocation
    })
  }, [opportunities, searchTerm, locationFilter])

  const appliedIds = useMemo(
    () =>
      new Set(
        myApplications.map(item => item.opportunityId)
      ),
    [myApplications]
  )

  const opportunityById = useMemo(
    () =>
      new Map(
        opportunities.map(item => [item.id, item])
      ),
    [opportunities]
  )

  function clearMessages() {
    setError('')
    setNotice('')
  }

  function changeTab(nextTab: Tab) {
    clearMessages()
    setTab(nextTab)
  }

  function openCreate() {
    clearMessages()
    setEditingOpportunity(null)
    setForm({ ...emptyForm })
    setShowPostOpportunity(true)
  }

  function openEdit(opportunity: Opportunity) {
    clearMessages()
    setEditingOpportunity(opportunity)

    setForm({
      title: opportunity.title,
      description: opportunity.description,
      requirements: opportunity.requirements ?? '',
      location: opportunity.location ?? '',
      applicationDeadline:
        opportunity.applicationDeadline?.slice(0, 10) ?? ''
    })

    setShowPostOpportunity(true)
  }

  function closePost() {
    if (busy) return
    setShowPostOpportunity(false)
    setEditingOpportunity(null)
    setForm({ ...emptyForm })
    setError('')
  }

  async function submitOpportunity(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    clearMessages()

    if (form.title.trim().length < 5) {
      setError('Title must contain at least 5 characters.')
      return
    }

    if (form.description.trim().length < 30) {
      setError('Description must contain at least 30 characters.')
      return
    }

    if (
      form.applicationDeadline &&
      isExpired(form.applicationDeadline)
    ) {
      setError('Application deadline cannot be in the past.')
      return
    }

    setBusy(true)

    try {
      const payload: OpportunityInput = {
        title: form.title.trim(),
        description: form.description.trim(),
        requirements: form.requirements.trim(),
        location: form.location.trim(),
        applicationDeadline: form.applicationDeadline
      }

      if (editingOpportunity) {
        await updateOpportunity(editingOpportunity.id, payload)
        setNotice('Opportunity updated successfully.')
      } else {
        await createOpportunity(payload)
        setNotice('Opportunity published successfully.')
      }

      await refresh()
      setShowPostOpportunity(false)
      setEditingOpportunity(null)
      setForm({ ...emptyForm })
      setTab('mine')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function removeOpportunity(
    opportunity: Opportunity
  ) {
    const confirmed = window.confirm(
      `Delete "${opportunity.title}"? Its applications will also be deleted.`
    )

    if (!confirmed) return

    clearMessages()
    setBusy(true)

    try {
      await deleteOpportunity(opportunity.id)
      await refresh()
      setNotice('Opportunity deleted successfully.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function openApplication(opportunity: Opportunity) {
    clearMessages()
    setApplyingTo(opportunity)
    setCoverMessage('')
  }

  async function submitApplication(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    if (!applyingTo) return

    clearMessages()

    if (coverMessage.trim().length < 30) {
      setError(
        'Cover message must contain at least 30 characters.'
      )
      return
    }

    setBusy(true)

    try {
      await applyToOpportunity(
        applyingTo.id,
        coverMessage.trim()
      )

      await refresh()
      setApplyingTo(null)
      setCoverMessage('')
      setNotice('Application submitted successfully.')
      setTab('applications')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function openApplicants(
    opportunity: Opportunity
  ) {
    clearMessages()
    setSelectedOpportunity(opportunity)
    setSelectedApplicants([])
    setViewingApplicants(true)
    setApplicantsLoading(true)

    try {
      const applications =
        await getOpportunityApplications(opportunity.id)

      setSelectedApplicants(applications)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setApplicantsLoading(false)
    }
  }

  function closeApplicants() {
    if (busy) return
    setViewingApplicants(false)
    setSelectedOpportunity(null)
    setSelectedApplicants([])
    setError('')
  }

  async function changeApplicationStatus(
    applicationId: number,
    status: 'ACCEPTED' | 'REJECTED'
  ) {
    clearMessages()
    setBusy(true)

    try {
      const updated = await updateApplicationStatus(
        applicationId,
        status
      )

      setSelectedApplicants(current =>
        current.map(application =>
          application.applicationId === applicationId
            ? updated
            : application
        )
      )

      await refresh()

      setNotice(
        `Application ${status.toLowerCase()} successfully.`
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function renderOpportunity(
    opportunity: Opportunity,
    ownerView: boolean
  ) {
    const owned = opportunity.createdById === userId
    const applied = appliedIds.has(opportunity.id)
    const expired = isExpired(
      opportunity.applicationDeadline
    )

    return (
      <article
        className="opportunity-card"
        key={opportunity.id}
      >
        <div className="opportunity-card-top">
          <span className="opportunity-category">
            Collaboration
          </span>

          <span
            className={`opportunity-status ${
              expired ? 'closed' : ''
            }`}
          >
            {expired ? 'CLOSED' : 'OPEN'}
          </span>
        </div>

        <h3>{opportunity.title}</h3>

        <p className="opportunity-creator">
          Posted by {opportunity.createdByUsername}
        </p>

        <p className="opportunity-description">
          {opportunity.description}
        </p>

        <div className="opportunity-details">
          <div className="opportunity-detail">
            <span className="detail-label">
              Location
            </span>
            <strong>
              {opportunity.location || 'Not specified'}
            </strong>
          </div>
        </div>

        {opportunity.requirements && (
          <div className="opportunity-skills">
            <span className="detail-label">
              Requirements
            </span>
            <p>{opportunity.requirements}</p>
          </div>
        )}

        <div className="opportunity-footer">
          <div className="closing-date">
            <span>Applications close</span>
            <strong>
              {formatDate(opportunity.applicationDeadline)}
            </strong>
          </div>

          {ownerView ? (
            <div className="opportunity-actions">
              <button
                className="apply-button"
                type="button"
                disabled={busy}
                onClick={() =>
                  void openApplicants(opportunity)
                }
              >
                View Applicants
              </button>

              <button
                className="apply-button"
                type="button"
                disabled={busy}
                onClick={() => openEdit(opportunity)}
              >
                Edit
              </button>

              <button
                className="apply-button delete-action"
                type="button"
                disabled={busy}
                onClick={() =>
                  void removeOpportunity(opportunity)
                }
              >
                Delete
              </button>
            </div>
          ) : (
            <button
              className={`apply-button ${
                applied ? 'applied' : ''
              }`}
              type="button"
              disabled={
                owned || applied || expired || busy ||
                userId === null
              }
              onClick={() =>
                openApplication(opportunity)
              }
            >
              {owned
                ? 'Your Opportunity'
                : applied
                  ? 'Applied ✓'
                  : expired
                    ? 'Closed'
                    : 'Apply'}
            </button>
          )}
        </div>
      </article>
    )
  }

  return (
    <div className="collaboration-screen">
      <main className="collaboration-page">
        <section className="collaboration-hero">
          <div className="collaboration-hero-content">
            <p className="collaboration-eyebrow">
              CREATIVE COLLABORATION
            </p>

            <h1>
              Find Your Next Creative Collaboration
            </h1>

            <p className="collaboration-description">
              Discover opportunities, collaborate with
              creative professionals, and manage your
              applications.
            </p>
          </div>

          <button
            className="post-opportunity-button"
            type="button"
            onClick={openCreate}
          >
            + Post an Opportunity
          </button>
        </section>

        <div
          className="collaboration-tabs"
          role="group"
          aria-label="Collaboration views"
        >
          <button
            className={`collaboration-tab ${
              tab === 'browse' ? 'is-active' : ''
            }`}
            type="button"
            aria-pressed={tab === 'browse'}
            onClick={() => changeTab('browse')}
          >
            Browse Opportunities
          </button>

          <button
            className={`collaboration-tab ${
              tab === 'mine' ? 'is-active' : ''
            }`}
            type="button"
            aria-pressed={tab === 'mine'}
            onClick={() => changeTab('mine')}
          >
            My Opportunities ({myOpportunities.length})
          </button>

          <button
            className={`collaboration-tab ${
              tab === 'applications' ? 'is-active' : ''
            }`}
            type="button"
            aria-pressed={tab === 'applications'}
            onClick={() => changeTab('applications')}
          >
            My Applications ({myApplications.length})
          </button>
        </div>

        {error && (
          <p className="application-error" role="alert">
            {error}
          </p>
        )}

        {notice && (
          <p className="application-success" role="status">
            {notice}
          </p>
        )}

        {loading ? (
          <div className="no-opportunities">
            <p>Loading collaboration opportunities...</p>
          </div>
        ) : (
          <>
            {tab === 'browse' && (
              <>
                <section className="collaboration-filters">
                  <div className="collaboration-search">
                    <label htmlFor="collaboration-search">
                      Search opportunities
                    </label>

                    <div className="search-input-wrapper">
                      <input
                        id="collaboration-search"
                        type="search"
                        placeholder="Search projects, requirements or creators..."
                        value={searchTerm}
                        onChange={event =>
                          setSearchTerm(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="filter-control">
                    <label htmlFor="location-filter">
                      Location
                    </label>

                    <select
                      id="location-filter"
                      value={locationFilter}
                      onChange={event =>
                        setLocationFilter(event.target.value)
                      }
                    >
                      {locations.map(location => (
                        <option
                          key={location}
                          value={location}
                        >
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="clear-filters-button"
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      setLocationFilter('All')
                    }}
                  >
                    Clear filters
                  </button>
                </section>

                <section className="opportunities-section">
                  <div className="opportunities-heading">
                    <div>
                      <h2>
                        Collaboration Opportunities
                      </h2>
                      <p>
                        Explore projects posted by
                        creative professionals.
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
                      {filteredOpportunities.map(
                        opportunity =>
                          renderOpportunity(
                            opportunity,
                            false
                          )
                      )}
                    </div>
                  ) : (
                    <div className="no-opportunities">
                      <h3>No opportunities found</h3>
                      <p>
                        Try changing your search or filters.
                      </p>
                    </div>
                  )}
                </section>
              </>
            )}

            {tab === 'mine' && (
              <section className="opportunities-section">
                <div className="opportunities-heading">
                  <div>
                    <h2>My Opportunities</h2>
                    <p>
                      Manage your posts and review applicants.
                    </p>
                  </div>
                </div>

                {myOpportunities.length > 0 ? (
                  <div className="opportunities-grid">
                    {myOpportunities.map(opportunity =>
                      renderOpportunity(
                        opportunity,
                        true
                      )
                    )}
                  </div>
                ) : (
                  <div className="no-opportunities">
                    <h3>
                      You haven't posted any opportunities yet
                    </h3>

                    <button
                      type="button"
                      onClick={openCreate}
                    >
                      Post an Opportunity
                    </button>
                  </div>
                )}
              </section>
            )}

            {tab === 'applications' && (
              <section className="opportunities-section">
                <div className="opportunities-heading">
                  <div>
                    <h2>My Applications</h2>
                    <p>
                      Track applications you've submitted.
                    </p>
                  </div>
                </div>

                {myApplications.length > 0 ? (
                  <div className="opportunities-grid">
                    {myApplications.map(application => {
                      const opportunity =
                        opportunityById.get(
                          application.opportunityId
                        )

                      return (
                        <article
                          className="opportunity-card"
                          key={application.applicationId}
                        >
                          <div className="opportunity-card-top">
                            <span className="opportunity-category">
                              Application
                            </span>

                            <span className="opportunity-status">
                              {application.status}
                            </span>
                          </div>

                          <h3>
                            {opportunity?.title ??
                              `Opportunity #${application.opportunityId}`}
                          </h3>

                          <p className="opportunity-creator">
                            {opportunity?.createdByUsername ??
                              'Opportunity creator'}
                          </p>

                          <p className="opportunity-description">
                            {application.message ||
                              'No cover message'}
                          </p>

                          <p className="closing-date">
                            Applied:{' '}
                            {formatDate(application.appliedAt)}
                          </p>
                        </article>
                      )
                    })}
                  </div>
                ) : (
                  <div className="no-opportunities">
                    <h3>No applications yet</h3>

                    <p>
                      Browse opportunities and apply
                      to projects that interest you.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        changeTab('browse')
                      }
                    >
                      Browse Opportunities
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {showPostOpportunity && (
        <div className="post-modal-backdrop">
          <section
            className="post-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-modal-title"
          >
            <div className="post-modal-header">
              <div>
                <p className="post-modal-eyebrow">
                  {editingOpportunity
                    ? 'EDIT OPPORTUNITY'
                    : 'CREATE OPPORTUNITY'}
                </p>

                <h2 id="post-modal-title">
                  {editingOpportunity
                    ? 'Edit Collaboration Opportunity'
                    : 'Post a Collaboration Opportunity'}
                </h2>
              </div>

              <button
                className="post-modal-close"
                type="button"
                onClick={closePost}
                disabled={busy}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form
              className="post-opportunity-form"
              onSubmit={event =>
                void submitOpportunity(event)
              }
            >
              <div className="post-form-field">
                <label htmlFor="opportunity-title">
                  Title *
                </label>

                <input
                  id="opportunity-title"
                  value={form.title}
                  required
                  minLength={5}
                  maxLength={100}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      title: event.target.value
                    }))
                  }
                />
              </div>

              <div className="post-form-field">
                <label htmlFor="opportunity-description">
                  Description *
                </label>

                <textarea
                  id="opportunity-description"
                  rows={6}
                  required
                  minLength={30}
                  value={form.description}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                />
              </div>

              <div className="post-form-field">
                <label htmlFor="opportunity-requirements">
                  Requirements / Skills
                </label>

                <textarea
                  id="opportunity-requirements"
                  rows={3}
                  value={form.requirements}
                  placeholder="Describe the role and required skills"
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      requirements: event.target.value
                    }))
                  }
                />
              </div>

              <div className="post-form-grid">
                <div className="post-form-field">
                  <label htmlFor="opportunity-location">
                    Location
                  </label>

                  <input
                    id="opportunity-location"
                    value={form.location}
                    placeholder="Adelaide, SA or Remote"
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        location: event.target.value
                      }))
                    }
                  />
                </div>

                <div className="post-form-field">
                  <label htmlFor="opportunity-deadline">
                    Application deadline
                  </label>

                  <input
                    id="opportunity-deadline"
                    type="date"
                    value={form.applicationDeadline}
                    onChange={event =>
                      setForm(current => ({
                        ...current,
                        applicationDeadline:
                          event.target.value
                      }))
                    }
                  />
                </div>
              </div>

              {error && (
                <p
                  className="post-opportunity-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="post-modal-actions">
                <button
                  className="cancel-post-button"
                  type="button"
                  onClick={closePost}
                  disabled={busy}
                >
                  Cancel
                </button>

                <button
                  className="publish-opportunity-button"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? 'Saving...'
                    : editingOpportunity
                      ? 'Save Changes'
                      : 'Publish Opportunity'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {applyingTo && (
        <div className="application-modal-backdrop">
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
                  {applyingTo.title}
                </h2>

                <p>
                  Posted by {applyingTo.createdByUsername}
                </p>
              </div>

              <button
                className="application-modal-close"
                type="button"
                disabled={busy}
                onClick={() => {
                  setApplyingTo(null)
                  setError('')
                }}
                aria-label="Close application form"
              >
                ×
              </button>
            </div>

            <form
              className="application-form"
              onSubmit={event =>
                void submitApplication(event)
              }
            >
              <label htmlFor="cover-message">
                Cover message *
              </label>

              <textarea
                id="cover-message"
                rows={7}
                minLength={30}
                maxLength={600}
                required
                value={coverMessage}
                onChange={event =>
                  setCoverMessage(event.target.value)
                }
                placeholder="Introduce yourself and explain why you are interested..."
              />

              <div className="cover-message-meta">
                <span>Minimum 30 characters</span>
                <span>{coverMessage.length}/600</span>
              </div>

              {error && (
                <p
                  className="application-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div className="application-modal-actions">
                <button
                  className="cancel-application-button"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setApplyingTo(null)
                    setError('')
                  }}
                >
                  Cancel
                </button>

                <button
                  className="submit-application-button"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? 'Submitting...'
                    : 'Send Application'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {viewingApplicants && selectedOpportunity && (
        <div className="application-modal-backdrop">
          <section
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicants-modal-title"
          >
            <div className="application-modal-header">
              <div>
                <p className="application-modal-eyebrow">
                  OPPORTUNITY APPLICATIONS
                </p>

                <h2 id="applicants-modal-title">
                  {selectedOpportunity.title}
                </h2>
              </div>

              <button
                className="application-modal-close"
                type="button"
                disabled={busy}
                onClick={closeApplicants}
                aria-label="Close applicants"
              >
                ×
              </button>
            </div>

            {error && (
              <p
                className="application-error"
                role="alert"
              >
                {error}
              </p>
            )}

            {notice && (
              <p
                className="application-success"
                role="status"
              >
                {notice}
              </p>
            )}

            {applicantsLoading && (
              <p>Loading applicants...</p>
            )}

            {!applicantsLoading &&
              selectedApplicants.length === 0 &&
              !error && (
                <p>No applications received yet.</p>
              )}

            <div className="applicants-list">
              {!applicantsLoading &&
                selectedApplicants.map(application => (
                  <article
                    className="applicant-item"
                    key={application.applicationId}
                  >
                    <h3>
                      {application.applicantUsername}
                    </h3>

                    <p>
                      Status:{' '}
                      <strong>
                        {application.status}
                      </strong>
                    </p>

                    <p>
                      {application.message ||
                        'No cover message'}
                    </p>

                    <p>
                      Applied:{' '}
                      {formatDate(application.appliedAt)}
                    </p>

                    {application.status === 'PENDING' && (
                      <div className="applicant-actions">
                        <button
                          className="submit-application-button"
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void changeApplicationStatus(
                              application.applicationId,
                              'ACCEPTED'
                            )
                          }
                        >
                          Accept
                        </button>

                        <button
                          className="cancel-application-button"
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void changeApplicationStatus(
                              application.applicationId,
                              'REJECTED'
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default Collaboration
