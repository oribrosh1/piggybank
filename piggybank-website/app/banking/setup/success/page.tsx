'use client'

import { useEffect, useState } from 'react'

const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME || 'creditkidapp'

/**
 * Stripe Connect onboarding return_url lands here (HTTPS).
 * Redirect to the mobile app so the user returns to the app after completing onboarding.
 */
export default function BankingSetupSuccessPage() {
  const [status, setStatus] = useState<'redirecting' | 'fallback'>('redirecting')

  useEffect(() => {
    const appUrl = `${APP_SCHEME}://banking/setup/success`
    window.location.href = appUrl
    const t = setTimeout(() => setStatus('fallback'), 2500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-4">🐷</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {status === 'redirecting' ? 'Returning to CreditKid…' : 'Open the app'}
        </h1>
        <p className="text-gray-600 text-sm">
          {status === 'redirecting'
            ? 'You should be redirected to the app in a moment.'
            : "If the app didn't open, tap the CreditKid app on your device to continue."}
        </p>
      </div>
    </div>
  )
}
