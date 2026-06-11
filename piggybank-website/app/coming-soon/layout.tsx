import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon — CreditKid',
  description: 'CreditKid launches in July 2026. Subscribe to get notified when the app is available.',
}

export default function ComingSoonLayout({ children }: { children: React.ReactNode }) {
  return children
}
