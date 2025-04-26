import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { collection, addDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-toastify'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { themes, Theme } from '../config/themes'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().min(1, 'Location is required'),
  agenda: z.array(z.string()).min(1, 'At least one agenda item is required'),
  customQuestions: z.array(z.string()),
  theme: z.string().min(1, 'Theme is required'),
})

type EventFormData = z.infer<typeof eventSchema>

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme>(themes[0])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      agenda: [''],
      customQuestions: [''],
      theme: 'modern',
    },
  })

  // @ts-ignore
  const { fields: agendaFields, append: appendAgenda, remove: removeAgenda } = useFieldArray({control,name: 'agenda',
  })

  // @ts-ignore
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({control,name: 'customQuestions',
  })

  const onSubmit = async (data: EventFormData) => {
    if (!user) return
    setUploading(true)

    try {
      let coverImageUrl = ''
      if (coverImage) {
        const storageRef = ref(storage, `events/${Date.now()}_${coverImage.name}`)
        await uploadBytes(storageRef, coverImage)
        coverImageUrl = await getDownloadURL(storageRef)
      }

      const eventData = {
        ...data,
        hostId: user.uid,
        coverImage: coverImageUrl,
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, 'events'), eventData)
      toast.success('Event created successfully!')
      navigate(`/dashboard/events/${docRef.id}`)
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Create New Event
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="form-label">
              Event Title
            </label>
            <input
              type="text"
              id="title"
              {...register('title')}
              className="input-field"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="input-field"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="startDate" className="form-label">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              id="startDate"
              {...register('startDate')}
              className="input-field"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="endDate" className="form-label">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              id="endDate"
              {...register('endDate')}
              className="input-field"
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="form-label">
              Location
            </label>
            <input
              type="text"
              id="location"
              {...register('location')}
              className="input-field"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="theme" className="form-label">
              Event Theme
            </label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    selectedTheme.id === theme.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => {
                    setSelectedTheme(theme)
                    register('theme').onChange({ target: { value: theme.id } })
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{theme.name}</h3>
                      <p className="text-sm text-gray-500">{theme.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {errors.theme && (
              <p className="mt-1 text-sm text-red-600">{errors.theme.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Agenda Items</label>
            <div className="space-y-2">
              {agendaFields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    {...register(`agenda.${index}`)}
                    className="input-field flex-1"
                    placeholder={`Agenda item ${index + 1}`}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeAgenda(index)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendAgenda('')}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Agenda Item
              </button>
            </div>
            {errors.agenda && (
              <p className="mt-1 text-sm text-red-600">{errors.agenda.message}</p>
            )}
          </div>

          <div>
            <label className="form-label">Custom Registration Questions (Optional)</label>
            <div className="space-y-2">
              {questionFields.map((field, index) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    {...register(`customQuestions.${index}`)}
                    className="input-field flex-1"
                    placeholder={`Custom question ${index + 1}`}
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendQuestion('')}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add Custom Question
              </button>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={uploading}
            className="w-full btn-primary"
          >
            {uploading ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  )
} 