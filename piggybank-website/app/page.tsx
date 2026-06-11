'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Menu,
  X,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { HOMEPAGE_FAQ_HIGHLIGHTS } from '@/lib/faqContent'

const IMAGES = {
  logo: '/images/creditkid-logo.png',
  heroDesktop: '/homepage/headerbg-desktop.png',
  heroMobile: '/homepage/headerbg-mobile2.png',
  features: '/homepage/features.png',
  cta: '/homepage/footer.png',
} as const

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how' },
  { label: 'Security', href: '#security' },
  { label: 'FAQ', href: '/faq' },
] as const

const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how' },
    { label: 'Get the App', href: '/coming-soon' },
    { label: 'FAQ', href: '/faq' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
} as const

function AppStoreButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      <Link
        href="/coming-soon"
        className="inline-flex items-center gap-2.5 bg-[#111] text-white rounded-xl px-5 py-3 no-underline hover:bg-[#222] transition-colors"
      >
        <span className="text-xl leading-none">{'\uF8FF'}</span>
        <span className="text-left leading-tight">
          <span className="block text-[10px] opacity-80">Download on the</span>
          <span className="block text-[15px] font-semibold">App Store</span>
        </span>
      </Link>
    </div>
  )
}

function HomepageFaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-[#ddd6f5] rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-transparent border-0 cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-[#1a1d2e] text-[15px] leading-snug">{question}</span>
        <ChevronDown
          size={20}
          className={`flex-shrink-0 text-[#6b38d4] transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-[15px] leading-relaxed text-[#5c6178]">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const { user, loading: authLoading, signIn, signOut } = useAuth()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      await signIn(loginEmail.trim(), loginPassword)
      setLoginOpen(false)
      setLoginEmail('')
      setLoginPassword('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setLoginError(message)
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#EAE3FC] text-[#1a1d2e]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 px-[4%] pt-4 pb-2">
        <nav className="relative w-full max-w-[1180px] mx-auto h-[64px] flex items-center justify-between gap-4 rounded-full bg-[#EAE3FC] border border-[#EAE3FC] px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <span className="text-[30px] font-extrabold text-[#6b38d4] tracking-[-0.5px]">
              CreditKid
            </span>
          </Link>

          <div className="hidden lg:flex items-center justify-center gap-7 absolute left-1/2 -translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[14px] font-semibold text-[#3d4258] hover:text-[#6b38d4] transition-colors no-underline whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-2 mr-1">
                  <span className="flex items-center gap-1.5 text-[#3d4258] font-medium text-sm max-w-[140px] truncate">
                    <User size={15} />
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-1 text-[#697084] hover:text-[#6b38d4] text-sm transition-colors"
                    aria-label="Log out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className="text-[#6b38d4] font-semibold text-sm px-2 hover:opacity-80 transition-opacity"
                >
                  Log in
                </button>
              )
            )}
            <Link
              href="/coming-soon"
              className="inline-flex items-center justify-center bg-[#6b38d4] text-white font-bold text-[14px] px-5 py-2.5 rounded-full no-underline shadow-[0_6px_20px_#6b38d438] hover:bg-[#5f32c0] transition-colors"
            >
              Get the App
            </Link>
          </div>

          <button
            className="lg:hidden p-2 rounded-full text-[#3d4258] hover:bg-[#EAE3FC] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden w-full max-w-[1180px] mx-auto mt-2 rounded-[24px] bg-[#EAE3FC] border border-[#ddd6f5] px-5 py-4">
            <div className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[#3d4258] font-semibold py-3 no-underline border-b border-[#ddd6f5] last:border-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-1">
                <Link
                  href="/coming-soon"
                  className="inline-flex items-center justify-center bg-[#6b38d4] text-white font-bold py-3 rounded-full no-underline"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get the App
                </Link>
                {!authLoading && (
                  user ? (
                    <div className="flex items-center justify-between py-2">
                      <span className="flex items-center gap-2 text-[#3d4258] font-medium text-sm truncate">
                        <User size={16} />
                        {user.email}
                      </span>
                      <button
                        onClick={() => { signOut(); setMobileMenuOpen(false); }}
                        className="flex items-center gap-1.5 text-[#697084] font-semibold text-sm"
                      >
                        <LogOut size={16} />
                        Log out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 text-[#6b38d4] font-semibold py-2"
                    >
                      <LogIn size={18} />
                      Log in
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="about" className="relative">
        <div className="absolute inset-0 hidden lg:block" aria-hidden>
          <Image
            src={IMAGES.heroDesktop}
            alt=""
            fill
            className="object-cover object-[center_right]"
            sizes="100vw"
            priority
          />
        </div>
        <div className="absolute inset-0 lg:hidden" aria-hidden>
          <Image
            src={IMAGES.heroMobile}
            alt=""
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        <div className="relative z-10 w-[min(1200px,92%)] mx-auto pt-2 pb-[360px] sm:pb-[480px] lg:pt-16 lg:pb-20 min-h-[640px] lg:min-h-[720px] flex items-start lg:items-center">
          <div className="max-w-[560px] mb-[7rem] lg:mb-[28rem]">
            <div className="inline-flex items-center bg-[#ede9fe] text-[#6b38d4] text-[13px] font-bold px-4 py-2 rounded-full mb-2">
              For Kids. For Parents. For the Future.
            </div>

            <h1 className="text-[clamp(40px,5.5vw,64px)] leading-[1.02] font-extrabold tracking-[-2px] m-0 mb-2 text-[#1a1d2e]">
              The New Standard for{' '}
              <span className="text-[#6b38d4]">Birthday Gifts</span>
            </h1>

            <p className="text-[17px] leading-[1.65] text-[#5c6178] m-0 mb-6 max-w-[500px]">
              Give your child a virtual debit card for his gifts they can use anywhere. No more unused gift cards sitting in drawers. Just real freedom.
            </p>

            <AppStoreButtons />
          </div>
        </div>
      </section>

      {/* Features — overlaps hero background */}
      <section id="features" className="relative z-20 w-[min(1200px,92%)] mx-auto -mt-24 sm:-mt-24 lg:-mt-0">
        <div className="relative w-full rounded-[28px] overflow-hidden shadow-[0_20px_60px_#31205d10]">
          <Image
            src={IMAGES.features}
            alt="The Modern Gift Wallet, Pay Everywhere with Apple Pay, and Safe Spending for your child"
            width={1536}
            height={1024}
            className="w-full h-auto scale-x-[1.05] scale-y-[1.1] origin-center"
          />
        </div>
      </section>

      {/* How it works + Security anchors */}
      <section id="how" className="sr-only" aria-hidden>
        How it works
      </section>
      <section id="security" className="sr-only" aria-hidden>
        Security
      </section>

      {/* FAQ highlights */}
      <section className="w-[min(1180px,92%)] mx-auto py-12 lg:py-16">
        <div className="text-center mb-8">
          <h2 className="text-[clamp(28px,4vw,40px)] font-extrabold tracking-[-1px] m-0 mb-3 text-[#1a1d2e]">
            Common questions
          </h2>
          <p className="text-[17px] text-[#5c6178] m-0 max-w-xl mx-auto">
            How cards, gifts, and fees work with CreditKid.
          </p>
        </div>

        <div className="max-w-[720px] mx-auto flex flex-col gap-3 mb-8">
          {HOMEPAGE_FAQ_HIGHLIGHTS.map((item, index) => (
            <HomepageFaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openFaqIndex === index}
              onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
            />
          ))}
        </div>

        <section id="start" className="mb-8">
          <Link
            href="/coming-soon"
            className="block relative w-full rounded-[28px] overflow-hidden bg-white shadow-[0_20px_60px_#31205d10] no-underline hover:opacity-95 transition-opacity cursor-pointer"
            aria-label="Coming soon — subscribe to get notified at launch"
          >
            <Image
              src={IMAGES.cta}
              alt="Start their financial journey the smart way — Create Event"
              width={1672}
              height={941}
              className="w-full h-auto scale-x-[1.05] scale-y-[1.1] origin-center"
            />
          </Link>
        </section>

        <div className="max-w-[720px] mx-auto rounded-[24px] border border-[#ddd6f5] bg-[#EAE3FC] p-6 sm:p-8">
          <h3 className="text-lg font-extrabold text-[#1a1d2e] m-0 mb-2">Fees at a glance</h3>
          <p className="text-sm text-[#5c6178] m-0 mb-5">
            Only 3% on gifts — compared to 15–20% hidden markup on many gift cards.
          </p>
          <div className="overflow-hidden rounded-xl border border-[#ddd6f5]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f5f1fd] text-left">
                  <th className="px-4 py-3 font-bold text-[#3d4258]">Guest pays</th>
                  <th className="px-4 py-3 font-bold text-[#3d4258]">Service fee (3%)</th>
                  <th className="px-4 py-3 font-bold text-[#3d4258]">Child receives</th>
                </tr>
              </thead>
              <tbody className="text-[#5c6178]">
                <tr className="border-t border-[#ddd6f5]">
                  <td className="px-4 py-3">$50.00</td>
                  <td className="px-4 py-3">$3</td>
                  <td className="px-4 py-3 font-semibold text-[#6b38d4]">$48.50</td>
                </tr>
                <tr className="border-t border-[#ddd6f5]">
                  <td className="px-4 py-3">$100.00</td>
                  <td className="px-4 py-3">$3.00</td>
                  <td className="px-4 py-3 font-semibold text-[#6b38d4]">$97.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/faq"
            className="inline-flex items-center justify-center text-[#6b38d4] font-bold text-sm no-underline hover:opacity-80 transition-opacity"
          >
            See all FAQs →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-[4%] pb-10 pt-4">
        <div className="w-full max-w-[1180px] mx-auto rounded-[32px] bg-[#EAE3FC] border border-[#ddd6f5] overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 p-8 lg:p-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2.5 no-underline mb-4">
                <span className="text-xl font-extrabold text-[#6b38d4]">CreditKid</span>
              </Link>
              <p className="text-sm leading-relaxed text-[#697084] m-0 max-w-[260px]">
                The new standard for birthday gifts. Built for kids. Loved by parents.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] m-0 mb-4">Product</h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-3">
                {FOOTER_LINKS.product.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm font-semibold text-[#3d4258] hover:text-[#6b38d4] no-underline transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] m-0 mb-4">Legal</h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-3">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm font-semibold text-[#3d4258] hover:text-[#6b38d4] no-underline transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9ca3af] m-0 mb-4">Contact</h3>
              <a
                href="mailto:support@credit-kid.com"
                className="text-sm font-semibold text-[#3d4258] hover:text-[#6b38d4] no-underline transition-colors"
              >
                support@credit-kid.com
              </a>
            </div>
          </div>

          <div className="border-t border-[#ddd6f5] px-8 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#697084]" />
              <span className="text-sm font-semibold text-[#697084]">Secured by</span>
              <Image
                src="/images/stripe-icon.png"
                alt="Stripe"
                width={52}
                height={26}
                className="h-[26px] w-auto"
              />
            </div>
            <p className="text-xs text-[#9ca3af] m-0 text-center sm:text-right">
              © {new Date().getFullYear()} CreditKid. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Login modal */}
      {loginOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setLoginOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Log in to CreditKid</h2>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg" onClick={() => setLoginOpen(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Use the same email and password as in the CreditKid app.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6b38d4] focus:border-transparent"
                  autoComplete="email"
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6b38d4] focus:border-transparent"
                  autoComplete="current-password"
                  required
                />
              </div>
              {loginError && (
                <p className="text-sm text-red-600">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#6b38d4] text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-70"
              >
                {loginLoading ? 'Signing in…' : (
                  <>
                    <LogIn size={18} />
                    Log in
                  </>
                )}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-4 text-center">
              New user? Sign up in the CreditKid app, then log in here with the same credentials.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
