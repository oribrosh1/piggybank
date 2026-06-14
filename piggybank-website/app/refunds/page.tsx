import type { Metadata } from 'next'
import Link from 'next/link'
import {
  LEGAL_ADDRESS_LINE1,
  LEGAL_ADDRESS_LINE2,
  LEGAL_ENTITY,
  SUPPORT_EMAIL,
  WEBSITE_LABEL,
  WEBSITE_URL,
} from '@/lib/legal'
import { pageMetadata } from '@/lib/site'

export const metadata: Metadata = pageMetadata({
  title: 'Refund Policy',
  description: 'CreditKid Refund Policy — learn when and how gift payment refunds are handled.',
  path: '/refunds',
})

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-purple-700 font-semibold text-sm hover:underline mb-8 inline-block">
          ← Back to CreditKid
        </Link>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Refund Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: June 10, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed">
          <Section title="1. Overview">
            <p>
              This Refund Policy explains how refunds are handled for gift payments made through CreditKid
              (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), operated by {LEGAL_ENTITY}. CreditKid is a platform
              that allows guests to send monetary birthday gifts to a child&apos;s wallet through event pages.
            </p>
            <p>
              Payments are processed by <strong>Stripe, Inc.</strong> All refunds are subject to Stripe&apos;s
              processing rules and applicable law.
            </p>
          </Section>

          <Section title="2. General Policy">
            <p>
              <strong>Gift payments are generally final.</strong> When a guest sends a monetary gift through an
              event page, the payment is intended as a completed gift to the event host&apos;s child wallet. We do
              not offer refunds simply because a guest changed their mind after completing payment.
            </p>
            <p>
              CreditKid charges a <strong>3% platform service fee</strong> on gift payments at checkout. If a
              refund is approved, the refund amount and whether fees are returned depend on the circumstances
              described below and Stripe&apos;s refund processing.
            </p>
          </Section>

          <Section title="3. When Refunds May Be Issued">
            <p>We may approve a refund in the following situations:</p>
            <ul>
              <li><strong>Duplicate charge:</strong> The same guest was charged twice for the same gift</li>
              <li><strong>Unauthorized payment:</strong> The payment was made without the cardholder&apos;s authorization</li>
              <li><strong>Processing error:</strong> A technical error caused an incorrect charge amount</li>
              <li><strong>Fraud:</strong> The payment was determined to be fraudulent</li>
              <li><strong>Cancelled event:</strong> The event was cancelled before the gift was intended to be received, at the host&apos;s request</li>
            </ul>
            <p>
              Refund requests are reviewed on a case-by-case basis. We reserve the right to deny refund requests
              that do not meet these criteria or that appear abusive.
            </p>
          </Section>

          <Section title="4. How to Request a Refund">
            <p>
              To request a refund, email us at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-700 underline">{SUPPORT_EMAIL}</a>{' '}
              with the following information:
            </p>
            <ul>
              <li>Your full name and email address</li>
              <li>The event name and date</li>
              <li>The payment amount and approximate date of the transaction</li>
              <li>The reason for your refund request</li>
            </ul>
            <p>
              If you are the event host requesting a refund on behalf of a guest, please include the guest&apos;s
              name and confirm you have their permission to request the refund.
            </p>
          </Section>

          <Section title="5. Refund Processing Time">
            <p>
              If your refund is approved, we will initiate the refund through Stripe. Refunds typically appear on
              the original payment method within <strong>5–10 business days</strong>, depending on your bank or
              card issuer. We will notify you by email once a refund has been initiated.
            </p>
          </Section>

          <Section title="6. Host & Guest Responsibilities">
            <p>
              Event hosts are responsible for ensuring event details are accurate before sharing invite links.
              Guests are responsible for verifying the event and gift amount before completing payment.
            </p>
            <p>
              CreditKid is not responsible for gifts sent to the wrong event due to a guest entering incorrect
              information or using an outdated invite link, except where a clear processing error occurred.
            </p>
          </Section>

          <Section title="7. Contact">
            <p>
              For refund requests or questions about this policy, contact:
            </p>
            <p>
              <strong>{LEGAL_ENTITY}</strong><br />
              {LEGAL_ADDRESS_LINE1}<br />
              {LEGAL_ADDRESS_LINE2}<br />
              Email: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-700 underline">{SUPPORT_EMAIL}</a><br />
              Website: <a href={WEBSITE_URL} className="text-purple-700 underline">{WEBSITE_LABEL}</a>
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-purple-700 hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-purple-700 hover:underline">Terms of Service</Link>
          <Link href="/" className="hover:text-purple-700 hover:underline">Home</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-700 space-y-3">{children}</div>
    </section>
  )
}
