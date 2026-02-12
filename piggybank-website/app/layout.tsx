import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CreditKid - The End of Gift Cards | Smart Gifting for Kids',
  description: 'Give your child a virtual debit card they can use anywhere. No more unused gift cards sitting in drawers. Track spending, set limits, and teach financial responsibility.',
  keywords: 'creditkid, kids debit card, virtual card, gift cards alternative, children finance, Apple Pay kids',
  openGraph: {
    title: 'CreditKid - The End of Gift Cards',
    description: 'Give your child a virtual debit card they can use anywhere. No more unused gift cards.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

