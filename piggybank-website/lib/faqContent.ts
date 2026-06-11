export type FaqItem = {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is CreditKid?',
    answer:
      'CreditKid is a birthday gift wallet for modern families. Parents create a birthday event, invite guests, collect gifts and blessings, and give their child a virtual debit card they can use anywhere — with smart parent controls built in.',
  },
  {
    question: 'When is the app launching?',
    answer:
      'CreditKid is coming in July 2026. You can subscribe on our coming soon page to get notified the moment the app is available on the App Store.',
  },
  {
    question: 'How do we get a credit card?',
    answer:
      'After you create a birthday event and set up your account, CreditKid issues a virtual debit card for your child through Stripe. You complete a quick parent verification, then add the card to Apple Pay on your child\'s phone. No physical card is required — the digital card is ready to use in stores and online.',
  },
  {
    question: 'Where will my digital gifts be stored?',
    answer:
      'All birthday gifts from guests are stored in your child\'s CreditKid wallet — a secure digital balance tied to their event. You can see every gift, who sent it, and the running total in the app. Funds stay in one place until your child spends them with their virtual card or Apple Pay.',
  },
  {
    question: 'What are the fees?',
    answer:
      'CreditKid charges a 3% platform fee on gift payments received through events. Guests pay the gift amount plus this fee at checkout — for example, a $50 gift includes a $3 service fee. The full gift amount is deposited to your child\'s wallet. Stripe may charge additional standard payment processing fees as described in their terms.',
  },
  {
    question: 'How do birthday gifts work?',
    answer:
      'Guests receive a polished invite and can send a monetary gift directly to your child\'s CreditKid wallet. Funds land in one place instead of scattered gift cards, and your child can spend them with Apple Pay.',
  },
  {
    question: 'Can my child use the money anywhere?',
    answer:
      'Yes. CreditKid provides a virtual debit card linked to Apple Pay, so birthday gifts can be spent in stores and online — not locked to a single retailer like a traditional gift card.',
  },
  {
    question: 'What parent controls are included?',
    answer:
      'Parents can track spending in real time, set limits, receive instant alerts on purchases, and keep spending secure. CreditKid is built for kids and loved by parents.',
  },
  {
    question: 'How do invitations and RSVPs work?',
    answer:
      'You can generate AI party posters, send SMS invites with gift links, track live RSVPs, manage a gift registry, and send thank-you notes after the event — all from one flow.',
  },
  {
    question: 'Is CreditKid safe and secure?',
    answer:
      'Yes. Payments are secured by Stripe. Your financial data is encrypted, and parent accounts control how funds are received and spent. We never sell your personal information.',
  },
  {
    question: 'Who can create an account?',
    answer:
      'CreditKid is designed for parents and guardians in the United States. You must be at least 18 years old to create an account and manage a child\'s wallet.',
  },
  {
    question: 'How do I get notified when the app launches?',
    answer:
      'Visit our coming soon page and enter your email. We\'ll notify you as soon as CreditKid is available to download.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'Email us at support@credit-kid.com and we\'ll get back to you as soon as possible.',
  },
]

export const HOMEPAGE_FAQ_HIGHLIGHTS = FAQ_ITEMS.filter((item) =>
  [
    'How do we get a credit card?',
    'Where will my digital gifts be stored?',
    'What are the fees?',
  ].includes(item.question),
)
