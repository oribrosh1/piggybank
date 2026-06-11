import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The New Standard for Birthday Gifts',
  description: 'Give your child a virtual debit card for his gifts they can use anywhere. No more unused gift cards sitting in drawers. Just real freedom.',
  keywords: 'creditkid, birthday gift wallet, kids events, SMS invites, gift registry, parent controls, Apple Pay kids',
  openGraph: {
    title: 'The New Standard for Birthday Gifts',
    description: 'Give your child a virtual debit card for his gifts they can use anywhere. No more unused gift cards sitting in drawers. Just real freedom.',
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

