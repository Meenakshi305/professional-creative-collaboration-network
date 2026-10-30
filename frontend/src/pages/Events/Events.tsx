import {
  useEffect,
  useRef,
  useState,
  type FormEvent
} from 'react'

import './Events.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'

import {
  cancelRegistration,
  createEvent,
  uploadEventImage,
  deleteEvent,
  getCurrentUserId,
  getEvent,
  getEventImageBlob,
  getEventRegistrations,
  getEvents,
  getMyRegistrations,
  getRegistration,
  publishEvent,
  registerForEvent,
  updateEvent,
  type CreateEventRequest,
  type EventRegistrationResponse,
  type EventResponse,
  type EventType
} from '../../service/eventService'

// ============================================
// TYPES
// ============================================

type EventsProps = {
  initialEventId?: number | null
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
}

type EventFilter = 'all' | 'in-person' | 'online' | 'hosting'

type EventFormState = {
  title: string
  description: string
  category: string
  city: string
  venue: string
  startDateTime: string
  endDateTime: string
  eventType: EventType
  capacity: string
  price: string
  publishNow: boolean
}

type EventImageProps = {
  event: EventResponse
  className: string
}

// ============================================
// DEFAULTS
// ============================================

const emptyForm: EventFormState = {
  title: '',
  description: '',
  category: '',
  city: '',
  venue: '',
  startDateTime: '',
  endDateTime: '',
  eventType: 'FREE',
  capacity: '',
  price: '',
  publishNow: true
}

const categoryIcons: Record<string, string> = {
  networking: '🤝',
  workshop: '🎨',
  art: '🎨',
  photography: '📷',
  music: '🎵',
  exhibition: '🖼️',
  career: '💼',
  film: '🎬',
  design: '✏️',
  writing: '✍️',
  dance: '💃'
}

const fallbackImages: Record<string, string> = {
  networking: 'networking.jpg',
  workshop: 'workshop.jpg',
  art: 'art.jpg',
  photography: 'photography.jpg',
  music: 'music.jpg',
  exhibition: 'exhibition.jpg',
  career: 'career.jpg',
  film: 'film.jpg',
  design: 'design.jpg',
  writing: 'writing.jpg',
  dance: 'dance.jpg'
}

// ============================================
// DISPLAY HELPERS
// ============================================

function eventIcon(category: string): string {
  return categoryIcons[category.trim().toLowerCase()] ?? '📅'
}

function eventFallbackImage(category: string): string {
  const filename =
    fallbackImages[category.trim().toLowerCase()] ?? 'default.jpg'

  return `/event-images/${filename}`
}

function isOnline(event: EventResponse): boolean {
  return (
    /online/i.test(event.city) ||
    /online/i.test(event.venue ?? '')
  )
}

function eventLocation(event: EventResponse): string {
  if (isOnline(event)) return 'Online'

  return event.venue
    ? `${event.venue}, ${event.city}`
    : event.city
}

