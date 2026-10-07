import { useState } from 'react'
import './Events.css'
import NavigationBar from '../../shared/NavigationBar/NavigationBar'

type EventsProps = {
  onHomeClick: () => void
  onProfileClick: () => void
  onEventsClick: () => void
}
type EventItem = {
  id: number
  title: string
  category: string
  date: string
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
  onEventsClick
}: EventsProps) {
    const [eventSearch, setEventSearch] = useState('')
    const [eventFilter, setEventFilter] = useState<'all' | 'in-person' | 'online'>('all')
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
    const [registeredEvents, setRegisteredEvents] = useState<number[]>([])
    const [checkoutEvent, setCheckoutEvent] = useState<EventItem | null>(null)
    const filteredEvents = eventData.filter((event) => {
        const matchesSearch = event.title.toLowerCase().includes(eventSearch.toLowerCase()) || 
                                event.category.toLowerCase().includes(eventSearch.toLowerCase()) || 
                                event.location.toLowerCase().includes(eventSearch.toLowerCase())
        const matchesFilter = eventFilter === 'all' || event.mode === eventFilter
        return matchesSearch && matchesFilter
    })
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
                onClick={() => setEventFilter('all')}
                >
                All Events
                </button>

                <button
                type="button"
                className={eventFilter === 'in-person' ? 'active' : ''}
                onClick={() => setEventFilter('in-person')}
                >
                📍 In-person
                </button>

                <button
                type="button"
                className={eventFilter === 'online' ? 'active' : ''}
                onClick={() => setEventFilter('online')}
                >
                💻 Online
                </button>
            </div>
            </section>
            <section className="events-results">
                <div className="events-results-heading">
                    <div>
                    <h2>Upcoming Events</h2>
                    <p>
                        {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} available
                    </p>
                    </div>
                </div>

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