import type { Metadata } from 'next'
import { ContactForm } from '@/components/marketing/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contacte l\'équipe Vizly · on répond sous 24 heures.',
}

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight">
          Contacte-nous
        </h1>
        <p className="mt-3 text-muted">
          Une question, un bug, une suggestion ? On répond sous 24 heures.
        </p>
      </div>
      <ContactForm />
    </div>
  )
}
