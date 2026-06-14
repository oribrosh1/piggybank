'use client'

const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME || 'creditkidapp'

/**
 * Stripe Connect onboarding return_url (HTTPS).
 * With Expo `WebBrowser.openAuthSessionAsync`, the in-app auth session dismisses when
 * navigation completes to this URL (matching the redirect parameter) — no custom-scheme
 * redirect is required for the sheet to close.
 */
export default function BankingSetupSuccessPage() {
  const appDeepLink = `${APP_SCHEME}://banking/setup/success`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Banking setup complete</h1>
        <p className="text-gray-600 text-sm mb-6">
          Return to the CreditKid app. This window should close on its own.
        </p>
        <p className="text-gray-500 text-xs">
          If you&apos;re not returned to the app,{' '}
          <a href={appDeepLink} className="text-purple-600 font-medium underline">
            open CreditKid
          </a>
          .
        </p>
      </div>
    </div>
  )
}
