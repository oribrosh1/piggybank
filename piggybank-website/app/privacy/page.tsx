import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | CreditKid',
    description: 'CreditKid Privacy Policy — learn how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-6 py-16">
                <a href="/" className="text-purple-700 font-semibold text-sm hover:underline mb-8 inline-block">
                    ← Back to CreditKid
                </a>

                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-gray-500 text-sm mb-10">Last updated: February 19, 2026</p>

                <div className="prose prose-gray max-w-none space-y-8 text-[15px] leading-relaxed">
                    <Section title="1. Introduction">
                        <p>
                            CreditKid (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy
                            Policy explains how we collect, use, disclose, and safeguard your information when you use the
                            CreditKid mobile application (&quot;App&quot;), the CreditKid website at creditkid.vercel.app (&quot;Website&quot;),
                            and related services (collectively, the &quot;Service&quot;).
                        </p>
                        <p>
                            By using the Service, you consent to the practices described in this Privacy Policy. If you do
                            not agree, please do not use the Service.
                        </p>
                    </Section>

                    <Section title="2. Information We Collect">
                        <h3 className="font-bold text-gray-900 text-base mt-4 mb-2">2.1 Information You Provide</h3>
                        <ul>
                            <li>
                                <strong>Account information:</strong> Name, email address, and password when you create an
                                account, or profile information from Google or Apple sign-in.
                            </li>
                            <li>
                                <strong>Identity verification (KYC):</strong> Legal first and last name, date of birth, home
                                address, phone number, Social Security Number (last 4 digits or full as required by Stripe),
                                and a government-issued photo ID. This is required to create a Stripe Connected Account and
                                comply with financial regulations.
                            </li>
                            <li>
                                <strong>Banking information:</strong> Bank account routing number, account number, and account
                                holder name when you link a bank account for payouts.
                            </li>
                            <li>
                                <strong>Event information:</strong> Event names, dates, times, locations, guest names, phone
                                numbers, and gift messages when you create events and send invitations.
                            </li>
                            <li>
                                <strong>Child information:</strong> Name and limited information about children when parents
                                link a child to a virtual card through the App.
                            </li>
                        </ul>

                        <h3 className="font-bold text-gray-900 text-base mt-4 mb-2">2.2 Information Collected Automatically</h3>
                        <ul>
                            <li>
                                <strong>Device information:</strong> Device type, operating system, unique device identifiers,
                                and app version.
                            </li>
                            <li>
                                <strong>Usage data:</strong> Pages visited, features used, timestamps, and interaction patterns
                                within the App and Website.
                            </li>
                            <li>
                                <strong>Transaction data:</strong> Payment amounts, dates, descriptions, and statuses associated
                                with your connected account, as provided by Stripe.
                            </li>
                        </ul>

                        <h3 className="font-bold text-gray-900 text-base mt-4 mb-2">2.3 Information from Third Parties</h3>
                        <ul>
                            <li>
                                <strong>Stripe:</strong> Account verification status, capability statuses, balance information,
                                and transaction details from your Stripe Connected Account.
                            </li>
                            <li>
                                <strong>Authentication providers:</strong> Basic profile information (name, email) from Google
                                or Apple when you use social sign-in.
                            </li>
                        </ul>
                    </Section>

                    <Section title="3. How We Use Your Information">
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li>Create and manage your account</li>
                            <li>Provide, maintain, and improve the Service</li>
                            <li>Process payments and manage your financial account through Stripe</li>
                            <li>Create and manage events, send invitations via SMS, and track RSVPs</li>
                            <li>Create virtual cards and manage child spending</li>
                            <li>Verify your identity as required by financial regulations (KYC/AML)</li>
                            <li>Communicate with you about your account, transactions, and service updates</li>
                            <li>Detect and prevent fraud, abuse, and security incidents</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </Section>

                    <Section title="4. How We Share Your Information">
                        <p>We do not sell your personal information. We share information only in the following cases:</p>

                        <h3 className="font-bold text-gray-900 text-base mt-4 mb-2">4.1 Service Providers</h3>
                        <ul>
                            <li>
                                <strong>Stripe, Inc.:</strong> Identity verification data, banking information, and transaction
                                data are shared with Stripe to operate your connected account, process payments, and issue
                                virtual cards. Stripe acts as an independent data controller for this information.
                                See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">Stripe&apos;s Privacy Policy</a>.
                            </li>
                            <li>
                                <strong>Firebase (Google Cloud):</strong> Account data, event data, and authentication information
                                are stored in Firebase (Firestore, Authentication, Storage) hosted on Google Cloud.
                                See <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">Firebase Privacy Information</a>.
                            </li>
                            <li>
                                <strong>Twilio:</strong> Guest phone numbers are shared with Twilio to send SMS event invitations
                                and reminders. See <a href="https://www.twilio.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-700 underline">Twilio&apos;s Privacy Policy</a>.
                            </li>
                        </ul>

                        <h3 className="font-bold text-gray-900 text-base mt-4 mb-2">4.2 Legal Requirements</h3>
                        <p>
                            We may disclose your information if required by law, regulation, legal process, or government
                            request, or when we believe disclosure is necessary to protect our rights, your safety, or the
                            safety of others.
                        </p>

                        <h3 className="font-bold text-gray-900 text-base mt-4 mb-2">4.3 Business Transfers</h3>
                        <p>
                            If CreditKid is involved in a merger, acquisition, or sale of assets, your information may be
                            transferred as part of that transaction. We will notify you of any such change.
                        </p>
                    </Section>

                    <Section title="5. Data Retention">
                        <p>
                            We retain your personal information for as long as your account is active or as needed to provide
                            the Service. We may also retain information as required by law, to resolve disputes, enforce
                            agreements, and for legitimate business purposes.
                        </p>
                        <p>
                            Identity verification documents submitted to Stripe are retained by Stripe in accordance with
                            their retention policies and regulatory requirements. CreditKid does not store copies of your
                            government-issued ID.
                        </p>
                        <p>
                            When you delete your account, we will delete or anonymize your personal information within 30 days,
                            except where we are required to retain it by law.
                        </p>
                    </Section>

                    <Section title="6. Data Security">
                        <p>
                            We implement appropriate technical and organizational measures to protect your information,
                            including:
                        </p>
                        <ul>
                            <li>All data transmitted between the App/Website and our servers is encrypted using TLS/HTTPS</li>
                            <li>Sensitive financial data (card numbers, CVVs, SSNs) is handled exclusively by Stripe and never stored on our servers</li>
                            <li>Authentication tokens are securely stored on your device using platform-native secure storage (e.g. Keychain on iOS)</li>
                            <li>Backend API routes require authenticated Firebase tokens for access</li>
                            <li>Stripe API secret keys are stored as environment variables and never exposed to the client</li>
                        </ul>
                        <p>
                            While we take reasonable precautions, no method of electronic storage or transmission is 100% secure.
                            We cannot guarantee absolute security of your data.
                        </p>
                    </Section>

                    <Section title="7. Children's Privacy">
                        <p>
                            CreditKid allows parents and guardians to create virtual cards for their children. We do not
                            knowingly collect personal information directly from children under 13 without parental consent.
                        </p>
                        <p>
                            Child accounts are created and managed exclusively by the parent or guardian. The only child
                            information we store is what the parent provides (name and association to a card/event).
                            Children do not create their own accounts or provide personal information directly to CreditKid.
                        </p>
                        <p>
                            If you believe we have inadvertently collected information from a child under 13 without appropriate
                            consent, please contact us immediately and we will delete the information.
                        </p>
                    </Section>

                    <Section title="8. Your Rights">
                        <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                        <ul>
                            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                            <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete information</li>
                            <li><strong>Deletion:</strong> Request that we delete your personal information, subject to legal retention requirements</li>
                            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format</li>
                            <li><strong>Opt-out:</strong> Opt out of non-essential communications</li>
                        </ul>
                        <p>
                            To exercise any of these rights, contact us at <a href="mailto:support@creditkid.com" className="text-purple-700 underline">support@creditkid.com</a>.
                            We will respond to your request within 30 days.
                        </p>
                    </Section>

                    <Section title="9. California Residents (CCPA)">
                        <p>
                            If you are a California resident, you have additional rights under the California Consumer Privacy
                            Act (CCPA):
                        </p>
                        <ul>
                            <li>The right to know what personal information we collect, use, and disclose</li>
                            <li>The right to request deletion of your personal information</li>
                            <li>The right to opt out of the sale of your personal information — we do not sell personal information</li>
                            <li>The right to non-discrimination for exercising your privacy rights</li>
                        </ul>
                    </Section>

                    <Section title="10. Cookies & Tracking">
                        <p>
                            The Website may use essential cookies for authentication and session management. We do not use
                            third-party advertising cookies or tracking pixels. The App does not use cookies but may collect
                            usage analytics to improve the Service.
                        </p>
                    </Section>

                    <Section title="11. Third-Party Links">
                        <p>
                            The Service may contain links to third-party websites (e.g. Stripe Dashboard, Apple Pay).
                            We are not responsible for the privacy practices of these external sites. We encourage you
                            to read their privacy policies before providing personal information.
                        </p>
                    </Section>

                    <Section title="12. Changes to This Policy">
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of material changes
                            by updating the &quot;Last updated&quot; date and, where appropriate, by sending a notification through
                            the App or email. Your continued use of the Service after changes are posted constitutes
                            acceptance of the updated Privacy Policy.
                        </p>
                    </Section>

                    <Section title="13. Contact Us">
                        <p>
                            If you have questions or concerns about this Privacy Policy or our data practices, please
                            contact us at:
                        </p>
                        <p>
                            <strong>CreditKid</strong><br />
                            Email: <a href="mailto:support@creditkid.com" className="text-purple-700 underline">support@creditkid.com</a><br />
                            Website: <a href="https://creditkid.vercel.app" className="text-purple-700 underline">creditkid.vercel.app</a>
                        </p>
                    </Section>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
                    <a href="/terms" className="hover:text-purple-700 hover:underline">Terms of Service</a>
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
