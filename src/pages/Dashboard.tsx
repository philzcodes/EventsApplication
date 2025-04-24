import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import {
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

interface Event {
  id: string
  title: string
  startDate: string
  endDate: string
  registrations: number
  price?: number
}

interface DashboardMetrics {
  totalAttendees: number
  upcomingEvents: number
  totalRevenue: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalAttendees: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsQuery = query(
          collection(db, 'events'),
          where('hostId', '==', user?.uid)
        )
        const eventsSnapshot = await getDocs(eventsQuery)
        const eventsData = await Promise.all(
          eventsSnapshot.docs.map(async (doc) => {
            const registrationsQuery = query(
              collection(db, 'registrations'),
              where('eventId', '==', doc.id)
            )
            const registrationsSnapshot = await getDocs(registrationsQuery)
            return {
              id: doc.id,
              ...doc.data(),
              registrations: registrationsSnapshot.size,
            } as Event
          })
        )
        setEvents(eventsData)

        // Calculate metrics
        const totalAttendees = eventsData.reduce((sum, event) => sum + event.registrations, 0)
        const upcomingEvents = eventsData.filter(
          (event) => new Date(event.startDate) > new Date()
        ).length
        const totalRevenue = eventsData.reduce(
          (sum, event) => sum + (event.price || 0) * event.registrations,
          0
        )

        setMetrics({
          totalAttendees,
          upcomingEvents,
          totalRevenue,
        })
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchEvents()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            to="/dashboard/create"
            className="btn-primary"
          >
            Create Event
          </Link>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Attendees</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{metrics.totalAttendees}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{metrics.upcomingEvents}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      ${metrics.totalRevenue.toLocaleString()}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    <Link to={`/e/${event.id}`} className="hover:underline">
                      {event.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(event.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex-1">
                <dl className="grid grid-cols-1 gap-4">
                  <div className="flex items-center">
                    <dt className="flex items-center text-sm font-medium text-gray-500">
                      <UserGroupIcon className="mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                      Registrations
                    </dt>
                    <dd className="ml-2 text-sm text-gray-900">{event.registrations}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3">
              <div className="text-sm">
                <Link
                  to={`/dashboard/events/${event.id}`}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new event.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard/create"
              className="btn-primary"
            >
              Create Event
            </Link>
          </div>
        </div>
      )}
    </div>
  )
} 