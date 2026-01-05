// App configuration from environment variables
// Stripe publishable key (safe for client-side)
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_live_51KE7WKHW8n5LJxKTYAXlcqpA9DS32sXMCjGjFUPK3LfQL30fIlUc0jYv6iprNWWSiskq3UyqmDHxzw2Kjr1g5jdi00Ed02cuNU";

// Deep link URLs for Stripe onboarding
export const STRIPE_REFRESH_URL = process.env.EXPO_PUBLIC_STRIPE_REFRESH_URL || "piggybank://onboarding-refresh";
export const STRIPE_RETURN_URL = process.env.EXPO_PUBLIC_STRIPE_RETURN_URL || "piggybank://onboarding-complete";

