import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | CreditKid',
    description: 'CreditKid Terms of Service — read the terms governing your use of the CreditKid app and website.',
}

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-6 py-16">
                <a href="/" className="text-purple-700 font-semibold text-sm hover:underline mb-8 inline-block">
                    ← Back to CreditKid
                </a>

                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-gray-500 text-sm mb-10">Last updated: February 19, 2026</p>

                <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed">
                    <Section title="1. Acceptance of Terms">
                        <p>
                            By accessing or using the CreditKid application (&quot;App&quot;), the CreditKid website at
                            creditkid.vercel.app (&quot;Website&quot;), or any related services (collectively, the &quot;Service&quot;),
                            you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms,
                            do not use the Service.
                        </p>
                        <p>
                            CreditKid is operated by CreditKid (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). These Terms
                            constitute a legally binding agreement between you and CreditKid.
                        </p>
                    </Section>

                    <Section title="2. Description of the Service">
                        <p>CreditKid provides a platform that allows parents and guardians to:</p>
                        <ul>
                            <li>Create and manage events (e.g. birthday parties) with digital invitations, guest management, and RSVP tracking</li>
                            <li>Receive monetary gifts from event guests via secure online payments</li>
                            <li>Manage a financial account powered by Stripe Connect, where gift funds are collected</li>
                            <li>Create virtual debit cards for children, powered by Stripe Issuing</li>
                            <li>Link virtual cards to Apple Pay for in-store and online purchases</li>
                            <li>Track balances, transactions, and spending in real time</li>
                        </ul>
                    </Section>

                    <Section title="3. Eligibility">
                        <p>
                            You must be at least 18 years old and a legal resident of the United States to create an account
                            and use the financial features of the Service. By using the Service, you represent and warrant that
                            you meet these requirements.
                        </p>
                        <p>
                            Children under 18 may use the App only through a parent or guardian account and only to access
                            virtual cards that have been assigned to them by their parent or guardian.
                        </p>
                    </Section>

                    <Section title="4. Account Registration">
                        <p>
                            To use certain features of the Service, you must create an account using a valid email address or
                            a supported sign-in provider (Google, Apple). You are responsible for maintaining the confidentiality
                            of your account credentials and for all activity that occurs under your account.
                        </p>
                        <p>
                            You agree to provide accurate, current, and complete information during registration and to update
                            your information as needed. We reserve the right to suspend or terminate accounts that contain
                            inaccurate or fraudulent information.
                        </p>
                    </Section>

                    <Section title="5. Financial Services & Stripe">
                        <p>
                            CreditKid&apos;s payment, banking, and card features are powered by <strong>Stripe, Inc.</strong> through
                            Stripe Connect and Stripe Issuing. By using these features, you also agree to
                            the <a href="https://stripe.com/legal/connect-account" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">Stripe Connected Account Agreement</a> and
                            the <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">Stripe Services Agreement</a>.
                        </p>
                        <p>
                            When you create a financial account through CreditKid, a Stripe Custom Connected Account is created
                            on your behalf. This requires identity verification (KYC), including your legal name, date of birth,
                            address, Social Security Number (last 4 digits or full), and a government-issued photo ID. This
                            information is transmitted securely to Stripe and is not stored by CreditKid beyond what is necessary
                            for account management.
                        </p>
                        <p>
                            <strong>Fund availability:</strong> Incoming payments are subject to Stripe&apos;s standard hold periods. For
                            new accounts, funds are typically held for 7 days before becoming available. This period may shorten
                            as your account builds payment history.
                        </p>
                        <p>
                            <strong>Fees:</strong> CreditKid charges a platform fee of 3% on gift payments received through events.
                            This fee is automatically deducted before funds are deposited to your connected account. Stripe may
                            charge additional processing fees as described in their terms.
                        </p>
                    </Section>

                    <Section title="6. Virtual Cards & Issuing">
                        <p>
                            Virtual debit cards created through CreditKid are issued by Stripe Issuing. These cards are prepaid
                            cards funded from your CreditKid Issuing balance. Cards can be used for online purchases and, when
                            added to Apple Pay, for in-store contactless payments.
                        </p>
                        <p>
                            You are responsible for all activity on virtual cards assigned to your account or your child&apos;s account.
                            You may set spending limits and controls through the App. CreditKid is not responsible for unauthorized
                            purchases if you fail to secure your account credentials or card information.
                        </p>
                    </Section>

                    <Section title="7. Events & Invitations">
                        <p>
                            CreditKid allows you to create events, generate digital invitations (including AI-generated poster
                            designs), and send SMS invitations to guests. By using the invitation features, you represent that
                            you have permission to contact the people you invite and that you will not use these features for
                            spam or unsolicited messages.
                        </p>
                        <p>
                            Guest payment information is processed by Stripe and is never accessed or stored by CreditKid.
                        </p>
                    </Section>

                    <Section title="8. Prohibited Uses">
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the Service for any illegal, fraudulent, or unauthorized purpose</li>
                            <li>Provide false or misleading identity or financial information</li>
                            <li>Use the Service to launder money or finance terrorism</li>
                            <li>Attempt to circumvent security features or access other users&apos; accounts</li>
                            <li>Reverse-engineer, decompile, or disassemble the App or any part of the Service</li>
                            <li>Send spam, unsolicited messages, or abusive content through the invitation system</li>
                            <li>Use the Service in any way that violates applicable laws or regulations</li>
                        </ul>
                    </Section>

                    <Section title="9. Intellectual Property">
                        <p>
                            All content, branding, software, designs, and features of the Service are owned by CreditKid or
                            its licensors and are protected by copyright, trademark, and other intellectual property laws.
                            You may not copy, reproduce, distribute, or create derivative works from any part of the Service
                            without our written permission.
                        </p>
                    </Section>

                    <Section title="10. Disclaimers">
                        <p>
                            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
                            IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                        </p>
                        <p>
                            CreditKid is not a bank. Financial services are provided by Stripe and its banking partners.
                            CreditKid does not hold, custody, or guarantee your funds. All funds in your account are held
                            by Stripe in accordance with their terms.
                        </p>
                    </Section>

                    <Section title="11. Limitation of Liability">
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CREDITKID SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING
                            FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT OF FEES PAID BY YOU
                            TO CREDITKID IN THE 12 MONTHS PRECEDING THE CLAIM.
                        </p>
                    </Section>

                    <Section title="12. Termination">
                        <p>
                            We may suspend or terminate your access to the Service at any time, with or without cause, and
                            with or without notice. Upon termination, your right to use the Service ceases immediately. Any
                            remaining balance in your connected account will be handled in accordance with Stripe&apos;s terms
                            and applicable law.
                        </p>
                        <p>
                            You may delete your account at any time by contacting us. We will process account deletion requests
                            in accordance with our Privacy Policy.
                        </p>
                    </Section>

                    <Section title="13. Changes to Terms">
                        <p>
                            We reserve the right to modify these Terms at any time. We will notify you of material changes
                            by updating the &quot;Last updated&quot; date and, where appropriate, by sending a notification through the
                            App or to your registered email. Your continued use of the Service after changes are posted
                            constitutes acceptance of the modified Terms.
                        </p>
                    </Section>

                    <Section title="14. Governing Law">
                        <p>
                            These Terms are governed by and construed in accordance with the laws of the State of Florida,
                            United States, without regard to conflict of law principles. Any disputes arising under these
                            Terms shall be resolved in the courts located in Miami-Dade County, Florida.
                        </p>
                    </Section>

                    <Section title="15. Contact">
                        <p>
                            If you have questions about these Terms, please contact us at:
                        </p>
                        <p>
                            <strong>CreditKid</strong><br />
                            Email: <a href="mailto:support@creditkid.com" className="text-purple-700 underline">support@creditkid.com</a><br />
                            Website: <a href="https://creditkid.vercel.app" className="text-purple-700 underline">creditkid.vercel.app</a>
                        </p>
                    </Section>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
                    <a href="/privacy" className="hover:text-purple-700 hover:underline">Privacy Policy</a>
                    <a href="/" className="hover:text-purple-700 hover:underline">Home</a>
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
