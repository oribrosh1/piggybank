import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | CreditKid',
  description: 'Frequently asked questions about CreditKid — birthday gifts, virtual debit cards, parent controls, and more.',
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
