import { useState } from 'react'

import './Events.css'

import NavigationBar from '../../shared/NavigationBar/NavigationBar'

import {

  type CreateEventRequest,

  type EventType

} from '../../service/eventService'


type EventsProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onCollaborationClick: () => void
  onEventsClick: () => void
  onSettingsClick: () => void

  currentUserName?: string
  currentUsername?: string
  onLogoutClick?: () => void
}


type EventItem = {

  id: number

  title: string

  category: string

  date: string
  dateISO: string

  time: string

  location: string

  mode: 'in-person' | 'online'

  price: number

  description: string

  icon: string

}

const eventData: EventItem[] = [

  {

    id: 1,

    title: 'Creative Networking Meetup',

    category: 'Networking',

    date: '24 Sep',
    dateISO: '2026-09-24',

    time: '6:00 PM',

    location: 'Adelaide CBD',

    mode: 'in-person',

    price: 0,

    description:

      'Meet local creatives, exchange ideas and build new professional connections.',

    icon: '🤝'

  },

  {

    id: 2,

    title: 'Digital Art Workshop',

    category: 'Workshop',

    date: '10 Oct',
    dateISO: '2026-10-10',

    time: '7:00 PM',

    location: 'Online',

    mode: 'online',

    price: 15,

    description:

      'Explore digital illustration techniques in an interactive creative workshop.',

    icon: '🎨'

  },

  {

    id: 3,

    title: 'Adelaide Photography Walk',

    category: 'Photography',

    date: '18 Oct',
    dateISO: '2026-10-18',

    time: '4:30 PM',

    location: 'North Terrace, Adelaide',

    mode: 'in-person',

    price: 0,

    description:

      'Join photographers for an afternoon exploring Adelaide through the lens.',

    icon: '📷'

  },

  {

    id: 4,

    title: 'Music Production Masterclass',

    category: 'Music',

    date: '25 Oct',
    dateISO: '2026-10-25',

    time: '5:30 PM',

    location: 'Online',

    mode: 'online',

    price: 20,

    description:

      'Learn practical production techniques and creative workflows for modern music.',

    icon: '🎵'

  },

  {

    id: 5,

    title: 'Emerging Artists Exhibition',

    category: 'Exhibition',

    date: '2 Nov',
    dateISO: '2026-11-02',

    time: '11:00 AM',

    location: 'Adelaide, SA',

    mode: 'in-person',

    price: 0,

    description:

      'Discover work from emerging artists and connect with Adelaide’s creative community.',

    icon: '🖼️'

  },

  {

    id: 6,

    title: 'Creative Portfolio Workshop',

    category: 'Career',

    date: '8 Nov',
    dateISO: '2026-11-08',

    time: '6:30 PM',

    location: 'Online',

    mode: 'online',

    price: 10,

    description:

      'Learn how to present your creative work and build a stronger professional portfolio.',

    icon: '💼'

  }

]


