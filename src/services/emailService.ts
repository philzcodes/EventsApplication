import { collection, addDoc, query, where, getDocs, Timestamp, doc, getDoc, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import emailjs from '@emailjs/browser'

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
  templateId?: string
  templateParams?: Record<string, any>
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
    orderBy('timestamp', 'desc'),
    limit(RATE_LIMIT.maxEmails)
  )

  const snapshot = await getDocs(emailsQuery)
  const recentEmails = snapshot.docs.filter(doc => {
    const data = doc.data()
    return data.timestamp.toDate() >= windowStart
  })

  return recentEmails.length < RATE_LIMIT.maxEmails
}

// Track email
const trackEmail = async (data: Omit<EmailTracking, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'emailTracking'), data)
  return docRef.id
}

// Get user's EmailJS configuration
const getEmailJSConfig = async (userId: string): Promise<{ 
  publicKey: string; 
  templateId: string;
  serviceId: string;
}> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', userId))
    if (!settingsDoc.exists()) {
      throw new Error('User settings not found')
    }
    const settings = settingsDoc.data()
    if (!settings.emailjsPublicKey || !settings.emailjsTemplateId || !settings.emailjsServiceId) {
      throw new Error('EmailJS configuration not found')
    }
    return {
      publicKey: settings.emailjsPublicKey,
      templateId: settings.emailjsTemplateId,
      serviceId: settings.emailjsServiceId
    }
  } catch (error) {
    console.error('Error getting EmailJS configuration:', error)
    throw new Error('Failed to get EmailJS configuration. Please configure it in settings.')
  }
}

// Test email configuration
export const testEmailConfiguration = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const config = await getEmailJSConfig(userId)
    
    // Initialize EmailJS
    emailjs.init(config.publicKey)

    // Try to send a test email
    const result = await emailjs.send(
      'default_service', // You'll need to set this up in EmailJS
      config.templateId,
      {
        to_email: 'test@example.com',
        subject: 'Test Email',
        message: 'This is a test email to verify your EmailJS configuration.'
      }
    )

    if (result.status !== 200) {
      return { 
        success: false, 
        error: `API Error: ${result.text || 'Unknown error occurred'}`
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error testing email configuration:', error)
    return { 
      success: false, 
      error: error?.message || 'Failed to test email configuration'
    }
  }
}

// Send email with tracking
export const sendEmail = async (config: EmailData, userId: string): Promise<{ success: boolean; error?: any }> => {
  try {
    // Validate recipient emails and remove duplicates
    const recipients = Array.isArray(config.to) ? config.to : [config.to]
    const uniqueRecipients = [...new Set(recipients)]
    const invalidEmails = uniqueRecipients.filter(email => !validateEmail(email))
    
    if (invalidEmails.length > 0) {
      throw new Error(`Invalid email addresses: ${invalidEmails.join(', ')}`)
    }

    // Check rate limit
    const withinLimit = await checkRateLimit(userId)
    if (!withinLimit) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    // Get user's EmailJS configuration
    const emailjsConfig = await getEmailJSConfig(userId)
    
    // Initialize EmailJS
    emailjs.init(emailjsConfig.publicKey)

    // Send email to each recipient
    const sendPromises = uniqueRecipients.map(async (recipient) => {
      // Ensure recipient is a valid email
      if (!validateEmail(recipient)) {
        throw new Error(`Invalid email address: ${recipient}`)
      }

      // Ensure we have content to send
      const messageContent = config.html || config.text || 'This is an automated message from the Events Application.'
      const subjectContent = config.subject || 'Event Notification'

      const templateParams = {
        to_email: recipient,
        name: recipient.split('@')[0],
        subject: subjectContent,
        message: messageContent,
        ...config.templateParams
      }

      // Debug log
      console.log('Sending email with params:', {
        serviceId: emailjsConfig.serviceId,
        templateId: config.templateId || emailjsConfig.templateId,
        templateParams
      })

      try {
        const result = await emailjs.send(
          emailjsConfig.serviceId,
          config.templateId || emailjsConfig.templateId,
          templateParams
        )

        if (result.status !== 200) {
          throw new Error(`Failed to send email to ${recipient}: ${result.text}`)
        }

        return result
      } catch (error: any) {
        console.error('EmailJS error details:', {
          error,
          recipient,
          templateParams,
          config: {
            serviceId: emailjsConfig.serviceId,
            templateId: config.templateId || emailjsConfig.templateId
          }
        })
        throw error
      }
    })

    const results = await Promise.all(sendPromises)

    // Track the email
    await trackEmail({
      emailId: results[0].text,
      recipient: uniqueRecipients.join(','),
      status: 'sent',
      timestamp: Timestamp.now(),
      userId,
      metadata: {
        subject: config.subject,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return { 
      success: false, 
      error: error?.message || 'An unexpected error occurred while sending emails'
    }
  }
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

// Email templates
export const emailTemplates = {
  // Welcome email template
  welcome: (name: string, eventTitle: string) => ({
    subject: `Welcome to ${eventTitle}!`,
    templateParams: {
      name,
      event_title: eventTitle,
      message: `Welcome to ${eventTitle}! We're excited to have you join us.`
    }
  }),

  // Reminder email template
  reminder: (eventData: {
    title: string
    startDate: string
    endDate: string
    location: string
  }) => ({
    subject: `Reminder: ${eventData.title} is coming up!`,
    templateParams: {
      event_title: eventData.title,
      start_date: new Date(eventData.startDate).toLocaleDateString(),
      start_time: new Date(eventData.startDate).toLocaleTimeString(),
      end_time: new Date(eventData.endDate).toLocaleTimeString(),
      location: eventData.location,
      message: `Don't forget about ${eventData.title}!`
    }
  }),

  // Update email template
  update: (eventData: {
    title: string
    changes: string[]
  }) => ({
    subject: `Update: ${eventData.title}`,
    templateParams: {
      event_title: eventData.title,
      changes: eventData.changes,
      message: `There have been some updates to ${eventData.title}.`
    }
  }),

  // Cancellation email template
  cancellation: (eventData: {
    title: string
    reason?: string
  }) => ({
    subject: `Cancelled: ${eventData.title}`,
    templateParams: {
      event_title: eventData.title,
      reason: eventData.reason,
      message: `We regret to inform you that ${eventData.title} has been cancelled.`
    }
  }),

  // Survey email template
  survey: (eventData: {
    title: string
    surveyLink: string
  }) => ({
    subject: `Feedback Request: ${eventData.title}`,
    templateParams: {
      event_title: eventData.title,
      survey_link: eventData.surveyLink,
      message: `Thank you for attending ${eventData.title}! We would love to hear your thoughts about the event.`
    }
  }),

  // Certificate email template
  certificate: (eventData: {
    title: string
    attendeeName: string
    certificateLink: string
  }) => ({
    subject: `Your Certificate: ${eventData.title}`,
    templateParams: {
      event_title: eventData.title,
      attendee_name: eventData.attendeeName,
      certificate_link: eventData.certificateLink,
      message: `Thank you for participating in ${eventData.title}. Your certificate is ready for download.`
    }
  }),
} 