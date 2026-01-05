/**
 * Verification types - minimal types based on actual usage in banking setup
 */

// Form data used in personal-info.tsx
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

// Document upload used in identity-verification.tsx
export interface DocumentUpload {
    uri: string;
    type: "pdf" | "image";
    name: string;
}

