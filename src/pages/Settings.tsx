import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'

interface Settings {
  emailjsPublicKey?: string
  emailjsTemplateId?: string
  emailjsServiceId?: string
}

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    emailjsPublicKey: '',
    emailjsTemplateId: '',
    emailjsServiceId: '',
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
      const settingsRef = doc(db, 'settings', user.uid)
      const settingsDoc = await getDoc(settingsRef)

      if (settingsDoc.exists()) {
        // Update existing document
        await updateDoc(settingsRef, {
          emailjsPublicKey: settings.emailjsPublicKey,
          emailjsTemplateId: settings.emailjsTemplateId,
          emailjsServiceId: settings.emailjsServiceId,
        })
      } else {
        // Create new document
        await setDoc(settingsRef, {
          emailjsPublicKey: settings.emailjsPublicKey,
          emailjsTemplateId: settings.emailjsTemplateId,
          emailjsServiceId: settings.emailjsServiceId,
        })
      }
      
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
            Email Settings
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <label className="form-label">EmailJS Public Key</label>
              <input
                type="password"
                value={settings.emailjsPublicKey || ''}
                onChange={(e) => setSettings({ ...settings, emailjsPublicKey: e.target.value })}
                className="input-field"
                placeholder="Enter your EmailJS public key"
              />
              <p className="mt-2 text-sm text-gray-500">
                Get your public key from{' '}
                <a
                  href="https://dashboard.emailjs.com/admin/account"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500"
                >
                  EmailJS Dashboard
                </a>
              </p>
            </div>

            <div>
              <label className="form-label">EmailJS Service ID</label>
              <input
                type="text"
                value={settings.emailjsServiceId || ''}
                onChange={(e) => setSettings({ ...settings, emailjsServiceId: e.target.value })}
                className="input-field"
                placeholder="Enter your EmailJS service ID"
              />
              <p className="mt-2 text-sm text-gray-500">
                This is the ID of your email service in EmailJS
              </p>
            </div>

            <div>
              <label className="form-label">EmailJS Template ID</label>
              <input
                type="text"
                value={settings.emailjsTemplateId || ''}
                onChange={(e) => setSettings({ ...settings, emailjsTemplateId: e.target.value })}
                className="input-field"
                placeholder="Enter your EmailJS template ID"
              />
              <p className="mt-2 text-sm text-gray-500">
                This is the ID of your email template in EmailJS
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Template Variables</h3>
              <p className="text-sm text-gray-500 mb-2">
                Make sure your EmailJS template includes these variables:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
                <li>to_email - Recipient's email address</li>
                <li>subject - Email subject</li>
                <li>message - Email content</li>
                <li>name - Recipient's name (for welcome emails)</li>
                <li>event_title - Event title</li>
                <li>start_date - Event start date</li>
                <li>start_time - Event start time</li>
                <li>end_time - Event end time</li>
                <li>location - Event location</li>
                <li>changes - Event changes (for update emails)</li>
                <li>reason - Cancellation reason (for cancellation emails)</li>
                <li>survey_link - Survey link (for survey emails)</li>
                <li>certificate_link - Certificate link (for certificate emails)</li>
                <li>attendee_name - Attendee's name (for certificate emails)</li>
              </ul>
            </div>
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