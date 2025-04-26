import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import { EmailProvider } from '../config/emailConfig'

interface Settings {
  emailProvider: EmailProvider
  sendgridApiKey?: string
  emailjsConfig?: {
    serviceId: string
    templateId: string
    userId: string
  }
}

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    emailProvider: 'sendgrid',
    emailjsConfig: {
      serviceId: '',
      templateId: '',
      userId: '',
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return

      try {
        const settingsDoc = await getDoc(doc(db, 'settings', user.uid))
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as Settings)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    try {
      await updateDoc(doc(db, 'settings', user.uid), {
        emailProvider: settings.emailProvider,
        sendgridApiKey: settings.sendgridApiKey,
        emailjsConfig: settings.emailjsConfig,
      })
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Settings
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="form-label">Email Provider</label>
              <select
                value={settings.emailProvider}
                onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value as EmailProvider })}
                className="input-field"
              >
                <option value="sendgrid">SendGrid</option>
                <option value="emailjs">EmailJS</option>
              </select>
            </div>

            {settings.emailProvider === 'sendgrid' && (
              <div>
                <label className="form-label">SendGrid API Key</label>
                <input
                  type="password"
                  value={settings.sendgridApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, sendgridApiKey: e.target.value })}
                  className="input-field"
                  placeholder="Enter your SendGrid API key"
                />
              </div>
            )}

            {settings.emailProvider === 'emailjs' && (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Service ID</label>
                  <input
                    type="text"
                    value={settings.emailjsConfig?.serviceId || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailjsConfig: {
                        serviceId: e.target.value,
                        templateId: settings.emailjsConfig?.templateId || '',
                        userId: settings.emailjsConfig?.userId || '',
                      },
                    })}
                    className="input-field"
                    placeholder="Enter your EmailJS service ID"
                  />
                </div>

                <div>
                  <label className="form-label">Template ID</label>
                  <input
                    type="text"
                    value={settings.emailjsConfig?.templateId || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailjsConfig: {
                        serviceId: settings.emailjsConfig?.serviceId || '',
                        templateId: e.target.value,
                        userId: settings.emailjsConfig?.userId || '',
                      },
                    })}
                    className="input-field"
                    placeholder="Enter your EmailJS template ID"
                  />
                </div>

                <div>
                  <label className="form-label">User ID</label>
                  <input
                    type="text"
                    value={settings.emailjsConfig?.userId || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      emailjsConfig: {
                        serviceId: settings.emailjsConfig?.serviceId || '',
                        templateId: settings.emailjsConfig?.templateId || '',
                        userId: e.target.value,
                      },
                    })}
                    className="input-field"
                    placeholder="Enter your EmailJS user ID"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`btn-primary ${saving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 