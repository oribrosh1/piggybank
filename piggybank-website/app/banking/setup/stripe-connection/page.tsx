'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME || 'creditkidapp'

function RedirectContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'redirecting' | 'fallback'>('redirecting')

  useEffect(() => {
    const query = searchParams.toString()
    const path = query ? `banking/setup/stripe-connection?${query}` : 'banking/setup/stripe-connection'
    const appUrl = `${APP_SCHEME}://${path}`
    window.location.href = appUrl
    const t = setTimeout(() => setStatus('fallback'), 2500)
    return () => clearTimeout(t)
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🐷</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {status === 'redirecting' ? 'Returning to CreditKid…' : 'Open the app'}
        </h1>
        <p className="text-gray-600 text-sm">
          {status === 'redirecting'
            ? 'You should be redirected to the app to continue setup.'
            : "If the app didn't open, tap the CreditKid app to get a new verification link."}
        </p>
      </div>
    </div>
  )
}

/**
 * Stripe Connect onboarding refresh_url lands here (HTTPS) when the user needs a new link.
 * Redirect to the mobile app so they can request a new onboarding link.
 */
export default function BankingSetupStripeConnectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm w-full text-center">
          <div className="text-6xl mb-4">🐷</div>
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    }>
      <RedirectContent />
    </Suspense>
  )
}
