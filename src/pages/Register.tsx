import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { toast } from 'react-toastify'
import { format } from 'date-fns'
import { sendEmail, emailTemplates } from '../services/emailService'

interface Event {
  id: string
  title: string
  customQuestions?: string[]
  startDate: string
  endDate: string
  description: string
  location: string
  hostId: string
  notificationPreferences?: {
    enabled: boolean
    interval: number
    recipients?: string[]
  }
}

interface CalendarService {
  name: string
  url: string
  icon: string
}

const calendarServices: CalendarService[] = [
  {
    name: 'Google Calendar',
    url: 'https://calendar.google.com/calendar/render',
    icon: 'https://www.google.com/calendar/images/ext/gc_button1_en.gif',
  },
  {
    name: 'Outlook',
    url: 'https://outlook.live.com/calendar/0/deeplink/compose',
    icon: 'https://res.cdn.office.net/assets/mail/pwa/v1/pngs/apple-touch-icon.png',
  },
  {
    name: 'Apple Calendar',
    url: 'webcal://',
    icon: 'https://www.apple.com/v/calendar/a/images/overview/calendar__d8z1t5t5t5t5.png',
  },
]

const registrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
  }),
  company: z.string().min(1, 'Company/Affiliation is required'),
  customAnswers: z.record(z.string().optional()),
  notifyBefore: z.boolean().default(false),
})

type RegistrationFormData = z.infer<typeof registrationSchema>

