import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'FAQ',
  description: 'Frequently asked questions about CreditKid — birthday gifts, virtual debit cards, parent controls, and more.',
  path: '/faq',
})

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
