'use client'

import { useState } from 'react'
import {
  Smartphone,
  CreditCard,
  Shield,
  Zap,
  Users,
  Gift,
  Check,
  ArrowRight,
  Star,
  TrendingUp,
  Lock,
  Bell,
  ChevronDown,
  Menu,
  X,
  Apple,
  Play
} from 'lucide-react'

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-white text-xl md:text-2xl">🐷</span>
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                CreditKid
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-purple-600 font-medium transition-colors">Pricing</a>
              <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-105">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-gray-600 font-medium py-2">Features</a>
              <a href="#how-it-works" className="text-gray-600 font-medium py-2">How it Works</a>
              <a href="#pricing" className="text-gray-600 font-medium py-2">Pricing</a>
              <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold w-full">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="animate-pulse">🎉</span>
              <span>The Future of Kids&apos; Gifting is Here</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
              The End of
              <span className="block gradient-text">Gift Cards</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Give your child a virtual debit card they can use <span className="font-semibold text-purple-600">anywhere</span>.
              No more unused gift cards sitting in drawers. Just real freedom.
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-10">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-red-500">$27B</div>
                <div className="text-sm text-gray-500">Gift cards unused</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-amber-500">43%</div>
                <div className="text-sm text-gray-500">Have unused cards</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-black text-green-500">100%</div>
                <div className="text-sm text-gray-500">Usable with CreditKid</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="group flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all hover:scale-105">
                <Apple size={24} />
                Download for iOS
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-center gap-3 bg-white text-gray-800 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
                <Play size={24} className="text-purple-600" />
                Watch Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Shield size={16} className="text-green-500" />
                Bank-level security
              </div>
              <div className="flex items-center gap-1">
                <Check size={16} className="text-green-500" />
                No credit check
              </div>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500" />
                4.9 App Store rating
              </div>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-[50px] blur-3xl opacity-30"></div>

              {/* Phone */}
              <div className="relative phone-mockup w-[280px] md:w-[320px]">
                <div className="phone-screen aspect-[9/19] flex flex-col">
                  {/* Status bar */}
                  <div className="h-12 bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                    <div className="w-20 h-6 bg-black rounded-full"></div>
                  </div>

                  {/* App content mockup */}
                  <div className="flex-1 p-4 bg-gradient-to-b from-purple-50 to-white">
                    {/* Balance Card */}
                    <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-3xl p-5 text-white shadow-xl mb-4">
                      <div className="text-sm opacity-80 mb-1">Total Balance</div>
                      <div className="text-3xl font-black mb-4">$247.50</div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm opacity-80">•••• 4821</div>
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg text-xs">
                          <Apple size={12} /> Pay
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {['Send', 'Request', 'History'].map((action) => (
                        <div key={action} className="bg-white rounded-2xl p-3 text-center shadow-sm">
                          <div className="text-xs text-gray-600">{action}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recent */}
                    <div className="text-sm font-semibold text-gray-700 mb-2">Recent</div>
                    <div className="space-y-2">
                      {[
                        { name: 'Birthday Gift', amount: '+$50', color: 'text-green-500' },
                        { name: 'Apple Store', amount: '-$12.99', color: 'text-gray-700' },
                      ].map((item, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                          <span className="text-sm text-gray-700">{item.name}</span>
                          <span className={`text-sm font-semibold ${item.color}`}>{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Gift Cards Are <span className="text-red-500">Broken</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              $27 billion in gift cards go unused every year. Here&apos;s why:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Problems */}
            <div className="bg-red-50 rounded-3xl p-8 border-2 border-red-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
                <h3 className="text-xl font-bold text-red-700">Traditional Gift Cards</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Only works at ONE store',
                  'Hidden 5-20% markup fees',
                  'Can expire or lose value',
                  'Often forgotten in drawers',
                  'What if they don\'t like that store?',
                ].map((problem, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center flex-shrink-0">
                      <X size={14} className="text-red-600" />
                    </div>
                    <span className="text-red-800">{problem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-bold text-green-700">CreditKid Card</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Use anywhere in the world',
                  'Only 3% transparent fee',
                  'Never expires',
                  'Apple Pay ready - always accessible',
                  'Real spending freedom',
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                      <Check size={14} className="text-green-600" />
                    </div>
                    <span className="text-green-800">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom stat */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-amber-100 text-amber-800 px-6 py-3 rounded-2xl">
              <span className="text-2xl">💡</span>
              <span className="font-semibold">$50 gift = $48.50 to spend anywhere vs. $50 locked to one store</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Zap size={16} />
              Powerful Features
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete solution for parents and kids to manage money together
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <CreditCard size={28} />,
                title: 'Virtual Debit Card',
                description: 'A real card that works with Apple Pay, online shopping, and anywhere cards are accepted.',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50',
              },
              {
                icon: <Shield size={28} />,
                title: 'Parental Controls',
                description: 'Set spending limits, block categories, and get instant notifications for every purchase.',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50',
              },
              {
                icon: <Gift size={28} />,
                title: 'Gift Collection',
                description: 'Create events and let guests send gifts directly to your child\'s card balance.',
                color: 'from-pink-500 to-pink-600',
                bgColor: 'bg-pink-50',
              },
              {
                icon: <TrendingUp size={28} />,
                title: 'Spending Insights',
                description: 'See where money goes with beautiful charts. Help kids learn to budget.',
                color: 'from-green-500 to-green-600',
                bgColor: 'bg-green-50',
              },
              {
                icon: <Bell size={28} />,
                title: 'Instant Alerts',
                description: 'Real-time notifications for every transaction. Stay in the loop, always.',
                color: 'from-amber-500 to-amber-600',
                bgColor: 'bg-amber-50',
              },
              {
                icon: <Lock size={28} />,
                title: 'Bank-Level Security',
                description: 'Encrypted data, biometric login, and instant card freeze if needed.',
                color: 'from-slate-600 to-slate-700',
                bgColor: 'bg-slate-50',
              },
            ].map((feature, i) => (
              <div key={i} className="feature-card group">
                <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <div className={`text-transparent bg-gradient-to-br ${feature.color} bg-clip-text`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in minutes, not days
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                emoji: '🎂',
                title: 'Create Event',
                description: 'Plan your child\'s birthday with AI-designed invitations',
                color: 'bg-amber-500',
              },
              {
                step: '2',
                emoji: '💳',
                title: 'Get Virtual Card',
                description: 'All gifts go to one card they can use anywhere',
                color: 'bg-purple-500',
              },
              {
                step: '3',
                emoji: '👨‍👩‍👧',
                title: 'Link Your Child',
                description: 'They download the app and connect securely',
                color: 'bg-blue-500',
              },
              {
                step: '4',
                emoji: '🛍️',
                title: 'Pay Anywhere',
                description: 'Apple Pay ready. Track every purchase live',
                color: 'bg-green-500',
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                {/* Connector line */}
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-300 to-transparent"></div>
                )}

                {/* Step circle */}
                <div className={`w-24 h-24 ${item.color} rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg relative`}>
                  <span className="text-4xl">{item.emoji}</span>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              Parents Love CreditKid
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Finally, no more $50 Target cards collecting dust! My daughter uses her CreditKid card everywhere.",
                author: "Sarah M.",
                role: "Mom of 2",
                avatar: "👩‍👧",
              },
              {
                quote: "The instant notifications are amazing. I know exactly where my son spends and can guide him.",
                author: "Michael R.",
                role: "Dad",
                avatar: "👨‍👦",
              },
              {
                quote: "Birthday party was so much easier. Guests just sent gifts to the card. No more unwanted toys!",
                author: "Jennifer L.",
                role: "Mom of 3",
                avatar: "👩‍👧‍👦",
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-100">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={18} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 rounded-[2.5rem] p-8 md:p-16 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                Ready to End Gift Cards?
              </h2>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of parents giving their kids real financial freedom.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group flex items-center justify-center gap-3 bg-white text-purple-600 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  <Apple size={24} />
                  Get Started Free
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <p className="text-white/60 text-sm mt-6">
                No credit card required • Free to download • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <span className="text-xl">🐷</span>
              </div>
              <span className="text-xl font-bold">CreditKid</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <div className="text-sm text-gray-400">
              © 2025 CreditKid. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

