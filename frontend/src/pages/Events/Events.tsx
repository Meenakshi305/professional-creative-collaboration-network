import { useEffect, useRef, useState, type FormEvent } from 'react'
import './Events.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'
import {
  cancelRegistration,
  createEvent,
  uploadEventImage,
  deleteEvent,
  getCurrentUserId,
  getEvent,
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

// ============================================
// DISPLAY HELPERS
// ============================================

function eventIcon(category: string): string {
  return categoryIcons[category.trim().toLowerCase()] ?? '📅'
}
const eventImageUrl = (event: EventResponse): string | null => {
    if (!event.imageUrl) return null

    if (event.imageUrl.startsWith('http')) {
        return event.imageUrl
    }

    return `http://localhost:8080${event.imageUrl}`
}
const eventFallbackImage = (category: string): string => {
    const normalizedCategory = category.trim().toLowerCase()

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

    const filename = fallbackImages[normalizedCategory] ?? 'default.jpg'

    return `/event-images/${filename}`
}

function isOnline(event: EventResponse): boolean {
  return /online/i.test(event.city) || /online/i.test(event.venue ?? '')
}

function eventLocation(event: EventResponse): string {
  if (isOnline(event)) return 'Online'
  return event.venue ? `${event.venue}, ${event.city}` : event.city
}

function eventPrice(event: EventResponse): number {
  return event.eventType === 'FREE' ? 0 : Number(event.price) || 0
}

// Backend sends LocalDateTime without a zone, so parse it as local time.
function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function toInputDateTime(value: string): string {
  return value ? value.slice(0, 16) : ''
}

function toApiDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

function registrationLabel(registration: EventRegistrationResponse, demoPaid = false): string {
  if (demoPaid) return '✓ Registered • Demo paid'
  return registration.status === 'PENDING' ? '⏳ Pending' : '✓ Registered'
}

async function fetchEvents(hosting: boolean): Promise<EventResponse[]> {
  if (!hosting) return getEvents({ status: 'PUBLISHED' })
  const userId = await getCurrentUserId()
  return (await getEvents()).filter((event) => event.createdBy === userId)
}

async function fetchActiveRegistrations() {
  const userId = await getCurrentUserId()
  const active: Record<number, EventRegistrationResponse> = {}
  ;(await getMyRegistrations())
    .filter((r) => r.status !== 'CANCELLED')
    .forEach((r) => { active[r.eventId] = r })
  return { userId, active }
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

function Events({
  initialEventId = null,
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick
}: EventsProps) {
    const [eventSearch, setEventSearch] = useState('')
    const [eventFilter, setEventFilter] = useState<EventFilter>('all')
    const [events, setEvents] = useState<EventResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [linkedEventError, setLinkedEventError] = useState('')
    const [currentUserId, setCurrentUserId] = useState<number | null>(null)
    const [registrations, setRegistrations] = useState<Record<number, EventRegistrationResponse>>({})
    const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null)
    const [checkoutEvent, setCheckoutEvent] = useState<EventResponse | null>(null)
    // Demo payments affect the frontend only; backend payment status is unchanged.
    const [paymentSuccess, setPaymentSuccess] = useState<EventResponse | null>(null)
    const [demoPayments, setDemoPayments] = useState<Record<number, boolean>>({})
    const paymentInFlight = useRef(false)

    const closeCheckout = () => {
        if (paymentInFlight.current) return
        setCheckoutEvent(null)
        setActionError('')
    }

    const [actionError, setActionError] = useState('')
    const [actionBusy, setActionBusy] = useState(false)
    const [attendees, setAttendees] = useState<EventRegistrationResponse[] | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [editingEventId, setEditingEventId] = useState<number | null>(null)
    const [form, setForm] = useState<EventFormState>(emptyForm)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [formError, setFormError] = useState('')


    // ============================================
    // LOAD EVENTS + MY REGISTRATIONS
    // ============================================

    const [reloadKey, setReloadKey] = useState(0)
    const hosting = eventFilter === 'hosting'

    // Callers flip `loading` on before a reload; the effect only applies the result.
    useEffect(() => {
        let cancelled = false
        fetchEvents(hosting)
            .then((list) => {
                if (cancelled) return
                setEvents(list)
                setLoadError('')
            })
            .catch((error) => {
                if (cancelled) return
                setEvents([])
                setLoadError(errorText(error, 'Unable to load events.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [hosting, reloadKey])

    useEffect(() => {
        let cancelled = false
        fetchActiveRegistrations()
            .then(({ userId, active }) => {
                if (cancelled) return
                setCurrentUserId(userId)
                setRegistrations(active)
            })
            .catch((error) => console.warn('Event registrations error:', error))
        return () => { cancelled = true }
    }, [reloadKey])

    const changeFilter = (filter: EventFilter) => {
        if ((filter === 'hosting') !== hosting) setLoading(true)
        setEventFilter(filter)
    }

    const refresh = () => {
        setLoading(true)
        setReloadKey((key) => key + 1)
    }

    const filteredEvents = events.filter((event) => {
        const search = eventSearch.toLowerCase()
        const matchesSearch = event.title.toLowerCase().includes(search) ||
                                event.category.toLowerCase().includes(search) ||
                                eventLocation(event).toLowerCase().includes(search)
        const matchesFilter = eventFilter === 'all' || eventFilter === 'hosting' ||
                                (eventFilter === 'online' ? isOnline(event) : !isOnline(event))
        return matchesSearch && matchesFilter
    })

    // ============================================
    // DETAILS MODAL
    // ============================================

    const openDetails = async (event: EventResponse) => {
        setSelectedEvent(event)
        setActionError('')
        setAttendees(null)
        try {
            const [fresh, registration] = await Promise.all([
                getEvent(event.id),
                registrations[event.id] ? getRegistration(registrations[event.id].id) : Promise.resolve(null)
            ])
            setSelectedEvent((current) => (current?.id === fresh.id ? fresh : current))
            if (registration) {
                setRegistrations((current) => {
                    const next = { ...current }
                    if (registration.status === 'CANCELLED') delete next[registration.eventId]
                    else next[registration.eventId] = registration
                    return next
                })
            }
        } catch (error) {
            console.warn('Event details error:', error)
        }
    }

    // Open the exact event selected on the Dashboard, even if not in the list.
    useEffect(() => {
        if (initialEventId == null) return
        setLinkedEventError('')
        let cancelled = false
        setActionError('')
        setAttendees(null)

        getEvent(initialEventId)
            .then(event => {
                if (!cancelled) setSelectedEvent(event)
            })
            .catch(error => {
                if (!cancelled) {
                    setLinkedEventError(errorText(error, 'This event is no longer available.'))
                }
            })

        return () => { cancelled = true }
    }, [initialEventId])

    const closeDetails = () => {
        setSelectedEvent(null)
        setAttendees(null)
        setActionError('')
    }

    const runAction = async (action: () => Promise<void>, fallback: string) => {
        setActionBusy(true)
        setActionError('')
        try {
            await action()
        } catch (error) {
            setActionError(errorText(error, fallback))
        } finally {
            setActionBusy(false)
        }
    }

    const handleRegister = (event: EventResponse) => runAction(async () => {
        const registration = await registerForEvent(event.id)
        setRegistrations((current) => ({ ...current, [event.id]: registration }))
    }, 'Unable to register for this event.')

    const openCheckout = (event: EventResponse) => {
        setActionError('')
        setPaymentSuccess(null)
        setCheckoutEvent(event)
        setSelectedEvent(null)
    }

    const handleDemoPayment = async () => {
        if (!checkoutEvent || paymentInFlight.current || actionBusy) return
        const event = checkoutEvent
        paymentInFlight.current = true
        setActionBusy(true)
        setActionError('')
        try {
            // Save registration through the existing API. Never mark a real
            // payment as confirmed from the frontend.
            const registration = registrations[event.id] ?? await registerForEvent(event.id)
            setRegistrations((current) => ({ ...current, [event.id]: registration }))
            setDemoPayments((current) => ({ ...current, [event.id]: true }))
            setCheckoutEvent(null)
            setPaymentSuccess(event)
        } catch (error) {
            setActionError(errorText(error, 'Unable to complete registration. Please try again.'))
        } finally {
            paymentInFlight.current = false
            setActionBusy(false)
        }
    }

    const handleCancelRegistration = (event: EventResponse) => runAction(async () => {
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

    const handlePublish = (event: EventResponse) => runAction(async () => {
        const updated = await publishEvent(event.id)
        setSelectedEvent(updated)
        setEvents((current) => current.map((e) => (e.id === updated.id ? updated : e)))
    }, 'Unable to publish this event.')

    const handleDelete = (event: EventResponse) => {
        if (!window.confirm(`Cancel "${event.title}"? Attendees will no longer be able to register.`)) return
        return runAction(async () => {
            await deleteEvent(event.id)
            const updated = await getEvent(event.id)
            setSelectedEvent(updated)
            setEvents((current) => eventFilter === 'hosting'
                ? current.map((e) => (e.id === updated.id ? updated : e))
                : current.filter((e) => e.id !== updated.id))
        }, 'Unable to cancel this event.')
    }

    const handleShowAttendees = (event: EventResponse) => runAction(async () => {
        setAttendees(await getEventRegistrations(event.id))
    }, 'Unable to load registrations.')

    // ============================================
    // CREATE / EDIT FORM
    // ============================================

    const openCreateForm = () => {
        setEditingEventId(null)
        setForm(emptyForm)
        setSelectedImage(null)
        setFormError('')
        setFormOpen(true)
    }

    const openEditForm = (event: EventResponse) => {
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
            price: event.eventType === 'PAID' ? String(event.price) : '',
            publishNow: event.status === 'PUBLISHED'
        })
        setSelectedImage(null)
        setFormError('')
        setSelectedEvent(null)
        setFormOpen(true)
    }

    const updateForm = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const submitForm = async (e: FormEvent) => {
        e.preventDefault()
        setFormError('')

        if (!form.title.trim() || !form.category.trim() || !form.city.trim()) {
            setFormError('Title, category and city are required.')
            return
        }
        if (!form.startDateTime || !form.endDateTime) {
            setFormError('Start and end date are required.')
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
            capacity: Number(form.capacity),
            price: form.eventType === 'PAID' ? Number(form.price || 0) : 0
        }

        setActionBusy(true)
        try {
            if (editingEventId === null) {
                const created = await createEvent(request)
                // Upload the selected image before publishing.
                if (selectedImage) {
                    await uploadEventImage(created.id, selectedImage)
                }
                if (form.publishNow) {
                    await publishEvent(created.id)
                }
            } else {
                await updateEvent(editingEventId, {
                    ...request,
                    ...(form.publishNow ? { status: 'PUBLISHED' as const } : {})
                })

                // Replace the event image only if a new file was selected.
                if (selectedImage) {
                    await uploadEventImage(editingEventId, selectedImage)
                }
            }
            setFormOpen(false)
            setLoading(true)
            if (hosting) setReloadKey((key) => key + 1)
            else setEventFilter('hosting')
        } catch (error) {
            setFormError(errorText(error, 'Unable to save event.'))
        } finally {
            setActionBusy(false)
        }
    }

    const selectedRegistration = selectedEvent ? registrations[selectedEvent.id] : undefined
    const isOwner = selectedEvent !== null && selectedEvent.createdBy === currentUserId

  return (
    <div className="events-screen">
      {linkedEventError && <p role="alert" className="events-error">{linkedEventError}</p>}
      <NavigationBar
        activePage="events"
        onHomeClick={onHomeClick}
        onProfileClick={onProfileClick}
        onCollaborationClick={onCollaborationClick}
        onEventsClick={onEventsClick}
      />

      <main className="events-page">
        <section className="events-controls">
            <div className="events-search">
                <span>⌕</span>

                <input
                type="text"
                placeholder="Search events, workshops and experiences"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                />

                {eventSearch && (
                <button
                    type="button"
                    className="events-search-clear"
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
                className={eventFilter === 'in-person' ? 'active' : ''}
                onClick={() => changeFilter('in-person')}
                >
                📍 In-person
                </button>

                <button
                type="button"
                className={eventFilter === 'online' ? 'active' : ''}
                onClick={() => changeFilter('online')}
                >
                💻 Online
                </button>

                <button
                type="button"
                className={eventFilter === 'hosting' ? 'active' : ''}
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
            <section className="events-results">
                <div className="events-results-heading">
                    <div>
                    <h2>{eventFilter === 'hosting' ? 'Events You Host' : 'Upcoming Events'}</h2>
                    <p>
                        {loading
                            ? 'Loading events…'
                            : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} available`}
                    </p>
                    </div>
                </div>

                {loadError ? (
                    <div className="no-events">
                    <span>⚠️</span>
                    <h3>Couldn’t load events</h3>
                    <p>{loadError}</p>
                    <button type="button" className="event-details-button events-retry-button" onClick={refresh}>
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
                            {eventImageUrl(event) || eventFallbackImage(event.category) ? (
                                <img
                                    className="event-card-image"
                                    src={eventImageUrl(event) || eventFallbackImage(event.category)}
                                    alt={event.title}
                                    loading="lazy"
                                />
                            ) : (
                                <span className="event-card-icon">
                                    {eventIcon(event.category)}
                                </span>
                            )}

                            {registrations[event.id] && (
                                <span className="event-registered-badge">
                                    {registrationLabel(registrations[event.id], demoPayments[event.id])}
                                </span>
                            )}

                            {event.status !== 'PUBLISHED' && (
                                <span className={`event-status-badge ${event.status.toLowerCase()}`}>
                                    {event.status === 'DRAFT' ? 'Draft' : 'Cancelled'}
                                </span>
                            )}
                        </div>

                        <div className="event-card-content">
                            <div className="event-date">
                            {formatDate(event.startDateTime)} • {formatTime(event.startDateTime)}
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

                            <strong className={eventPrice(event) === 0 ? 'free' : ''}>
                                {eventPrice(event) === 0 ? 'FREE' : `$${eventPrice(event)}`}
                            </strong>
                            </div>

                            <button
                                type="button"
                                className="event-details-button"
                                onClick={() => openDetails(event)}
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
                        {eventFilter === 'hosting'
                            ? 'You haven’t created any events yet. Use “Host Event” to create one.'
                            : 'Try changing your search or event filter.'}
                    </p>
                    </div>
                )}
                </section>
                {selectedEvent && (
                    <div className="event-modal-overlay"
                        onClick={closeDetails}>
                        <div
                        className="event-modal"
                        onClick={(e) => e.stopPropagation()}
                        >
                        <button
                            type="button"
                            className="event-modal-close"
                            onClick={closeDetails}
                        >
                            ✕
                        </button>

                        <div className="event-modal-visual">
                            {eventImageUrl(selectedEvent) || eventFallbackImage(selectedEvent.category) ? (
                                <img
                                    className="event-modal-image"
                                    src={
                                        eventImageUrl(selectedEvent) ||
                                        eventFallbackImage(selectedEvent.category)
                                    }
                                    alt={selectedEvent.title}
                                />
                            ) : (
                                <span>{eventIcon(selectedEvent.category)}</span>
                            )}

                            <div>
                            <small>{selectedEvent.category}</small>
                            <h2>{selectedEvent.title}</h2>
                            </div>
                        </div>

                        <div className="event-modal-content">
                            <p className="event-modal-description">
                            {selectedEvent.description}
                            </p>

                            <div className="event-detail-grid">
                            <div>
                                <span>📅 Date</span>
                                <strong>{formatDate(selectedEvent.startDateTime)}</strong>
                            </div>

                            <div>
                                <span>🕒 Time</span>
                                <strong>
                                    {formatTime(selectedEvent.startDateTime)} – {formatTime(selectedEvent.endDateTime)}
                                </strong>
                            </div>

                            <div>
                                <span>
                                {isOnline(selectedEvent) ? '💻 Location' : '📍 Location'}
                                </span>
                                <strong>{eventLocation(selectedEvent)}</strong>
                            </div>

                            <div>
                                <span>🎟️ Registration</span>
                                <strong>
                                {eventPrice(selectedEvent) === 0
                                    ? 'Free Event'
                                    : `$${eventPrice(selectedEvent)}`}
                                </strong>
                            </div>

                            <div>
                                <span>👥 Capacity</span>
                                <strong>{selectedEvent.capacity} spots</strong>
                            </div>

                            <div>
                                <span>📌 Status</span>
                                <strong>{selectedEvent.status.charAt(0) + selectedEvent.status.slice(1).toLowerCase()}</strong>
                            </div>
                            </div>

                            {actionError && (
                                <p className="event-action-error">{actionError}</p>
                            )}

                            {isOwner ? (
                                <>
                                <div className="event-owner-actions">
                                    {selectedEvent.status === 'DRAFT' && (
                                        <button type="button" disabled={actionBusy} onClick={() => handlePublish(selectedEvent)}>
                                            🚀 Publish
                                        </button>
                                    )}
                                    {selectedEvent.status !== 'CANCELLED' && (
                                        <button type="button" disabled={actionBusy} onClick={() => openEditForm(selectedEvent)}>
                                            ✏️ Edit
                                        </button>
                                    )}
                                    <button type="button" disabled={actionBusy} onClick={() => handleShowAttendees(selectedEvent)}>
                                        👥 Registrations
                                    </button>
                                    {selectedEvent.status !== 'CANCELLED' && (
                                        <button type="button" className="danger" disabled={actionBusy} onClick={() => handleDelete(selectedEvent)}>
                                            🗑️ Cancel Event
                                        </button>
                                    )}
                                </div>

                                {attendees && (
                                    <div className="event-attendees">
                                        <h4>Registrations ({attendees.filter((a) => a.status !== 'CANCELLED').length}/{selectedEvent.capacity})</h4>
                                        {attendees.length === 0 ? (
                                            <p>No one has registered yet.</p>
                                        ) : (
                                            <ul>
                                                {attendees.map((attendee) => (
                                                    <li key={attendee.id}>
                                                        <span>@{attendee.username}</span>
                                                        <em className={attendee.status.toLowerCase()}>
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
                                {selectedRegistration.status === 'PENDING' && !demoPayments[selectedEvent.id] && (
                                    <button type="button" className="checkout-pay-button" disabled={actionBusy}
                                        onClick={() => openCheckout(selectedEvent)}>
                                        Complete demo payment
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="event-cancel-registration"
                                    disabled={actionBusy}
                                    onClick={() => handleCancelRegistration(selectedEvent)}
                                    >
                                    Cancel my registration
                                </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="event-register-button"
                                    onClick={() => {
                                        if (eventPrice(selectedEvent) === 0) {
                                            handleRegister(selectedEvent)
                                        } else {
                                            openCheckout(selectedEvent)
                                        }
                                    }}
                                    disabled={actionBusy || selectedEvent.status !== 'PUBLISHED'}
                                    >
                                    {selectedEvent.status !== 'PUBLISHED'
                                        ? 'Registration unavailable'
                                        : eventPrice(selectedEvent) === 0
                                        ? 'Register for Free'
                                        : `Register & Pay $${eventPrice(selectedEvent)}`}
                                    </button>
                            )}
                        </div>
                        </div>
                    </div>
                    )}
                    {checkoutEvent && (
                        <div
                            className="checkout-overlay"
                            onClick={closeCheckout}
                        >
                            <div
                            className="checkout-modal"
                            role="dialog" aria-modal="true" aria-label="Demo payment checkout"
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
                                <span style={{ color: '#7567df', fontWeight: 700 }}>Stripe-style checkout · DEMO</span>
                                <h2>Complete Payment</h2>
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
                                    {formatDate(checkoutEvent.startDateTime)} • {formatTime(checkoutEvent.startDateTime)}
                                </strong>
                                </div>

                                <div>
                                <span>Location</span>
                                <strong>{eventLocation(checkoutEvent)}</strong>
                                </div>
                            </div>

                            <div className="checkout-total">
                                <span>Total</span>
                                <strong>${eventPrice(checkoutEvent)}</strong>
                            </div>

                            <div style={{ padding: 18, borderRadius: 14, background: '#eeebf8', color: '#282447', margin: '16px 0' }}>
                                <strong>Demo card</strong>
                                <p style={{ margin: '12px 0', fontSize: 20, letterSpacing: 2 }}>4242 4242 4242 4242</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Expiry: 12/30</span>
                                    <span>CVC: 123</span>
                                </div>
                            </div>
                            <div className="checkout-demo-notice">
                                <span>🔒</span>
                                <p>
                                    Frontend demo only. This checkout simulates a successful payment;
                                    it does not contact Stripe or charge money. Registration is saved
                                    through your existing API. Backend payment status is unchanged.
                                </p>
                            </div>

                            {actionError && (
                                <p className="event-action-error">{actionError}</p>
                            )}

                            <button
                                type="button"
                                className="checkout-pay-button"
                                disabled={actionBusy}
                                onClick={handleDemoPayment}
                            >
                                {actionBusy ? 'Processing…' : `Pay $${eventPrice(checkoutEvent).toFixed(2)} · Demo`}
                            </button>
                            </div>
                        </div>
                        )}
                    {paymentSuccess && (
                        <div className="checkout-overlay" onClick={() => setPaymentSuccess(null)}>
                            <div className="checkout-modal" role="dialog" aria-modal="true"
                                aria-labelledby="demo-payment-success-title" onClick={(e) => e.stopPropagation()}>
                                <button type="button" className="checkout-close" aria-label="Close payment success"
                                    onClick={() => setPaymentSuccess(null)}>✕</button>
                                <div role="status" style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: '#eeebf8', color: '#7567df', display: 'grid', placeItems: 'center', fontSize: 36 }}>✓</div>
                                    <h2 id="demo-payment-success-title">Payment successful</h2>
                                    <p>Your demo payment for <strong>{paymentSuccess.title}</strong> is complete.</p>
                                    <strong style={{ color: '#7567df', fontSize: 26 }}>${eventPrice(paymentSuccess).toFixed(2)}</strong>
                                    <p>Registration saved. No money was charged.</p>
                                    <small>Simulated payment only. Backend payment confirmation remains unchanged.</small>
                                </div>
                                <button type="button" className="checkout-pay-button" onClick={() => {
                                    const event = paymentSuccess
                                    setPaymentSuccess(null)
                                    void openDetails(event)
                                }}>View registration</button>
                            </div>
                        </div>
                    )}
                    {formOpen && (
                        <div
                            className="checkout-overlay"
                            onClick={() => setFormOpen(false)}
                        >
                            <form
                            className="checkout-modal event-form"
                            onClick={(e) => e.stopPropagation()}
                            onSubmit={submitForm}
                            >
                            <button
                                type="button"
                                className="checkout-close"
                                onClick={() => setFormOpen(false)}
                            >
                                ✕
                            </button>

                            <div className="checkout-heading">
                                <span>🗓️ {editingEventId === null ? 'Host an Event' : 'Edit Event'}</span>
                                <h2>{editingEventId === null ? 'Create Event' : 'Update Event'}</h2>
                            </div>

                            <label className="event-form-full">
                                Title
                                <input value={form.title} onChange={(e) => updateForm('title', e.target.value)} maxLength={200} required />
                            </label>

                            <label>
                                Category
                                <input value={form.category} onChange={(e) => updateForm('category', e.target.value)} placeholder="e.g. Photography" maxLength={100} required />
                            </label>

                            <label>
                                City
                                <input value={form.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="e.g. Adelaide or Online" maxLength={100} required />
                            </label>

                            <label className="event-form-full">
                                Venue
                                <input value={form.venue} onChange={(e) => updateForm('venue', e.target.value)} placeholder="Address, room or meeting link" maxLength={500} />
                            </label>

                            <label>
                                Starts
                                <input type="datetime-local" value={form.startDateTime} onChange={(e) => updateForm('startDateTime', e.target.value)} required />
                            </label>

                            <label>
                                Ends
                                <input type="datetime-local" value={form.endDateTime} onChange={(e) => updateForm('endDateTime', e.target.value)} required />
                            </label>

                            <label>
                                Type
                                <select value={form.eventType} onChange={(e) => updateForm('eventType', e.target.value as EventType)}>
                                    <option value="FREE">Free</option>
                                    <option value="PAID">Paid</option>
                                </select>
                            </label>

                            <label>
                                Capacity
                                <input type="number" min={1} value={form.capacity} onChange={(e) => updateForm('capacity', e.target.value)} required />
                            </label>

                            {form.eventType === 'PAID' && (
                                <label>
                                    Price ($)
                                    <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => updateForm('price', e.target.value)} required />
                                </label>
                            )}

                            <label className="event-form-full">
                                Description
                                <textarea rows={4} value={form.description} onChange={(e) => updateForm('description', e.target.value)} maxLength={2000} />
                            </label>
                            <label className="event-form-full">
    Event Image (Optional)
    <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
            const file = e.target.files?.[0] ?? null

            if (file && file.size > 5 * 1024 * 1024) {
                setFormError('Event image must be 5 MB or smaller.')
                e.target.value = ''
                setSelectedImage(null)
                return
            }

            setSelectedImage(file)
            setFormError('')
        }}
    />
    <small>
        Upload a JPG, PNG or WebP image (maximum 5 MB).
    </small>
</label>

                            <label className="event-form-full event-form-check">
                                <input type="checkbox" checked={form.publishNow} onChange={(e) => updateForm('publishNow', e.target.checked)} />
                                Publish so others can register (otherwise saved as draft)
                            </label>

                            {formError && (
                                <p className="event-action-error event-form-full">{formError}</p>
                            )}

                            <button type="submit" className="checkout-pay-button event-form-full" disabled={actionBusy}>
                                {actionBusy ? 'Saving…' : editingEventId === null ? 'Create Event' : 'Save Changes'}
                            </button>
                            </form>
                        </div>
                        )}
      </main>
    </div>
  )
}

export default Events
