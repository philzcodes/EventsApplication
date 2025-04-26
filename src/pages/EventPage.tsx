import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'
import { themes, Theme } from '../config/themes'

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  coverImage: string
  agenda: string[]
  customQuestions: string[]
  hostId: string
  theme: string
}

export default function EventPage() {
  const { eventSlug } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme>(themes[0])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventSlug!))
        if (eventDoc.exists()) {
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event
          setEvent(eventData)
          const selectedTheme = themes.find(t => t.id === eventData.theme) || themes[0]
          setTheme(selectedTheme)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventSlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Event not found</h1>
          <p className="mt-2 text-gray-600">The event you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      {/* Hero Section */}
      <div
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: event.coverImage
            ? `url(${event.coverImage})`
            : `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: theme.fonts.heading }}
            >
              {event.title}
            </h1>
            <p className="text-xl">{event.description}</p>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div>
            <h2
              className="text-2xl font-bold mb-6"
              style={{ fontFamily: theme.fonts.heading }}
            >
              Event Details
            </h2>
            <dl className="space-y-6">
              <div>
                <dt className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                  Date & Time
                </dt>
                <dd className="mt-1">
                  {format(new Date(event.startDate), 'MMMM d, yyyy')} at{' '}
                  {format(new Date(event.startDate), 'h:mm a')} -{' '}
                  {format(new Date(event.endDate), 'h:mm a')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium" style={{ color: theme.colors.secondary }}>
                  Location
                </dt>
                <dd className="mt-1">{event.location}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-8 lg:mt-0">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ fontFamily: theme.fonts.heading }}
            >
              Agenda
            </h2>
            <ul className="space-y-4">
              {event.agenda.map((item, index) => (
                <li key={index} className="flex">
                  <span
                    className="flex-shrink-0 h-6 w-6"
                    style={{ color: theme.colors.primary }}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="ml-3">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Registration CTA */}
        <div className="mt-16 text-center">
          <Link
            to={`/register/${eventSlug}`}
            className="inline-block px-6 py-3 text-white font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.styles.borderRadius,
              boxShadow: theme.styles.boxShadow,
            }}
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  )
} 