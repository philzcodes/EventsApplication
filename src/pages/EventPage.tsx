import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'

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
}

export default function EventPage() {
  const { eventSlug } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventSlug!))
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event)
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
          <h1 className="text-4xl font-bold text-gray-900">Event Not Found</h1>
          <p className="mt-4 text-gray-600">The event you're looking for doesn't exist.</p>
          <Link to="/" className="mt-6 btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src={event.coverImage}
            alt={event.title}
          />
          <div className="absolute inset-0 bg-gray-900 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {event.title}
          </h1>
          <p className="mt-6 text-xl text-white max-w-3xl">
            {event.description}
          </p>
        </div>
      </div>

      {/* Event details */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
            <dl className="mt-6 space-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(event.startDate), 'MMMM d, yyyy')} at{' '}
                  {format(new Date(event.startDate), 'h:mm a')} -{' '}
                  {format(new Date(event.endDate), 'h:mm a')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{event.location}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-8 lg:mt-0">
            <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
            <ul className="mt-6 space-y-4">
              {event.agenda.map((item, index) => (
                <li key={index} className="flex">
                  <span className="flex-shrink-0 h-6 w-6 text-primary-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="ml-3 text-gray-900">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Registration CTA */}
        <div className="mt-16 text-center">
          <Link
            to={`/register/${eventSlug}`}
            className="btn-primary"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  )
} 