import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-toastify'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().min(1, 'Location is required'),
  agenda: z.array(z.string()).min(1, 'At least one agenda item is required'),
  customQuestions: z.array(z.string()),
  price: z.number().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

export default function EditEvent() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  })

  const { fields: agendaFields, append: appendAgenda, remove: removeAgenda } = useFieldArray({
    control,
    name: 'agenda' as const,
  })

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'customQuestions' as const,
  })

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId!))
        if (eventDoc.exists()) {
          const eventData = eventDoc.data()
          setValue('title', eventData.title)
          setValue('description', eventData.description)
          setValue('startDate', eventData.startDate)
          setValue('endDate', eventData.endDate)
          setValue('location', eventData.location)
          setValue('agenda', eventData.agenda || [''])
          setValue('customQuestions', eventData.customQuestions || [''])
          setValue('price', eventData.price)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
        toast.error('Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, setValue])

  const onSubmit = async (data: EventFormData) => {
    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'events', eventId!), {
        ...data,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Event updated successfully')
      navigate(`/dashboard/events/${eventId}`)
    } catch (error) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event')
    } finally {
      setSubmitting(false)
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
              Edit Event
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
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

              <div className="grid grid-cols-2 gap-4">
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
                <label htmlFor="price" className="form-label">
                  Price (optional)
                </label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
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
                <label className="form-label">Custom Questions (Optional)</label>
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
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/events/${eventId}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`btn-primary ${submitting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 