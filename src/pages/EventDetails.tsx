import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { format } from 'date-fns'
import {
  CalendarIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'
import { sendEmail, emailTemplates, getEmailStats } from '../services/emailService'
import { useAuth } from '../hooks/useAuth'

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

interface Registration {
  id: string
  fullName: string
  email: string
  company: string
  registeredAt: string
  notifyBefore: boolean
}

export default function EventDetails() {
  const { user } = useAuth()
  const { eventId } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailStats, setEmailStats] = useState<any>(null)

  useEffect(() => {
    const fetchEventAndRegistrations = async () => {
      try {
        // Fetch event details
        const eventDoc = await getDoc(doc(db, 'events', eventId!))
        if (eventDoc.exists()) {
          setEvent({ id: eventDoc.id, ...eventDoc.data() } as Event)
        }

        // Fetch registrations
        const registrationsQuery = query(
          collection(db, 'registrations'),
          where('eventId', '==', eventId)
        )
        const registrationsSnapshot = await getDocs(registrationsQuery)
        const registrationsData = registrationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Registration[]
        setRegistrations(registrationsData)
      } catch (error) {
        console.error('Error fetching event details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEventAndRegistrations()
  }, [eventId])

  useEffect(() => {
    const fetchEmailStats = async () => {
      if (user) {
        const stats = await getEmailStats(user.uid)
        setEmailStats(stats)
      }
    }
    fetchEmailStats()
  }, [user])

  const handleSendBulkEmail = async () => {
    if (!emailSubject || !emailBody || !user) {
      toast.error('Please fill in both subject and body')
      return
    }

    setSendingEmail(true)
    try {
      const { success, error } = await sendEmail(
        {
          to: registrations.map(r => r.email),
          subject: emailSubject,
          html: emailTemplates.update({
            title: event!.title,
            changes: [emailBody],
          }).html,
        },
        user.uid
      )

      if (success) {
        toast.success('Emails sent successfully')
        setEmailSubject('')
        setEmailBody('')
        // Refresh email stats
        const stats = await getEmailStats(user.uid)
        setEmailStats(stats)
      } else {
        throw error
      }
    } catch (error) {
      console.error('Error sending bulk email:', error)
      toast.error('Failed to send emails')
    } finally {
      setSendingEmail(false)
    }
  }

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
          <Link to="/dashboard" className="mt-6 btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Event Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {event.title}
            </h2>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link
              to={`/dashboard/events/${eventId}/edit`}
              className="btn-secondary"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Event
            </Link>
            <button
              type="button"
              className="ml-3 btn-primary bg-red-600 hover:bg-red-700"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Event
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Event Information</h3>
            <dl className="mt-4 space-y-4">
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
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{event.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Event Link</dt>
                <dd className="mt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/e/${event.id}`}
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/e/${event.id}`)
                        toast.success('Event link copied to clipboard')
                      }}
                      className="btn-secondary"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Share this link with potential attendees
                  </p>
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900">Agenda</h3>
            <ul className="mt-4 space-y-4">
              {event.agenda.map((item, index) => (
                <li key={index} className="flex">
                  <span className="flex-shrink-0 h-6 w-6 text-primary-600">
                    <CalendarIcon className="h-6 w-6" />
                  </span>
                  <span className="ml-3 text-sm text-gray-900">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Email Stats */}
        {emailStats && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium text-gray-900">Email Statistics</h3>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Total Sent</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{emailStats.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Delivered</p>
                    <p className="mt-1 text-2xl font-semibold text-green-600">{emailStats.delivered}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Opened</p>
                    <p className="mt-1 text-2xl font-semibold text-blue-600">{emailStats.opened}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Clicked</p>
                    <p className="mt-1 text-2xl font-semibold text-purple-600">{emailStats.clicked}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Bounced</p>
                    <p className="mt-1 text-2xl font-semibold text-red-600">{emailStats.bounced}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Email Section */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Send Bulk Email</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {registrations.length} recipients
              </span>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="emailSubject" className="form-label">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="input-field"
                    placeholder="Enter email subject"
                  />
                </div>
                <div>
                  <label htmlFor="emailBody" className="form-label">
                    Message
                  </label>
                  <textarea
                    id="emailBody"
                    rows={4}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="input-field"
                    placeholder="Enter your message"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSendBulkEmail}
                    disabled={sendingEmail}
                    className="btn-primary"
                  >
                    {sendingEmail ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        Send to All Attendees
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registrations */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Registrations</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {registrations.length} attendees
              </span>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notifications
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {registration.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.company}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(registration.registeredAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {registration.notifyBefore ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Disabled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 