function eventPrice(event: EventResponse): number {
  return event.eventType === 'FREE'
    ? 0
    : Number(event.price) || 0
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function toInputDateTime(value: string): string {
  return value ? value.slice(0, 16) : ''
}

function toApiDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

function registrationLabel(
  registration: EventRegistrationResponse,
  demoPaid = false
): string {
  if (demoPaid) return '✓ Registered • Demo paid'

  return registration.status === 'PENDING'
    ? '⏳ Pending'
    : '✓ Registered'
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallback
}

// ============================================
// DATA HELPERS
// ============================================

async function fetchEvents(
  hosting: boolean
): Promise<EventResponse[]> {
  if (!hosting) {
    return getEvents({ status: 'PUBLISHED' })
  }

  const userId = await getCurrentUserId()
  const list = await getEvents()

  return list.filter((event) => event.createdBy === userId)
}

async function fetchActiveRegistrations() {
  const [userId, list] = await Promise.all([
    getCurrentUserId(),
    getMyRegistrations()
  ])

  const active: Record<number, EventRegistrationResponse> = {}

  list
    .filter((registration) => registration.status !== 'CANCELLED')
    .forEach((registration) => {
      active[registration.eventId] = registration
    })

  return { userId, active }
}

// ============================================
// AUTHENTICATED EVENT IMAGE
// ============================================

// Spring Boot retrieves the image from MEGA.
// The image is fetched with JWT, then displayed using a blob URL.
function EventImage({ event, className }: EventImageProps) {
  const fallback = eventFallbackImage(event.category)

  const [imageSrc, setImageSrc] = useState(fallback)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    let active = true
    let objectUrl: string | null = null

    setImageSrc(fallback)
    setImageFailed(false)

    if (event.imageUrl) {
      void getEventImageBlob(event.id, controller.signal)
        .then((blob) => {
          if (!active) return

          objectUrl = URL.createObjectURL(blob)

          setImageSrc(objectUrl)
          setImageFailed(false)
        })
        .catch((error: unknown) => {
          if (!active || controller.signal.aborted) return

          console.warn(
            `Unable to load image for event ${event.id}:`,
            error
          )
        })
    }

    return () => {
      active = false
      controller.abort()

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [
    event.id,
    event.imageUrl,
    event.updatedAt,
    fallback
  ])

  if (imageFailed) {
    return (
      <span className="event-card-icon" aria-hidden="true">
        {eventIcon(event.category)}
      </span>
    )
  }

  return (
    <img
      className={className}
      src={imageSrc}
      alt={event.title}
      loading="lazy"
      onError={() => {
        if (imageSrc !== fallback) {
          setImageSrc(fallback)
        } else {
          setImageFailed(true)
        }
      }}
    />
  )
}

// ============================================
// EVENTS PAGE
// ============================================

function Events({
  initialEventId = null,
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick
}: EventsProps) {
  const [eventSearch, setEventSearch] = useState('')
  const [eventFilter, setEventFilter] =
    useState<EventFilter>('all')

  const [events, setEvents] = useState<EventResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [linkedEventError, setLinkedEventError] = useState('')

  const [currentUserId, setCurrentUserId] =
    useState<number | null>(null)

  const [registrations, setRegistrations] = useState<
    Record<number, EventRegistrationResponse>
  >({})

  const [selectedEvent, setSelectedEvent] =
    useState<EventResponse | null>(null)

  const [checkoutEvent, setCheckoutEvent] =
    useState<EventResponse | null>(null)

  const [paymentSuccess, setPaymentSuccess] =
    useState<EventResponse | null>(null)

  // Demo state only. This does not confirm real backend payments.
  const [demoPayments, setDemoPayments] = useState<
    Record<number, boolean>
  >({})

  const [actionError, setActionError] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const [attendees, setAttendees] = useState<
    EventRegistrationResponse[] | null
  >(null)

  const [formOpen, setFormOpen] = useState(false)

  const [editingEventId, setEditingEventId] =
    useState<number | null>(null)

  const [form, setForm] = useState<EventFormState>(emptyForm)
  const [selectedImage, setSelectedImage] =
    useState<File | null>(null)

  const [formError, setFormError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const paymentInFlight = useRef(false)
  const actionInFlight = useRef(false)
  const detailsRequest = useRef(0)

  const hosting = eventFilter === 'hosting'

  // ============================================
  // LOAD EVENTS
  // ============================================

  useEffect(() => {
    let cancelled = false

    fetchEvents(hosting)
      .then((list) => {
        if (cancelled) return

        setEvents(list)
        setLoadError('')
      })
      .catch((error: unknown) => {
        if (cancelled) return

        setEvents([])
        setLoadError(
          errorText(error, 'Unable to load events.')
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [hosting, reloadKey])

  useEffect(() => {
    let cancelled = false

    fetchActiveRegistrations()
      .then(({ userId, active }) => {
        if (cancelled) return

        setCurrentUserId(userId)
        setRegistrations(active)
      })
      .catch((error: unknown) => {
        console.warn('Event registrations error:', error)
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  // Open an event selected from the dashboard.
  useEffect(() => {
    if (initialEventId == null) return

    let cancelled = false
    const requestId = ++detailsRequest.current

    setLinkedEventError('')
    setActionError('')
    setAttendees(null)

    getEvent(initialEventId)
      .then((event) => {
        if (
          !cancelled &&
          requestId === detailsRequest.current
        ) {
          setSelectedEvent(event)
        }
      })
      .catch((error: unknown) => {
        if (
          !cancelled &&
          requestId === detailsRequest.current
        ) {
          setLinkedEventError(
            errorText(
              error,
              'This event is no longer available.'
            )
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [initialEventId])

  // ============================================
  // FILTERS
  // ============================================

  const changeFilter = (filter: EventFilter) => {
    if ((filter === 'hosting') !== hosting) {
      setLoading(true)
    }

    setEventFilter(filter)
  }

  const refresh = () => {
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const filteredEvents = events.filter((event) => {
    const search = eventSearch.trim().toLowerCase()

    const matchesSearch =
      event.title.toLowerCase().includes(search) ||
      event.category.toLowerCase().includes(search) ||
      eventLocation(event).toLowerCase().includes(search)

    const matchesFilter =
      eventFilter === 'all' ||
      eventFilter === 'hosting' ||
      (eventFilter === 'online'
        ? isOnline(event)
        : !isOnline(event))

    return matchesSearch && matchesFilter
  })

  // ============================================
  // DETAILS
  // ============================================

  const openDetails = async (event: EventResponse) => {
    const requestId = ++detailsRequest.current

    setSelectedEvent(event)
    setActionError('')
    setAttendees(null)

    try {
      const existingRegistration = registrations[event.id]

      const [fresh, registration] = await Promise.all([
        getEvent(event.id),
        existingRegistration
          ? getRegistration(existingRegistration.id)
          : Promise.resolve(null)
      ])

      if (requestId !== detailsRequest.current) return

      setSelectedEvent((current) =>
        current?.id === fresh.id ? fresh : current
      )

      if (registration) {
        setRegistrations((current) => {
          const next = { ...current }

          if (registration.status === 'CANCELLED') {
            delete next[registration.eventId]
          } else {
            next[registration.eventId] = registration
          }

          return next
        })
      }
    } catch (error) {
      if (requestId !== detailsRequest.current) return

      setActionError(
        errorText(error, 'Unable to refresh event details.')
      )
    }
  }

  const closeDetails = () => {
    if (actionInFlight.current) return

    detailsRequest.current += 1

    setSelectedEvent(null)
    setAttendees(null)
    setActionError('')
  }

  // ============================================
  // ACTIONS
  // ============================================

  const runAction = async (
    action: () => Promise<void>,
    fallback: string
  ) => {
    if (actionInFlight.current) return

    actionInFlight.current = true
    setActionBusy(true)
    setActionError('')

    try {
      await action()
    } catch (error) {
      setActionError(errorText(error, fallback))
    } finally {
      actionInFlight.current = false
      setActionBusy(false)
    }
  }

  const handleRegister = (event: EventResponse) =>
    runAction(async () => {
      const registration = await registerForEvent(event.id)

      setRegistrations((current) => ({
        ...current,
        [event.id]: registration
      }))
    }, 'Unable to register for this event.')

  const openCheckout = (event: EventResponse) => {
    if (actionInFlight.current) return

    detailsRequest.current += 1

    setActionError('')
    setPaymentSuccess(null)
    setCheckoutEvent(event)
    setSelectedEvent(null)
  }

  const closeCheckout = () => {
    if (paymentInFlight.current) return

    setCheckoutEvent(null)
    setActionError('')
  }

  const handleDemoPayment = async () => {
    if (
      !checkoutEvent ||
      paymentInFlight.current ||
      actionInFlight.current
    ) {
      return
    }

    const event = checkoutEvent

    paymentInFlight.current = true
    actionInFlight.current = true

    setActionBusy(true)
    setActionError('')

    try {
      const registration =
        registrations[event.id] ??
        await registerForEvent(event.id)

      setRegistrations((current) => ({
        ...current,
        [event.id]: registration
      }))

      setDemoPayments((current) => ({
        ...current,
        [event.id]: true
      }))

      setCheckoutEvent(null)
      setPaymentSuccess(event)
    } catch (error) {
      setActionError(
        errorText(
          error,
          'Unable to complete registration. Please try again.'
        )
      )
    } finally {
      paymentInFlight.current = false
      actionInFlight.current = false
      setActionBusy(false)
    }
  }

  const handleCancelRegistration = (event: EventResponse) =>
    runAction(async () => {
      const registration = registrations[event.id]

      if (!registration) return

      await cancelRegistration(registration.id)

      setDemoPayments((current) => {
        const next = { ...current }
        delete next[event.id]
        return next
      })

      setRegistrations((current) => {
        const next = { ...current }
        delete next[event.id]
        return next
      })
    }, 'Unable to cancel your registration.')

  const handlePublish = (event: EventResponse) =>
    runAction(async () => {
      const updated = await publishEvent(event.id)

      setSelectedEvent(updated)

      setEvents((current) =>
        current.map((item) =>
          item.id === updated.id ? updated : item
        )
      )
    }, 'Unable to publish this event.')

  const handleDelete = (event: EventResponse) => {
    if (actionInFlight.current) return

    const confirmed = window.confirm(
      `Cancel "${event.title}"? Attendees will no longer be able to register.`
    )

    if (!confirmed) return

    return runAction(async () => {
      await deleteEvent(event.id)

      const updated = await getEvent(event.id)

      setSelectedEvent(updated)

      setEvents((current) =>
        hosting
          ? current.map((item) =>
              item.id === updated.id ? updated : item
            )
          : current.filter((item) => item.id !== updated.id)
      )
    }, 'Unable to cancel this event.')
  }

  const handleShowAttendees = (event: EventResponse) =>
    runAction(async () => {
      setAttendees(await getEventRegistrations(event.id))
    }, 'Unable to load registrations.')

  // ============================================
  // CREATE / EDIT FORM
  // ============================================

  const openCreateForm = () => {
    if (actionInFlight.current) return

    setEditingEventId(null)
    setForm({ ...emptyForm })
    setSelectedImage(null)
    setFormError('')
    setFormOpen(true)
  }

  const openEditForm = (event: EventResponse) => {
    if (actionInFlight.current) return

    detailsRequest.current += 1

    setEditingEventId(event.id)

    setForm({
      title: event.title,
      description: event.description ?? '',
      category: event.category,
      city: event.city,
      venue: event.venue ?? '',
      startDateTime: toInputDateTime(event.startDateTime),
      endDateTime: toInputDateTime(event.endDateTime),
      eventType: event.eventType,
      capacity: String(event.capacity),
      price: event.eventType === 'PAID'
        ? String(event.price)
        : '',
      publishNow: event.status === 'PUBLISHED'
    })

    setSelectedImage(null)
    setFormError('')
    setSelectedEvent(null)
    setFormOpen(true)
  }

  const closeForm = () => {
    if (actionInFlight.current) return

    setFormOpen(false)
    setFormError('')
    setSelectedImage(null)
  }

  const updateForm = <K extends keyof EventFormState,>(
    key: K,
    value: EventFormState[K]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }))
  }

  const submitForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (actionInFlight.current) return

    setFormError('')

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.city.trim()
    ) {
      setFormError('Title, category and city are required.')
      return
    }

    if (!form.startDateTime || !form.endDateTime) {
      setFormError('Start and end date are required.')
      return
    }

    const start = new Date(form.startDateTime).getTime()
    const end = new Date(form.endDateTime).getTime()

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start
    ) {
      setFormError('End date must be after the start date.')
      return
    }

    const capacity = Number(form.capacity)

    if (!Number.isInteger(capacity) || capacity < 1) {
      setFormError('Capacity must be a whole number of at least 1.')
      return
    }

    const price =
      form.eventType === 'PAID'
        ? Number(form.price)
        : 0

    if (
      form.eventType === 'PAID' &&
      (
        !form.price.trim() ||
        !Number.isFinite(price) ||
        price <= 0
      )
    ) {
      setFormError('Paid events require a price greater than zero.')
      return
    }

    const request: CreateEventRequest = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      city: form.city.trim(),
      venue: form.venue.trim(),
      startDateTime: toApiDateTime(form.startDateTime),
      endDateTime: toApiDateTime(form.endDateTime),
      eventType: form.eventType,
      capacity,
      price
    }

    actionInFlight.current = true
    setActionBusy(true)

    try {
      let eventId = editingEventId

      if (eventId === null) {
        const created = await createEvent(request)

        eventId = created.id

        // If image upload or publishing fails, retry the same
        // event instead of creating a duplicate.
        setEditingEventId(eventId)
      } else {
        await updateEvent(eventId, request)
      }

      if (selectedImage) {
        await uploadEventImage(eventId, selectedImage)
        setSelectedImage(null)
      }

      if (form.publishNow) {
        await publishEvent(eventId)
      } else {
        await updateEvent(eventId, {
          status: 'DRAFT'
        })
      }

      setFormOpen(false)
      setSelectedImage(null)
      setLoading(true)

      if (hosting) {
        setReloadKey((key) => key + 1)
      } else {
        setEventFilter('hosting')
      }
    } catch (error) {
      setFormError(
        errorText(error, 'Unable to save event.')
      )
    } finally {
      actionInFlight.current = false
      setActionBusy(false)
    }
  }

  const selectedRegistration = selectedEvent
    ? registrations[selectedEvent.id]
    : undefined

  const isOwner =
    selectedEvent !== null &&
    selectedEvent.createdBy === currentUserId

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="events-screen">
      <NavigationBar
        activePage="events"
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onCollaborationClick={onCollaborationClick}
        onEventsClick={onEventsClick}
      />

      <main className="events-page">
        {linkedEventError && (
          <p role="alert" className="event-action-error">
            {linkedEventError}
          </p>
        )}

        {/* SEARCH AND FILTERS */}

        <section className="events-controls">
          <div className="events-search">
            <span aria-hidden="true">⌕</span>

            <input
              type="text"
              aria-label="Search events"
              placeholder="Search events, workshops and experiences"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
            />

            {eventSearch && (
              <button
                type="button"
                className="events-search-clear"
                aria-label="Clear search"
                onClick={() => setEventSearch('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="event-filters">
            <button
              type="button"
              className={eventFilter === 'all' ? 'active' : ''}
              onClick={() => changeFilter('all')}
            >
              All Events
            </button>

            <button
              type="button"
              className={
                eventFilter === 'in-person' ? 'active' : ''
              }
              onClick={() => changeFilter('in-person')}
            >
              📍 In-person
            </button>

            <button
              type="button"
              className={
                eventFilter === 'online' ? 'active' : ''
              }
              onClick={() => changeFilter('online')}
            >
              💻 Online
            </button>

            <button
              type="button"
              className={
                eventFilter === 'hosting' ? 'active' : ''
              }
              onClick={() => changeFilter('hosting')}
            >
              🗓️ My Events
            </button>

            <button
              type="button"
              className="events-host-button"
              onClick={openCreateForm}
            >
              + Host Event
            </button>
          </div>
        </section>

        {/* EVENT LIST */}

        <section className="events-results">
          <div className="events-results-heading">
            <div>
              <h2>
                {hosting ? 'Events You Host' : 'Upcoming Events'}
              </h2>

              <p>
                {loading
                  ? 'Loading events…'
                  : `${filteredEvents.length} event${
                      filteredEvents.length !== 1 ? 's' : ''
                    } available`}
              </p>
            </div>
          </div>

          {loadError ? (
            <div className="no-events">
              <span>⚠️</span>
              <h3>Couldn’t load events</h3>
              <p>{loadError}</p>

              <button
                type="button"
                className="event-details-button events-retry-button"
                onClick={refresh}
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="no-events">
              <span>⏳</span>
              <h3>Loading events…</h3>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map((event) => (
                <article className="event-card" key={event.id}>
                  <div className="event-card-visual">
                    <EventImage
                      key={`${event.id}-${event.imageUrl}-${event.updatedAt}`}
                      event={event}
                      className="event-card-image"
                    />

                    {registrations[event.id] && (
                      <span className="event-registered-badge">
                        {registrationLabel(
                          registrations[event.id],
                          demoPayments[event.id]
                        )}
                      </span>
                    )}

                    {event.status !== 'PUBLISHED' && (
                      <span
                        className={`event-status-badge ${event.status.toLowerCase()}`}
                      >
                        {event.status === 'DRAFT'
                          ? 'Draft'
                          : 'Cancelled'}
                      </span>
                    )}
                  </div>

                  <div className="event-card-content">
                    <div className="event-date">
                      {formatDate(event.startDateTime)}
                      {' • '}
                      {formatTime(event.startDateTime)}
                    </div>

                    <h3>{event.title}</h3>

                    <p className="event-description">
                      {event.description}
                    </p>

                    <div className="event-meta">
                      <span>
                        {isOnline(event) ? '💻' : '📍'}
                        {' '}
                        {eventLocation(event)}
                      </span>

                      <strong
                        className={
                          eventPrice(event) === 0 ? 'free' : ''
                        }
                      >
                        {eventPrice(event) === 0
                          ? 'FREE'
                          : `$${eventPrice(event).toFixed(2)}`}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="event-details-button"
                      onClick={() => void openDetails(event)}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="no-events">
              <span>📅</span>
              <h3>No events found</h3>

              <p>
                {hosting
                  ? 'You haven’t created any events yet. Use “Host Event” to create one.'
                  : 'Try changing your search or event filter.'}
              </p>
            </div>
          )}
        </section>

        {/* EVENT DETAILS MODAL */}

        {selectedEvent && (
          <div
            className="event-modal-overlay"
            onClick={closeDetails}
          >
            <div
              className="event-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-details-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="event-modal-close"
                aria-label="Close event details"
                disabled={actionBusy}
                onClick={closeDetails}
              >
                ✕
              </button>

              <div className="event-modal-visual">
                <EventImage
                  key={`${selectedEvent.id}-${selectedEvent.imageUrl}-${selectedEvent.updatedAt}`}
                  event={selectedEvent}
                  className="event-modal-image"
                />

                <div>
                  <small>{selectedEvent.category}</small>

                  <h2 id="event-details-title">
                    {selectedEvent.title}
                  </h2>
                </div>
              </div>

              <div className="event-modal-content">
                <p className="event-modal-description">
                  {selectedEvent.description}
                </p>

                <div className="event-detail-grid">
                  <div>
                    <span>📅 Date</span>
                    <strong>
                      {formatDate(selectedEvent.startDateTime)}
                    </strong>
                  </div>

                  <div>
                    <span>🕒 Time</span>
                    <strong>
                      {formatTime(selectedEvent.startDateTime)}
                      {' – '}
                      {formatTime(selectedEvent.endDateTime)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {isOnline(selectedEvent)
                        ? '💻 Location'
                        : '📍 Location'}
                    </span>
                    <strong>
                      {eventLocation(selectedEvent)}
                    </strong>
                  </div>

                  <div>
                    <span>🎟️ Registration</span>
                    <strong>
                      {eventPrice(selectedEvent) === 0
                        ? 'Free Event'
                        : `$${eventPrice(selectedEvent).toFixed(2)}`}
                    </strong>
                  </div>

                  <div>
                    <span>👥 Capacity</span>
                    <strong>
                      {selectedEvent.capacity} spots
                    </strong>
                  </div>

                  <div>
                    <span>📌 Status</span>
                    <strong>
                      {selectedEvent.status.charAt(0) +
                        selectedEvent.status.slice(1).toLowerCase()}
                    </strong>
                  </div>
                </div>

                {actionError && (
                  <p role="alert" className="event-action-error">
                    {actionError}
                  </p>
                )}

                {isOwner ? (
                  <>
                    <div className="event-owner-actions">
                      {selectedEvent.status === 'DRAFT' && (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() =>
                            void handlePublish(selectedEvent)
                          }
                        >
                          🚀 Publish
                        </button>
                      )}

                      {selectedEvent.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          disabled={actionBusy}
                          onClick={() =>
                            openEditForm(selectedEvent)
                          }
                        >
                          ✏️ Edit
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() =>
                          void handleShowAttendees(selectedEvent)
                        }
                      >
                        👥 Registrations
                      </button>

                      {selectedEvent.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          className="danger"
                          disabled={actionBusy}
                          onClick={() =>
                            void handleDelete(selectedEvent)
                          }
                        >
                          🗑️ Cancel Event
                        </button>
                      )}
                    </div>

                    {attendees && (
                      <div className="event-attendees">
                        <h4>
                          Registrations (
                          {
                            attendees.filter(
                              (item) => item.status !== 'CANCELLED'
                            ).length
                          }
                          /{selectedEvent.capacity})
                        </h4>

                        {attendees.length === 0 ? (
                          <p>No one has registered yet.</p>
                        ) : (
                          <ul>
                            {attendees.map((attendee) => (
                              <li key={attendee.id}>
                                <span>@{attendee.username}</span>

                                <em
                                  className={
                                    attendee.status.toLowerCase()
                                  }
                                >
                                  {attendee.status.toLowerCase()}
                                </em>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                ) : selectedRegistration ? (
                  <>
                    <button
                      type="button"
                      className="event-register-button registered"
                      disabled
                    >
                      {demoPayments[selectedEvent.id]
                        ? '✓ Registered • Demo payment successful'
                        : selectedRegistration.status === 'PENDING'
                        ? '⏳ Registered • Payment pending confirmation'
                        : '✓ Registered'}
                    </button>

                    {selectedEvent.eventType === 'PAID' &&
                      selectedEvent.status === 'PUBLISHED' &&
                      selectedRegistration.status === 'PENDING' &&
                      !demoPayments[selectedEvent.id] && (
                        <button
                          type="button"
                          className="checkout-pay-button"
                          disabled={actionBusy}
                          onClick={() =>
                            openCheckout(selectedEvent)
                          }
                        >
                          Complete demo payment
                        </button>
                      )}

                    <button
                      type="button"
                      className="event-cancel-registration"
                      disabled={actionBusy}
                      onClick={() =>
                        void handleCancelRegistration(selectedEvent)
                      }
                    >
                      Cancel my registration
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="event-register-button"
                    disabled={
                      actionBusy ||
                      currentUserId === null ||
                      selectedEvent.status !== 'PUBLISHED'
                    }
                    onClick={() => {
                      if (eventPrice(selectedEvent) === 0) {
                        void handleRegister(selectedEvent)
                      } else {
                        openCheckout(selectedEvent)
                      }
                    }}
                  >
                    {selectedEvent.status !== 'PUBLISHED'
                      ? 'Registration unavailable'
                      : currentUserId === null
                      ? 'Loading account…'
                      : eventPrice(selectedEvent) === 0
                      ? 'Register for Free'
                      : `Register & Pay $${eventPrice(
                          selectedEvent
                        ).toFixed(2)}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DEMO CHECKOUT */}

        {checkoutEvent && (
          <div
            className="checkout-overlay"
            onClick={closeCheckout}
          >
            <div
              className="checkout-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-checkout-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="checkout-close"
                disabled={actionBusy}
                aria-label="Close checkout"
                onClick={closeCheckout}
              >
                ✕
              </button>

              <div className="checkout-heading">
                <span>Stripe-style checkout · DEMO</span>

                <h2 id="event-checkout-title">
                  Complete Payment
                </h2>

                <p>{checkoutEvent.title}</p>
              </div>

              <div className="checkout-summary">
                <div>
                  <span>Event</span>
                  <strong>{checkoutEvent.title}</strong>
                </div>

                <div>
                  <span>Date & Time</span>
                  <strong>
                    {formatDate(checkoutEvent.startDateTime)}
                    {' • '}
                    {formatTime(checkoutEvent.startDateTime)}
                  </strong>
                </div>

                <div>
                  <span>Location</span>
                  <strong>
                    {eventLocation(checkoutEvent)}
                  </strong>
                </div>
              </div>

              <div className="checkout-total">
                <span>Total</span>
                <strong>
                  ${eventPrice(checkoutEvent).toFixed(2)}
                </strong>
              </div>

              <div className="event-demo-card">
                <strong>Demo card</strong>

                <p className="event-demo-card-number">
                  4242 4242 4242 4242
                </p>

                <div className="event-demo-card-details">
                  <span>Expiry: 12/30</span>
                  <span>CVC: 123</span>
                </div>
              </div>

              <div className="checkout-demo-notice">
                <span aria-hidden="true">🔒</span>
                <p>
                  Frontend demo only. This checkout simulates
                  a successful payment. It does not contact
                  Stripe or charge money. Registration is saved
                  through your existing API. Backend payment
                  status is unchanged.
                </p>
              </div>

              {actionError && (
                <p role="alert" className="event-action-error">
                  {actionError}
                </p>
              )}

              <button
                type="button"
                className="checkout-pay-button"
                disabled={actionBusy}
                onClick={() => void handleDemoPayment()}
              >
                {actionBusy
                  ? 'Processing…'
                  : `Pay $${eventPrice(
                      checkoutEvent
                    ).toFixed(2)} · Demo`}
              </button>
            </div>
          </div>
        )}

        {/* DEMO SUCCESS */}

        {paymentSuccess && (
          <div
            className="checkout-overlay"
            onClick={() => setPaymentSuccess(null)}
          >
            <div
              className="checkout-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="demo-payment-success-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="checkout-close"
                aria-label="Close payment success"
                onClick={() => setPaymentSuccess(null)}
              >
                ✕
              </button>

              <div
                role="status"
                className="event-payment-success"
              >
                <div className="event-payment-success-icon">
                  ✓
                </div>

                <h2 id="demo-payment-success-title">
                  Demo payment successful
                </h2>

                <p>
                  Your demo payment for{' '}
                  <strong>{paymentSuccess.title}</strong>
                  {' '}is complete.
                </p>

                <strong className="event-payment-success-amount">
                  ${eventPrice(paymentSuccess).toFixed(2)}
                </strong>

                <p>Registration saved. No money was charged.</p>

                <small>
                  Simulated payment only. Backend payment
                  confirmation remains unchanged.
                </small>
              </div>

              <button
                type="button"
                className="checkout-pay-button"
                onClick={() => {
                  const event = paymentSuccess

                  setPaymentSuccess(null)
                  void openDetails(event)
                }}
              >
                View registration
              </button>
            </div>
          </div>
        )}

        {/* CREATE / EDIT FORM */}

        {formOpen && (
          <div
            className="checkout-overlay"
            onClick={closeForm}
          >
            <form
              className="checkout-modal event-form"
              role="dialog"
              aria-modal="true"
              aria-labelledby="event-form-title"
              onClick={(e) => e.stopPropagation()}
              onSubmit={submitForm}
            >
              <button
                type="button"
                className="checkout-close"
                aria-label="Close event form"
                disabled={actionBusy}
                onClick={closeForm}
              >
                ✕
              </button>

              <div className="checkout-heading">
                <span>
                  🗓️ {editingEventId === null
                    ? 'Host an Event'
                    : 'Edit Event'}
                </span>

                <h2 id="event-form-title">
                  {editingEventId === null
                    ? 'Create Event'
                    : 'Update Event'}
                </h2>
              </div>

              <label className="event-form-full">
                Title
                <input
                  value={form.title}
                  onChange={(e) =>
                    updateForm('title', e.target.value)
                  }
                  maxLength={200}
                  disabled={actionBusy}
                  required
                />
              </label>

              <label>
                Category
                <input
                  value={form.category}
                  onChange={(e) =>
                    updateForm('category', e.target.value)
                  }
                  placeholder="e.g. Photography"
                  maxLength={100}
                  disabled={actionBusy}
                  required
                />
              </label>

              <label>
                City
                <input
                  value={form.city}
                  onChange={(e) =>
                    updateForm('city', e.target.value)
                  }
                  placeholder="e.g. Adelaide or Online"
                  maxLength={100}
                  disabled={actionBusy}
                  required
                />
              </label>

              <label className="event-form-full">
                Venue
                <input
                  value={form.venue}
                  onChange={(e) =>
                    updateForm('venue', e.target.value)
                  }
                  placeholder="Address, room or meeting link"
                  maxLength={500}
                  disabled={actionBusy}
                />
              </label>

              <label>
                Starts
                <input
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={(e) =>
                    updateForm('startDateTime', e.target.value)
                  }
                  disabled={actionBusy}
                  required
                />
              </label>

              <label>
                Ends
                <input
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={(e) =>
                    updateForm('endDateTime', e.target.value)
                  }
                  disabled={actionBusy}
                  required
                />
              </label>

              <label>
                Type
                <select
                  value={form.eventType}
                  onChange={(e) =>
                    updateForm(
                      'eventType',
                      e.target.value as EventType
                    )
                  }
                  disabled={actionBusy}
                >
                  <option value="FREE">Free</option>
                  <option value="PAID">Paid</option>
                </select>
              </label>

              <label>
                Capacity
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.capacity}
                  onChange={(e) =>
                    updateForm('capacity', e.target.value)
                  }
                  disabled={actionBusy}
                  required
                />
              </label>

              {form.eventType === 'PAID' && (
                <label>
                  Price ($)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      updateForm('price', e.target.value)
                    }
                    disabled={actionBusy}
                    required
                  />
                </label>
              )}

              <label className="event-form-full">
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    updateForm('description', e.target.value)
                  }
                  maxLength={2000}
                  disabled={actionBusy}
                />
              </label>

              <label className="event-form-full">
                Event Image (Optional)

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={actionBusy}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null

                    if (!file) {
                      setSelectedImage(null)
                      setFormError('')
                      return
                    }

                    const allowedTypes = [
                      'image/jpeg',
                      'image/png',
                      'image/webp'
                    ]

                    if (!allowedTypes.includes(file.type)) {
                      setFormError(
                        'Only JPG, PNG and WebP images are supported.'
                      )

                      e.target.value = ''
                      setSelectedImage(null)
                      return
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      setFormError(
                        'Event image must be 5 MB or smaller.'
                      )

                      e.target.value = ''
                      setSelectedImage(null)
                      return
                    }

                    if (file.size === 0) {
                      setFormError(
                        'The selected image is empty.'
                      )

                      e.target.value = ''
                      setSelectedImage(null)
                      return
                    }

                    setSelectedImage(file)
                    setFormError('')
                  }}
                />

                <small>
                  Upload a JPG, PNG or WebP image
                  (maximum 5 MB). Leave empty when editing
                  to keep the current image.
                </small>

                {selectedImage && (
                  <small>
                    Selected: {selectedImage.name}
                  </small>
                )}
              </label>

              <label className="event-form-full event-form-check">
                <input
                  type="checkbox"
                  checked={form.publishNow}
                  onChange={(e) =>
                    updateForm('publishNow', e.target.checked)
                  }
                  disabled={actionBusy}
                />

                Publish so others can register
                (otherwise saved as draft)
              </label>

              {formError && (
                <p
                  role="alert"
                  className="event-action-error event-form-full"
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="checkout-pay-button event-form-full"
                disabled={actionBusy}
              >
                {actionBusy
                  ? 'Saving…'
                  : editingEventId === null
                  ? 'Create Event'
                  : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default Events