export type EmailProvider = 'sendgrid' | 'emailjs'

interface EmailConfig {
  provider: EmailProvider
  sendgridApiKey?: string
  emailjsConfig?: {
    serviceId: string
    templateId: string
    userId: string
  }
}

export const emailConfig: EmailConfig = {
  provider: 'sendgrid', // Default provider
  sendgridApiKey: import.meta.env.VITE_SENDGRID_API_KEY,
  emailjsConfig: {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    userId: import.meta.env.VITE_EMAILJS_USER_ID,
  },
} 