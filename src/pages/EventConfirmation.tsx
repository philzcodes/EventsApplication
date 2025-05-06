import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
}

export default function EventConfirmation() {
  const { eventId } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId!))
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
  }, [eventId])

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Registration Successful!</h1>
          <p className="mt-2 text-lg text-gray-600">
            Thank you for registering for {event.title}
          </p>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <CalendarIcon className="h-6 w-6 text-gray-400 mt-1" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Date & Time</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(event.startDate), 'MMMM d, yyyy')} at{' '}
                  {format(new Date(event.startDate), 'h:mm a')} -{' '}
                  {format(new Date(event.endDate), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPinIcon className="h-6 w-6 text-gray-400 mt-1" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Location</p>
                <p className="text-sm text-gray-500">{event.location}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            A confirmation email has been sent to your email address.
          </p>
          <div className="space-x-4">
            <Link to="/" className="btn-secondary">
              Go Home
            </Link>
            <Link to={`/e/${event.id}`} className="btn-primary">
              View Event Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 