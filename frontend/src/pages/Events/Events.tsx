import { useEffect, useState, type FormEvent } from 'react'
import './Events.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'
import {
  cancelRegistration,
  createEvent,
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

function registrationLabel(registration: EventRegistrationResponse): string {
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
    const [actionError, setActionError] = useState('')
    const [actionBusy, setActionBusy] = useState(false)
    const [attendees, setAttendees] = useState<EventRegistrationResponse[] | null>(null)
    const [formOpen, setFormOpen] = useState(false)
    const [editingEventId, setEditingEventId] = useState<number | null>(null)
    const [form, setForm] = useState<EventFormState>(emptyForm)
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

    const handleCancelRegistration = (event: EventResponse) => runAction(async () => {
        const registration = registrations[event.id]
        if (!registration) return
        await cancelRegistration(registration.id)
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
                if (form.publishNow) await publishEvent(created.id)
            } else {
                await updateEvent(editingEventId, {
                    ...request,
                    ...(form.publishNow ? { status: 'PUBLISHED' as const } : {})
                })
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
                            <span className="event-card-icon">{eventIcon(event.category)}</span>

                            {registrations[event.id] && (
                                <span className="event-registered-badge">
                                    {registrationLabel(registrations[event.id])}
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
                            <span>{eventIcon(selectedEvent.category)}</span>

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
                                    {selectedRegistration.status === 'PENDING'
                                        ? '⏳ Registered • Payment pending confirmation'
                                        : '✓ Registered'}
                                </button>
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
                                            setCheckoutEvent(selectedEvent)
                                            setSelectedEvent(null)
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
                            onClick={() => setCheckoutEvent(null)}
                        >
                            <div
                            className="checkout-modal"
                            onClick={(e) => e.stopPropagation()}
                            >
                            <button
                                type="button"
                                className="checkout-close"
                                onClick={() => setCheckoutEvent(null)}
                            >
                                ✕
                            </button>

                            <div className="checkout-heading">
                                <span>🎟️ Event Registration</span>
                                <h2>Complete Registration</h2>
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

                            <div className="checkout-demo-notice">
                                <span>🔒</span>

                                <p>
                                Payment is simulated for this frontend prototype.
                                No real payment will be processed. Your registration
                                is saved as pending until payment is confirmed.
                                </p>
                            </div>

                            {actionError && (
                                <p className="event-action-error">{actionError}</p>
                            )}

                            <button
                                type="button"
                                className="checkout-pay-button"
                                disabled={actionBusy}
                                onClick={async () => {
                                    const event = checkoutEvent
                                    setActionBusy(true)
                                    setActionError('')
                                    try {
                                        const registration = await registerForEvent(event.id)
                                        setRegistrations((current) => ({ ...current, [event.id]: registration }))
                                        setCheckoutEvent(null)
                                    } catch (error) {
                                        setActionError(errorText(error, 'Unable to register for this event.'))
                                    } finally {
                                        setActionBusy(false)
                                    }
                                }}
                            >
                                {actionBusy ? 'Processing…' : `Simulate Payment • $${eventPrice(checkoutEvent)}`}
                            </button>
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
