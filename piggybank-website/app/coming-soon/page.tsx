'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Bell, Check } from 'lucide-react'
import { CreditKidLogo } from '@/components/CreditKidLogo'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
        return
      }

      setStatus('success')
      setEmail('')
      setMessage('You\'re on the list! We\'ll notify you when CreditKid launches.')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-[#EAE3FC] text-[#1a1d2e] flex flex-col">
      <header className="w-[min(1200px,92%)] mx-auto pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#6b38d4] font-semibold no-underline hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-[4%] py-12">
        <div className="w-full max-w-lg text-center">
          <div className="flex items-center justify-center mb-8">
            <CreditKidLogo height={44} />
          </div>

          <div className="inline-flex items-center gap-2 bg-white/70 text-[#6b38d4] text-sm font-bold px-4 py-2 rounded-full mb-6">
            <Bell size={16} />
            Coming July 2026
          </div>

          <h1 className="text-[clamp(32px,6vw,48px)] font-extrabold tracking-[-1.5px] m-0 mb-4 leading-tight">
            The app is almost here
          </h1>

          <p className="text-[17px] leading-relaxed text-[#5c6178] m-0 mb-10 max-w-md mx-auto">
            CreditKid launches in <strong className="text-[#1a1d2e]">July 2026</strong>.
            Subscribe to get notified the moment the app is available on the App Store.
          </p>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_20px_60px_#31205d14] text-left"
          >
            <label htmlFor="notify-email" className="block text-sm font-semibold text-[#3d4258] mb-2">
              Email address
            </label>
            <input
              id="notify-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[#e5e0f5] focus:ring-2 focus:ring-[#6b38d4] focus:border-transparent mb-4"
              autoComplete="email"
              required
              disabled={status === 'loading' || status === 'success'}
            />

            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="w-full flex items-center justify-center gap-2 bg-[#6b38d4] text-white font-bold py-3.5 rounded-xl hover:bg-[#5f32c0] transition-colors disabled:opacity-70"
            >
              {status === 'loading' ? 'Subscribing…' : status === 'success' ? (
                <>
                  <Check size={18} />
                  Subscribed
                </>
              ) : (
                'Notify me at launch'
              )}
            </button>

            {message && (
              <p className={`text-sm mt-4 mb-0 ${status === 'error' ? 'text-red-600' : 'text-[#6b38d4]'}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}
