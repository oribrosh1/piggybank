import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useRouter } from "expo-router";
import type { PersonalInfoFormData } from "@/types/verifications";
import { createCustomConnectAccount, getAccountDetails } from "@/src/lib/api";
import { useAuth } from "@/src/utils/auth";
import { getUserProfile } from "@/src/lib/userService";

export const TOTAL_STEPS = 4;
export const TEST_ROUTING = "110000000";
export const TEST_ACCOUNT = "000123456789";
export const TEST_ACCOUNT_LAST4 = "6789";

export const ID_DOCUMENT_OPTIONS = [
  { value: "passport", label: "Passport" },
  { value: "passport_card", label: "Passport card" },
  { value: "drivers_license", label: "Driver license" },
  { value: "state_id", label: "State issued ID card" },
  { value: "resident_permit", label: "Resident permit ID / U.S. Green Card" },
  { value: "border_crossing", label: "Border crossing card" },
  { value: "child_id", label: "Child ID card" },
  { value: "nyc_card", label: "NYC card" },
  { value: "us_visa", label: "U.S. visa" },
  { value: "other", label: "Other" },
];

function formatUSPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").slice(0, 10);
}

export function usePersonalInfoScreen() {
  const { auth } = useAuth();
  const userEmail = auth?.email ?? "";
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [idDocumentType, setIdDocumentType] = useState("");
  const [useTestDocument, setUseTestDocument] = useState(false);
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountLast4, setConfirmAccountLast4] = useState("");
  const [useTestBankAccount, setUseTestBankAccount] = useState(false);
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    ssnLast4: "",
  });
  const [tosAccepted, setTosAccepted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showNameEmailEdit, setShowNameEmailEdit] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobPickerDate, setDobPickerDate] = useState<Date>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  });
  const addressPlacesRef = useRef<unknown>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  useEffect(() => {
    if (userEmail) {
      setFormData((prev) => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  useEffect(() => {
    let cancelled = false;
    if (!auth?.uid) return;
    getUserProfile(auth.uid)
      .then((profile) => {
        if (cancelled || !profile) return;
        setFormData((prev) => ({
          ...prev,
          ...(profile.legalFirstName?.trim() && { firstName: profile.legalFirstName.trim() }),
          ...(profile.legalLastName?.trim() && { lastName: profile.legalLastName.trim() }),
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [auth?.uid]);

  useEffect(() => {
    let cancelled = false;
    getAccountDetails()
      .then((res) => {
        if (cancelled || !res.individual) return;
        const ind = res.individual;
        setFormData((prev) => ({
          ...prev,
          ...(ind.first_name && { firstName: ind.first_name }),
          ...(ind.last_name && { lastName: ind.last_name }),
          ...(ind.phone && { phone: formatUSPhone(ind.phone) }),
          ...(ind.dob && {
            dob: `${String(ind.dob.month).padStart(2, "0")}/${String(ind.dob.day).padStart(2, "0")}/${ind.dob.year}`,
          }),
          ...(ind.address && {
            address: ind.address.line1 || "",
            city: ind.address.city || "",
            state: ind.address.state || "",
            zipCode: ind.address.postal_code || "",
          }),
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    const phoneDigits = getPhoneDigits(formData.phone);
    if (phoneDigits.length === 0) newErrors.phone = "Phone number is required";
    else if (phoneDigits.length !== 10) newErrors.phone = "Enter a valid US phone number (10 digits)";
    if (!formData.dob.trim()) newErrors.dob = "Date of birth is required";
    else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dob)) newErrors.dob = "Use MM/DD/YYYY format";
    if (!formData.address.trim()) newErrors.address = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) newErrors.zipCode = "Invalid ZIP code";
    if (!formData.ssnLast4.trim()) newErrors.ssnLast4 = "Last 4 digits required";
    else if (!/^\d{4}$/.test(formData.ssnLast4)) newErrors.ssnLast4 = "Must be exactly 4 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!idDocumentType.trim()) {
      newErrors.idDocumentType = "Please select which document you'll use for verification.";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: { [key: string]: string } = {};
    const routing = (useTestBankAccount ? TEST_ROUTING : routingNumber).replace(/\D/g, "");
    const account = (useTestBankAccount ? TEST_ACCOUNT : accountNumber).replace(/\D/g, "");
    const confirm = (useTestBankAccount ? TEST_ACCOUNT_LAST4 : confirmAccountLast4).replace(/\D/g, "");
    if (routing.length !== 9) newErrors.routingNumber = "Routing number must be 9 digits.";
    if (account.length < 4) newErrors.accountNumber = "Account number is required (at least 4 digits).";
    const accountLast4 = account.slice(-4);
    if (confirm !== accountLast4) {
      newErrors.confirmAccountLast4 =
        "Confirm account number must match the last 4 digits of your account number.";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tosAccepted) {
      newErrors.tos =
        "You must accept the Stripe Connected Account Agreement and Terms of Service to continue.";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const dobStringToDate = (dob: string): Date => {
    const match = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match)
      return (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 25);
        return d;
      })();
    return new Date(parseInt(match[3], 10), parseInt(match[1], 10) - 1, parseInt(match[2], 10));
  };

  const dateToDobString = (d: Date): string => {
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const openDobPicker = () => {
    setDobPickerDate(dobStringToDate(formData.dob));
    setFocusedField("dob");
    setShowDobPicker(true);
  };

  const confirmDobPicker = () => {
    const value = dateToDobString(dobPickerDate);
    handleInputChange("dob", value);
    setErrors((prev) => (prev.dob ? { ...prev, dob: "" } : prev));
    setShowDobPicker(false);
    setFocusedField(null);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatUSPhone(value);
    setFormData((prev) => ({ ...prev, phone: formatted }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
  };

  const handleNext = async () => {
    setApiError(null);
    if (step === 1) {
      if (!validateForm()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!validateStep3()) return;
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!validateStep4()) return;
      setLoading(true);
      const routing = (useTestBankAccount ? TEST_ROUTING : routingNumber).replace(/\D/g, "");
      const account = (useTestBankAccount ? TEST_ACCOUNT : accountNumber).replace(/\D/g, "");
      const accountHolderName =
        [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim() || "Account Holder";
      try {
        await createCustomConnectAccount({
          country: "US",
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dob: formData.dob,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          ssnLast4: formData.ssnLast4,
          idDocumentType: idDocumentType || undefined,
          useTestDocument: typeof __DEV__ !== "undefined" && __DEV__ ? useTestDocument : false,
          routingNumber: routing,
          accountNumber: account,
          accountHolderName,
        });
        router.replace("/banking/setup/success");
      } catch (err: unknown) {
        const code = err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { code?: string; error?: string } } }).response?.data?.code
          : undefined;
        const serverMessage =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string }; message?: string } }).response?.data?.error ||
              (err as { message?: string }).message
            : "";
        if (
          code === "capability_not_enabled" ||
          /card_issuing|platform has been onboarded/i.test(String(serverMessage))
        ) {
          setApiError(
            "Stripe Issuing isn't enabled for this app yet. The platform account must complete Issuing onboarding in the Stripe Dashboard (Dashboard → Issuing) before you can create cards."
          );
        } else if (code === "postal_code_invalid") {
          setStep(1);
          setErrors((prev) => ({
            ...prev,
            zipCode: String(serverMessage || "Please enter a valid 5-digit ZIP that matches your state."),
          }));
          setApiError("");
        } else {
          setApiError(String(serverMessage || "Something went wrong"));
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const parseSecondaryAddress = (
    secondaryText: string
  ): { city: string; state: string; zipCode: string } => {
    const parts = (secondaryText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    let city = "";
    let state = "";
    let zipCode = "";
    if (parts.length >= 1) city = parts[0];
    if (parts.length >= 2) {
      const stateZip = parts[1];
      const tokens = stateZip.split(/\s+/).filter(Boolean);
      if (tokens.length >= 2) {
        zipCode = tokens.pop() || "";
        state = tokens.join(" ");
      } else {
        state = stateZip;
      }
    }
    return { city, state, zipCode };
  };

  const handleAddressPlaceSelect = (place: {
    structuredFormat: { mainText: { text: string }; secondaryText?: { text: string } };
  }) => {
    const street = place.structuredFormat.mainText?.text ?? "";
    const secondaryText = place.structuredFormat.secondaryText?.text ?? "";
    const { city, state: stateRaw, zipCode } = parseSecondaryAddress(secondaryText);
    let state = stateRaw.trim().length === 2 ? stateRaw.toUpperCase() : "";
    const allStates = [
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
      "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
      "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
      "VA", "WA", "WV", "WI", "WY", "DC",
    ];
    if (state && !allStates.includes(state)) state = "";
    setFormData((prev) => ({ ...prev, address: street, city, state, zipCode }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.address;
      delete next.city;
      delete next.state;
      delete next.zipCode;
      return next;
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return {
    router,
    userEmail,
    step,
    setStep,
    idDocumentType,
    setIdDocumentType,
    useTestDocument,
    setUseTestDocument,
    routingNumber,
    setRoutingNumber,
    accountNumber,
    setAccountNumber,
    confirmAccountLast4,
    setConfirmAccountLast4,
    useTestBankAccount,
    setUseTestBankAccount,
    formData,
    tosAccepted,
    setTosAccepted,
    errors,
    focusedField,
    setFocusedField,
    loading,
    apiError,
    showNameEmailEdit,
    setShowNameEmailEdit,
    showDobPicker,
    setShowDobPicker,
    dobPickerDate,
    setDobPickerDate,
    addressPlacesRef,
    fadeAnim,
    progressWidth,
    validateForm,
    validateStep2,
    validateStep3,
    validateStep4,
    openDobPicker,
    confirmDobPicker,
    handlePhoneChange,
    handleNext,
    handleInputChange,
    handleAddressPlaceSelect,
  };
}
