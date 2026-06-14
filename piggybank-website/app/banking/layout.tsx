import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Banking Setup',
  description: 'Complete your CreditKid banking setup and return to the app.',
  path: '/banking',
  robots: 'noindex, nofollow',
})

export default function BankingLayout({ children }: { children: React.ReactNode }) {
  return children
}
