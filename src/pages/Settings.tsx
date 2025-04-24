import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { toast } from 'react-toastify'

interface UserSettings {
  fullName: string
  email: string
  company: string
  phone: string
  notifications: {
    email: boolean
    sms: boolean
  }
}

export default function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    fullName: '',
    email: '',
    company: '',
    phone: '',
    notifications: {
      email: true,
      sms: false,
    },
  })

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setSettings({
              fullName: userData.fullName || '',
              email: userData.email || '',
              company: userData.company || '',
              phone: userData.phone || '',
              notifications: {
                email: userData.notifications?.email ?? true,
                sms: userData.notifications?.sms ?? false,
              },
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserSettings()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          fullName: settings.fullName,
          company: settings.company,
          phone: settings.phone,
          notifications: settings.notifications,
        })
        toast.success('Settings updated successfully!')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      const [parent, child] = name.split('.')
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserSettings] as Record<string, boolean>),
          [child]: checked,
        },
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value,
      }))
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
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Settings
            </h2>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update your profile information and preferences.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="form-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={settings.fullName}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={settings.email}
                      disabled
                      className="input-field bg-gray-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="form-label">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={settings.company}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={settings.phone}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifications.email"
                        name="notifications.email"
                        checked={settings.notifications.email}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifications.email" className="ml-2 block text-sm text-gray-900">
                        Email notifications
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="notifications.sms"
                        name="notifications.sms"
                        checked={settings.notifications.sms}
                        onChange={handleChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="notifications.sms" className="ml-2 block text-sm text-gray-900">
                        SMS notifications
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 