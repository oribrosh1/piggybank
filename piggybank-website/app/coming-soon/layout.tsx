import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Coming Soon',
  description: 'CreditKid launches in July 2026. Subscribe to get notified when the app is available.',
  path: '/coming-soon',
})

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return children
}