function Events({
  onHomeClick,
  onProfileClick,
  onCollaborationClick,
  onEventsClick,
  onSettingsClick,
  currentUserName,
  currentUsername,
  onLogoutClick
}: EventsProps) {


    const [eventSearch, setEventSearch] = useState('')

    const [eventFilter, setEventFilter] = useState<'all' | 'free' | 'paid'>('all')

    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)

    const [registeredEvents, setRegisteredEvents] = useState<number[]>([])

    const [checkoutEvent, setCheckoutEvent] = useState<EventItem | null>(null)

    const [showCreateEvent, setShowCreateEvent] = useState(false)

    const [newEvent, setNewEvent] = useState<CreateEventRequest>({

    title: '',

    description: '',

    category: '',

    city: '',

    venue: '',

    startDateTime: '',

    endDateTime: '',

    eventType: 'FREE',

    capacity: 1,

    price: 0

    })

    const [createEventError, setCreateEventError] = useState('')
    const [dateFilter, setDateFilter] = useState('all')
    const [customDate, setCustomDate] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [sortBy, setSortBy] = useState('soonest')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const filteredEvents = eventData.filter((event) => {
        const matchesSearch = [event.title, event.category, event.location]
            .some((value) => value.toLowerCase().includes(eventSearch.toLowerCase()))
        const matchesPrice = eventFilter === 'all' ||
            (eventFilter === 'free' ? event.price === 0 : event.price > 0)
        const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter

        const eventDate = new Date(`${event.dateISO}T00:00:00`)
        const daysAway = Math.round((eventDate.getTime() - today.getTime()) / 86400000)
        const matchesDate = dateFilter === 'all' ||
            (dateFilter === 'next7' && daysAway >= 0 && daysAway <= 7) ||
            (dateFilter === 'next30' && daysAway >= 0 && daysAway <= 30) ||
            (dateFilter === 'custom' && customDate !== '' && event.dateISO === customDate)

        return matchesSearch && matchesPrice && matchesCategory && matchesDate
    }).sort((a, b) => {
        if (sortBy === 'priceLow') return a.price - b.price || a.dateISO.localeCompare(b.dateISO)
        if (sortBy === 'priceHigh') return b.price - a.price || a.dateISO.localeCompare(b.dateISO)
        if (sortBy === 'latest') return b.dateISO.localeCompare(a.dateISO)
        return a.dateISO.localeCompare(b.dateISO)
    })

    const resetFilters = () => {
        setEventSearch('')
        setEventFilter('all')
        setDateFilter('all')
        setCustomDate('')
        setCategoryFilter('all')
        setSortBy('soonest')
    }

    const handleFreeRegistration = (eventId: number) => {

        if (!registeredEvents.includes(eventId)) {

            setRegisteredEvents((currentEvents) => [

            ...currentEvents,

            eventId

            ])

        }

    }

  return (

    <div className="events-screen">

      
    <NavigationBar
    activePage="events"
    onHomeClick={onHomeClick}
    onProfileClick={onProfileClick}
    onCollaborationClick={onCollaborationClick}
    onEventsClick={onEventsClick}
    onSettingsClick={onSettingsClick}
    currentUserName={currentUserName}
    currentUsername={currentUsername}
    onLogoutClick={onLogoutClick}
    />


      <main className="events-page">

        <div className="events-discovery-panel">
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

                onClick={() => setEventFilter('all')}

                >

                All Events

                </button>

                <button

                type="button"

                className={eventFilter === 'free' ? 'active' : ''}

                onClick={() => setEventFilter('free')}

                >

                🎟️ Free Events

                </button>
                <button

                type="button"

                className={eventFilter === 'paid' ? 'active' : ''}

                onClick={() => setEventFilter('paid')}

                >

                💳 Paid Events

                </button>

            </div>

            <div className="events-advanced-filters">
              <label className="events-filter-field">
                <span>Date</span>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                  <option value="all">Any Date</option>
                  <option value="next7">Next 7 Days</option>
                  <option value="next30">Next 30 Days</option>
                  <option value="custom">Choose a Date</option>
                </select>
              </label>
              {dateFilter === 'custom' && (
                <label className="events-filter-field">
                  <span>Selected Date</span>
                  <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
                </label>
              )}
              <label className="events-filter-field">
                <span>Category</span>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {[...new Set(eventData.map((event) => event.category))].sort().map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label className="events-filter-field">
                <span>Sort By</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="soonest">Date: Earliest First</option>
                  <option value="latest">Date: Latest First</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                </select>
              </label>
              <button type="button" className="events-reset-filters" onClick={resetFilters}>
                ↺ Reset
              </button>
            </div>
            </section>
            <div className="events-header-connected">
            <div className="events-section-header">

                        <div className="events-section-info">

                            <div className="events-eyebrow">

                            <span className="events-sparkle">✦</span>

                            DISCOVER WHAT'S NEXT

                            </div>

                            <h2 className="events-section-title">

                            Upcoming Events <span>✦</span>

                            </h2>

                            <p className="events-section-description">

                            Explore workshops, creative experiences and networking

                            opportunities designed to inspire you.

                            </p>

                            <div className="events-header-badges">

                            <span className="events-count-badge">

                                 {filteredEvents.length} events available

                            </span>

                            <span className="events-inspiration-badge">

                                ✨ Find your inspiration

                            </span>

                            </div>

                        </div>

                        <button

                            type="button"

                            className="events-create-button-modern"

                            onClick={() => {

                            setCreateEventError('');

                            setShowCreateEvent(true);

                            }}

                        >

                            <span>+</span>

                            Create Event

                            <span>↗</span>

                        </button>

                        </div>
</div>
</div>

<section className="events-results">
{filteredEvents.length > 0 ? (

                    <div className="events-grid">

                    {filteredEvents.map((event) => (

                        <article className="event-card" key={event.id}>

                        <div className="event-card-visual">

                            <span className="event-card-icon">{event.icon}</span>

                            {registeredEvents.includes(event.id) && (

                                <span className="event-registered-badge">

                                    ✓ Registered

                                </span>

                            )}

                        </div>

                        <div className="event-card-content">

                            <div className="event-date">

                            {event.date} • {event.time}

                            </div>

                            <h3>{event.title}</h3>

                            <p className="event-description">

                            {event.description}

                            </p>

                            <div className="event-meta">

                            <span>

                                {event.mode === 'online' ? '💻' : '📍'}

                                {' '}

                                {event.location}

                            </span>

                            <strong className={event.price === 0 ? 'free' : ''}>

                                {event.price === 0 ? 'FREE' : `$${event.price}`}

                            </strong>

                            </div>

                            <button

                                type="button"

                                className="event-details-button"

                                onClick={() => setSelectedEvent(event)}

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

                    <p>Try changing your search or event filter.</p>

                    </div>

                )}

                </section>

                {showCreateEvent && (

                    <div

                        className="event-modal-overlay"

                        onClick={() => setShowCreateEvent(false)}

                    >

                        <div

                        className="event-modal"

                        onClick={(e) => e.stopPropagation()}

                        >

                        <button

                            type="button"

                            className="event-modal-close"

                            onClick={() => setShowCreateEvent(false)}

                        >

                            ✕

                        </button>

                        <div className="event-modal-visual">

                            <span>📅</span>

                            <div>

                            <small>Host an experience</small>

                            <h2>Create a New Event</h2>

                            </div>

                        </div>

                        <div className="event-modal-content">

                            <p className="event-modal-description">

                            Share your creativity, organise workshops,

                            and connect with professionals through events.

                            </p>

                            <form

                            className="create-event-form"

                            onSubmit={(e) => {

                                e.preventDefault()

                                setCreateEventError('')

                                if (new Date(newEvent.endDateTime) <= new Date(newEvent.startDateTime)) {

                                setCreateEventError('End date and time must be after the start date.')

                                return

                                }

                                if (new Date(newEvent.startDateTime) <= new Date()) {

                                setCreateEventError('Please choose a future start date and time.')

                                return

                                }

                                if (!Number.isInteger(newEvent.capacity) || newEvent.capacity < 1) {

                                setCreateEventError('Capacity must be a positive whole number.')

                                return

                                }

                                if (

                                newEvent.eventType === 'PAID' &&

                                (!Number.isFinite(newEvent.price) || newEvent.price <= 0)

                                ) {

                                setCreateEventError('Please enter a valid ticket price.')

                                return

                                }

                                setCreateEventError('');

                                alert(

                                '✅ Event details validated successfully!\n\n' +

                                'Your Create Event form is working correctly. ' +

                                'Event saving will be available once backend integration is complete.'

                                );

                            }}

                            >

                            <label>

                                Event Title *

                                <input

                                type="text"

                                required

                                value={newEvent.title}

                                onChange={(e) =>

                                    setNewEvent({ ...newEvent, title: e.target.value })

                                }

                                placeholder="Enter event title"

                                />

                            </label>

                            <label>

                                Event Description *

                                <textarea

                                required

                                rows={4}

                                value={newEvent.description}

                                onChange={(e) =>

                                    setNewEvent({ ...newEvent, description: e.target.value })

                                }

                                placeholder="Describe your event..."

                                />

                            </label>

                            <div className="create-event-row">

                                <label>

                                Category *

                                <select

                                    required

                                    value={newEvent.category}

                                    onChange={(e) =>

                                    setNewEvent({ ...newEvent, category: e.target.value })

                                    }

                                >

                                    <option value="">Select Category</option>

                                    <option value="Networking">Networking</option>

                                    <option value="Workshop">Workshop</option>

                                    <option value="Photography">Photography</option>

                                    <option value="Music">Music</option>

                                    <option value="Exhibition">Exhibition</option>

                                    <option value="Career">Career</option>

                                    <option value="Other">Other</option>

                                </select>

                                </label>

                                <label>

                                Capacity *

                                <input

                                    type="number"

                                    min="1"

                                    step="1"

                                    required

                                    value={newEvent.capacity}

                                    onChange={(e) =>

                                    setNewEvent({

                                        ...newEvent,

                                        capacity: Number(e.target.value)

                                    })

                                    }

                                />

                                </label>

                            </div>

                            <div className="create-event-row">

                                <label>

                                City *

                                <input

                                    type="text"

                                    required

                                    value={newEvent.city}

                                    onChange={(e) =>

                                    setNewEvent({ ...newEvent, city: e.target.value })

                                    }

                                    placeholder="Enter city"

                                />

                                </label>

                                <label>

                                Venue *

                                <input

                                    type="text"

                                    required

                                    value={newEvent.venue}

                                    onChange={(e) =>

                                    setNewEvent({ ...newEvent, venue: e.target.value })

                                    }

                                    placeholder="Enter venue"

                                />

                                </label>

                            </div>

                            <div className="create-event-row">

                                <label>

                                Start Date & Time *

                                <input

                                    type="datetime-local"

                                    required

                                    value={newEvent.startDateTime}

                                    onChange={(e) =>

                                    setNewEvent({ ...newEvent, startDateTime: e.target.value })

                                    }

                                />

                                </label>

                                <label>

                                End Date & Time *

                                <input

                                    type="datetime-local"

                                    required

                                    value={newEvent.endDateTime}

                                    onChange={(e) =>

                                    setNewEvent({ ...newEvent, endDateTime: e.target.value })

                                    }

                                />

                                </label>

                            </div>

                            <label>

                                Event Type *

                                <select

                                value={newEvent.eventType}

                                onChange={(e) =>

                                    setNewEvent({

                                    ...newEvent,

                                    eventType: e.target.value as EventType,

                                    price: 0

                                    })

                                }

                                >

                                <option value="FREE">Free Event</option>

                                <option value="PAID">Paid Event</option>

                                </select>

                            </label>

                            {newEvent.eventType === 'PAID' && (

                                <label>

                                Ticket Price (AUD) *

                                <input

                                    type="number"

                                    min="0.01"

                                    step="0.01"

                                    required

                                    value={newEvent.price}

                                    onChange={(e) =>

                                    setNewEvent({

                                        ...newEvent,

                                        price: Number(e.target.value)

                                    })

                                    }

                                />

                                </label>

                            )}

                            {createEventError && (

                                <p className="create-event-error" role="alert">

                                {createEventError}

                                </p>

                            )}

                            <div className="create-event-actions">

                                <button

                                type="button"

                                className="create-event-cancel"

                                onClick={() => setShowCreateEvent(false)}

                                >

                                Cancel

                                </button>

                                <button

                                type="submit"

                                className="create-event-submit"

                                >

                                + Create Event

                                </button>

                            </div>

                            </form>

                        </div>

                        </div>

                    </div>

                    )}

                {selectedEvent && (

                    <div className="event-modal-overlay"

                        onClick={() => setSelectedEvent(null)}>

                        <div

                        className="event-modal"

                        onClick={(e) => e.stopPropagation()}

                        >

                        <button

                            type="button"

                            className="event-modal-close"

                            onClick={() => setSelectedEvent(null)}

                        >

                            ✕

                        </button>

                        <div className="event-modal-visual">

                            <span>{selectedEvent.icon}</span>

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

                                <strong>{selectedEvent.date}</strong>

                            </div>

                            <div>

                                <span>🕒 Time</span>

                                <strong>{selectedEvent.time}</strong>

                            </div>

                            <div>

                                <span>

                                {selectedEvent.mode === 'online' ? '💻 Location' : '📍 Location'}

                                </span>

                                <strong>{selectedEvent.location}</strong>

                            </div>

                            <div>

                                <span>🎟️ Registration</span>

                                <strong>

                                {selectedEvent.price === 0

                                    ? 'Free Event'

                                    : `$${selectedEvent.price}`}

                                </strong>

                            </div>

                            </div>

                            <button

                                type="button"

                                className={`event-register-button ${

                                    registeredEvents.includes(selectedEvent.id)

                                    ? 'registered'

                                    : ''

                                }`}

                                onClick={() => {

                                    if (selectedEvent.price === 0) {

                                        handleFreeRegistration(selectedEvent.id)

                                    } else {

                                        setCheckoutEvent(selectedEvent)

                                        setSelectedEvent(null)

                                    }

                                }}

                                disabled={registeredEvents.includes(selectedEvent.id)}

                                >

                                {registeredEvents.includes(selectedEvent.id)

                                    ? '✓ Registered'

                                    : selectedEvent.price === 0

                                    ? 'Register for Free'

                                    : `Register & Pay $${selectedEvent.price}`}

                                </button>

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

                                    {checkoutEvent.date} • {checkoutEvent.time}

                                </strong>

                                </div>

                                <div>

                                <span>Location</span>

                                <strong>{checkoutEvent.location}</strong>

                                </div>

                            </div>

                            <div className="checkout-total">

                                <span>Total</span>

                                <strong>${checkoutEvent.price}</strong>

                            </div>

                            <div className="checkout-demo-notice">

                                <span>🔒</span>

                                <p>

                                Payment is simulated for this frontend prototype.

                                No real payment will be processed.

                                </p>

                            </div>

                            <button

                                type="button"

                                className="checkout-pay-button"

                                onClick={() => {

                                setRegisteredEvents((currentEvents) => [

                                    ...currentEvents,

                                    checkoutEvent.id

                                ])

                                setCheckoutEvent(null)

                                }}

                            >

                                Simulate Payment • ${checkoutEvent.price}

                            </button>

                            </div>

                        </div>

                        )}

      </main>

    </div>

  )

}

export default Events