export default function Register() {
  const { eventSlug } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
    defaultValues: {
      customAnswers: {},
      notifyBefore: false,
    },
  })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventSlug!))
        if (eventDoc.exists()) {
          const eventData = { id: eventDoc.id, ...eventDoc.data() } as Event
          setEvent(eventData)
          
          // Initialize custom answers if they exist
          if (eventData.customQuestions && eventData.customQuestions.length > 0) {
            const initialCustomAnswers = eventData.customQuestions.reduce((acc: any, _: any, index: number) => {
              acc[index] = ''
              return acc
            }, {})
            setValue('customAnswers', initialCustomAnswers)
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventSlug, setValue])

  const addToCalendar = (service: CalendarService) => {
    if (!event) return
    
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    
    let calendarUrl: URL = new URL(service.url)
    
    switch (service.name) {
      case 'Google Calendar':
        calendarUrl.searchParams.append('action', 'TEMPLATE')
        calendarUrl.searchParams.append('text', event.title)
        calendarUrl.searchParams.append('details', event.description)
        calendarUrl.searchParams.append('location', event.location)
        calendarUrl.searchParams.append('dates', `${format(startDate, 'yyyyMMdd\'T\'HHmmss')}/${format(endDate, 'yyyyMMdd\'T\'HHmmss')}`)
        break
        
      case 'Outlook':
        calendarUrl.searchParams.append('subject', event.title)
        calendarUrl.searchParams.append('body', event.description)
        calendarUrl.searchParams.append('location', event.location)
        calendarUrl.searchParams.append('startdt', format(startDate, 'yyyy-MM-dd\'T\'HH:mm:ss'))
        calendarUrl.searchParams.append('enddt', format(endDate, 'yyyy-MM-dd\'T\'HH:mm:ss'))
        break
        
      case 'Apple Calendar':
        // Create ICS file content
        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'BEGIN:VEVENT',
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${event.description}`,
          `LOCATION:${event.location}`,
          `DTSTART:${format(startDate, 'yyyyMMdd\'T\'HHmmss')}`,
          `DTEND:${format(endDate, 'yyyyMMdd\'T\'HHmmss')}`,
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\n')
        
        // Create blob and download
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${event.title}.ics`
        link.click()
        return
    }
    
    window.open(calendarUrl.toString(), '_blank')
  }

  const onSubmit = async (data: RegistrationFormData) => {
    if (!event) return
    setSubmitting(true)

    try {
      // Add registration
      const registrationData = {
        ...data,
        eventId: event.id,
        registeredAt: new Date().toISOString(),
      }
      const registrationRef = await addDoc(collection(db, 'registrations'), registrationData)

      // Get total registrations for this event
      const registrationsQuery = query(
        collection(db, 'registrations'),
        where('eventId', '==', event.id)
      )
      const registrationsSnapshot = await getDocs(registrationsQuery)
      const totalRegistrations = registrationsSnapshot.size

      // Check if we should notify the host
      if (event.notificationPreferences?.enabled && event.notificationPreferences?.interval) {
        if (totalRegistrations % event.notificationPreferences.interval === 0) {
          // Get host's email
         // const hostDoc = await getDoc(doc(db, 'users', event.hostId))
          //if (hostDoc.exists()) {
            //const hostData = hostDoc.data()
            //const hostEmail = hostData.email

            // Send notification email to all recipients
            const notificationRecipients = [
              //hostEmail,
              ...(event.notificationPreferences?.recipients || [])
            ].filter((email, index, self) => self.indexOf(email) === index) // Remove duplicates

            if (notificationRecipients.length > 0) {
              try{
              await sendEmail({
                to: notificationRecipients,
                subject: `New Registration: ${event.title}`,
                templateParams: {
                  to_email: notificationRecipients.join(', '),
                  name: 'Event Host',
                  subject: `New Registration: ${event.title}`,
                  message: `A new participant has registered for your event "${event.title}".`,
                  event_title: event.title,
                  start_date: format(new Date(event.startDate), 'MMMM d, yyyy'),
                  start_time: format(new Date(event.startDate), 'h:mm a'),
                  end_time: format(new Date(event.endDate), 'h:mm a'),
                  location: event.location,
                  change: `Registration Details:\nName: ${data.fullName}\nEmail: ${data.email}\nCompany: ${data.company}\nTotal Registrations: ${totalRegistrations}`
                }
              }, event.hostId)
            }
            catch(error){
              console.error('Error sending notification email:', error)
            }
            }
          //}
        }
      }

      // Send confirmation email to registrant
      const { subject, templateParams } = emailTemplates.welcome(data.fullName, event.title)
      await sendEmail({
        to: data.email,
        subject,
        templateParams
      }, event.hostId)

      toast.success('Registration successful!')
      navigate(`/event/${event.id}/confirmation`)
    } catch (error) {
      console.error('Error registering:', error)
      toast.error('Failed to register. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormSubmit = handleSubmit(
    (data) => {
      console.log('Form validation passed, submitting...')
      onSubmit(data)
    },
    (errors) => {
      console.log('Form validation failed:', errors)
      toast.error('Please fill in all required fields correctly')
    }
  )

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
          <h1 className="text-3xl font-extrabold text-gray-900">Register for {event.title}</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please fill out the form below to complete your registration.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                {...register('fullName')}
                className="input-field"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="input-field"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone')}
                className="input-field"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="company" className="form-label">
                Company/Affiliation
              </label>
              <input
                type="text"
                id="company"
                {...register('company')}
                className="input-field"
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Address</h3>
              <div>
                <label htmlFor="street" className="form-label">
                  Street Address
                </label>
                <input
                  type="text"
                  id="street"
                  {...register('address.street')}
                  className="input-field"
                />
                {errors.address?.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="form-label">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    {...register('address.city')}
                    className="input-field"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="form-label">
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    {...register('address.state')}
                    className="input-field"
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="postalCode" className="form-label">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  {...register('address.postalCode')}
                  className="input-field"
                />
                {errors.address?.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.postalCode.message}</p>
                )}
              </div>
            </div>

            {event.customQuestions?.map((question: string, index: number) => (
              <div key={index}>
                <label htmlFor={`custom-${index}`} className="form-label">
                  {question}
                </label>
                <input
                  type="text"
                  id={`custom-${index}`}
                  {...register(`customAnswers.${index}`)}
                  className="input-field"
                />
                {errors.customAnswers?.[index] && (
                  <p className="mt-1 text-sm text-red-600">{errors.customAnswers[index]?.message}</p>
                )}
              </div>
            ))}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyBefore"
                {...register('notifyBefore')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="notifyBefore" className="ml-2 block text-sm text-gray-900">
                Notify me before the event
              </label>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full btn-primary ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  'Register Now'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
} 