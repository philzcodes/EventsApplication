import sgMail from '@sendgrid/mail'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

// Initialize SendGrid with your API key
sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY)

interface EmailData {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  from?: string
}

export const sendEmail = async (data: EmailData) => {
  try {
    const response = await sgMail.send({
      to: data.to,
      from: data.from || import.meta.env.VITE_SENDGRID_FROM_EMAIL,
      subject: data.subject,
      text: data.text || '',
      html: data.html || '',
    })
    return { success: true, response }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Template for event notification
export const sendEventNotification = async (
  to: string | string[],
  eventData: {
    title: string
    startDate: string
    endDate: string
    location: string
    description: string
  }
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">${eventData.title}</h1>
      <p>${eventData.description}</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Date:</strong> ${new Date(eventData.startDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date(eventData.startDate).toLocaleTimeString()} - ${new Date(eventData.endDate).toLocaleTimeString()}</p>
        <p><strong>Location:</strong> ${eventData.location}</p>
      </div>
      <p>We look forward to seeing you there!</p>
    </div>
  `

  return sendEmail({
    to,
    subject: `Event Reminder: ${eventData.title}`,
    html,
  })
}

// Template for bulk event emails
export const sendBulkEventEmail = async (
  recipients: string[],
  eventData: {
    title: string
    startDate: string
    endDate: string
    location: string
    description: string
  },
  subject: string,
  message: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">${subject}</h1>
      <p>${message}</p>
      <hr style="margin: 20px 0;" />
      <h2 style="color: #666;">Event Details</h2>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Event:</strong> ${eventData.title}</p>
        <p><strong>Date:</strong> ${new Date(eventData.startDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date(eventData.startDate).toLocaleTimeString()} - ${new Date(eventData.endDate).toLocaleTimeString()}</p>
        <p><strong>Location:</strong> ${eventData.location}</p>
      </div>
    </div>
  `

  return sendEmail({
    to: recipients,
    subject,
    html,
  })
} 