/**
 * Verification types - minimal types based on actual usage in banking setup
 */

// Form data used in personal-info.tsx (Stripe Custom Connect in-app onboarding)
export interface PersonalInfoFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    ssnLast4: string;
}

export interface StripeConnectBusinessProfile {
    mcc: string;
    url: string;
    productDescription: string;
    statementDescriptor: string;
    supportPhone: string;
}

export interface StripeConnectBankAccount {
    accountHolderName: string;
    routingNumber: string;
    accountNumber: string;
}

// Document upload used in identity-verification.tsx
export interface DocumentUpload {
    uri: string;
    type: "pdf" | "image";
    name: string;
}

