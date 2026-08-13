import React, { createContext, useContext, useState } from 'react'
import { INITIAL_BOOKING_TEMPLATES, type BookingTemplate } from './bookingTemplatesData'

interface BookingTemplateStore {
  templates: BookingTemplate[]
  addTemplate: (tmpl: BookingTemplate) => void
  updateTemplate: (tmpl: BookingTemplate) => void
  deleteTemplate: (id: string) => void
}

const BookingTemplateStoreContext = createContext<BookingTemplateStore | null>(null)

export function BookingTemplateStoreProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = useState<BookingTemplate[]>(INITIAL_BOOKING_TEMPLATES)

  const addTemplate = (tmpl: BookingTemplate) =>
    setTemplates((prev) => [...prev, tmpl])

  const updateTemplate = (tmpl: BookingTemplate) =>
    setTemplates((prev) => prev.map((t) => (t.id === tmpl.id ? tmpl : t)))

  const deleteTemplate = (id: string) =>
    setTemplates((prev) => prev.filter((t) => t.id !== id))

  return (
    <BookingTemplateStoreContext.Provider value={{ templates, addTemplate, updateTemplate, deleteTemplate }}>
      {children}
    </BookingTemplateStoreContext.Provider>
  )
}

export function useBookingTemplateStore(): BookingTemplateStore {
  const ctx = useContext(BookingTemplateStoreContext)
  if (!ctx) throw new Error('useBookingTemplateStore must be used inside BookingTemplateStoreProvider')
  return ctx
}
