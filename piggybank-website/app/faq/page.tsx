'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { FAQ_ITEMS } from '@/lib/faqContent'
import { CreditKidLogo } from '@/components/CreditKidLogo'

function FaqItem({
  question,
  answer,
  imageSrc,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  imageSrc?: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-[#ddd6f5] rounded-2xl bg-[#EAE3FC] overflow-hidden">
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
        <div className="px-5 pb-5">
          {imageSrc ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <Image
                src={imageSrc}
                alt=""
                width={480}
                height={480}
                className="w-full h-auto rounded-xl"
              />
              <p className="text-[15px] leading-relaxed text-[#5c6178] m-0">{answer}</p>
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed text-[#5c6178] m-0">{answer}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <main className="min-h-screen bg-[#EAE3FC] text-[#1a1d2e]">
      <header className="w-[min(1200px,92%)] mx-auto pt-8 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#6b38d4] font-semibold no-underline hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={18} />
          Back to home
        </Link>
      </header>

      <div className="w-[min(960px,92%)] mx-auto px-0 pb-16">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <CreditKidLogo height={40} />
          </div>
          <h1 className="text-[clamp(32px,5vw,44px)] font-extrabold tracking-[-1px] m-0 mt-6 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-[17px] text-[#5c6178] m-0">
            Everything you need to know about CreditKid.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              imageSrc={item.imageSrc}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="mt-10 text-center rounded-[24px] border border-[#ddd6f5] bg-[#EAE3FC] p-6">
          <p className="text-[#5c6178] m-0 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@credit-kid.com"
            className="inline-flex items-center justify-center bg-[#6b38d4] text-white font-bold px-6 py-3 rounded-full no-underline hover:bg-[#5f32c0] transition-colors"
          >
            Contact support
          </a>
        </div>
      </div>
    </main>
  )
}
