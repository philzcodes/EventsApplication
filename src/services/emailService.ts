import sgMail from '@sendgrid/mail'
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

// Initialize SendGrid
sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY)

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxEmails: 100, // Maximum emails per day
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

interface EmailData {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
  trackingId?: string
}

interface EmailTracking {
  id: string
  emailId: string
  recipient: string
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced'
  timestamp: Timestamp
  userId: string
  metadata?: Record<string, any>
}

interface EmailStats {
  total: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
}

// Validate email address
const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email)
}

// Check rate limit
const checkRateLimit = async (userId: string): Promise<boolean> => {
  const now = Timestamp.now()
  const windowStart = new Date(now.toDate().getTime() - RATE_LIMIT.windowMs)

  const emailsQuery = query(
    collection(db, 'emailTracking'),
    where('userId', '==', userId),
    where('timestamp', '>=', windowStart)
  )

  const snapshot = await getDocs(emailsQuery)
  return snapshot.size < RATE_LIMIT.maxEmails
}

// Track email
const trackEmail = async (data: Omit<EmailTracking, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'emailTracking'), data)
  return docRef.id
}

// Send email with tracking
export const sendEmail = async (data: EmailData, userId: string): Promise<{ success: boolean; error?: any; trackingId?: string }> => {
  try {
    // Validate recipient emails
    const recipients = Array.isArray(data.to) ? data.to : [data.to]
    const invalidEmails = recipients.filter(email => !validateEmail(email))
    
    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`)
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(userId)
    if (!withinLimit) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    // Send email
    const response = await sgMail.send({
      to: data.to,
      from: data.from || import.meta.env.VITE_SENDGRID_FROM_EMAIL,
      subject: data.subject,
      text: data.text || '',
      html: data.html || '',
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
    })

    // Track the email
    const trackingId = await trackEmail({
      emailId: response[0].headers['x-message-id'],
      recipient: Array.isArray(data.to) ? data.to[0] : data.to,
      status: 'sent',
      timestamp: Timestamp.now(),
      userId,
    })

    return { success: true, trackingId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Email templates
export const emailTemplates = {
  // Welcome email template
  welcome: (name: string, eventTitle: string) => ({
    subject: `Welcome to ${eventTitle}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome, ${name}!</h1>
        <p>Thank you for registering for ${eventTitle}.</p>
        <p>We're excited to have you join us!</p>
      </div>
    `,
  }),

  // Reminder email template
  reminder: (eventData: {
    title: string
    startDate: string
    endDate: string
    location: string
  }) => ({
    subject: `Reminder: ${eventData.title} is coming up!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Event Reminder</h1>
        <p>Don't forget about ${eventData.title}!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date:</strong> ${new Date(eventData.startDate).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(eventData.startDate).toLocaleTimeString()} - ${new Date(eventData.endDate).toLocaleTimeString()}</p>
          <p><strong>Location:</strong> ${eventData.location}</p>
        </div>
      </div>
    `,
  }),

  // Update email template
  update: (eventData: {
    title: string
    changes: string[]
  }) => ({
    subject: `Update: ${eventData.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Event Update</h1>
        <p>There have been some updates to ${eventData.title}:</p>
        <ul>
          ${eventData.changes.map(change => `<li>${change}</li>`).join('')}
        </ul>
      </div>
    `,
  }),

  // Cancellation email template
  cancellation: (eventData: {
    title: string
    reason?: string
  }) => ({
    subject: `Cancelled: ${eventData.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Event Cancelled</h1>
        <p>We regret to inform you that ${eventData.title} has been cancelled.</p>
        ${eventData.reason ? `<p>Reason: ${eventData.reason}</p>` : ''}
        <p>We apologize for any inconvenience this may cause.</p>
      </div>
    `,
  }),

  // Survey email template
  survey: (eventData: {
    title: string
    surveyLink: string
  }) => ({
    subject: `Feedback Request: ${eventData.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Event Feedback</h1>
        <p>Thank you for attending ${eventData.title}!</p>
        <p>We would love to hear your thoughts about the event.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${eventData.surveyLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Take Survey
          </a>
        </div>
      </div>
    `,
  }),

  // Certificate email template
  certificate: (eventData: {
    title: string
    attendeeName: string
    certificateLink: string
  }) => ({
    subject: `Your Certificate: ${eventData.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Certificate of Participation</h1>
        <p>Dear ${eventData.attendeeName},</p>
        <p>Thank you for participating in ${eventData.title}.</p>
        <p>Your certificate is ready for download.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${eventData.certificateLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Download Certificate
          </a>
        </div>
      </div>
    `,
  }),
}

// Get email tracking statistics
export const getEmailStats = async (userId: string): Promise<EmailStats> => {
  const statsQuery = query(
    collection(db, 'emailTracking'),
    where('userId', '==', userId)
  )

  const snapshot = await getDocs(statsQuery)
  const stats: EmailStats = {
    total: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
  }

  snapshot.forEach(doc => {
    const data = doc.data() as EmailTracking
    stats.total++
    if (data.status in stats) {
      stats[data.status as keyof EmailStats]++
    }
  })

  return stats
} 