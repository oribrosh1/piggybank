// Platform-specific Stripe wrapper
import stripeWeb from './stripe.web';
import stripeNative from './stripe.native';
import { Platform } from 'react-native';

const stripe = Platform.OS === 'web' ? stripeWeb : stripeNative;

// Re-export as named exports for easier imports
export const CardField = stripe.CardField;
export const useConfirmPayment = stripe.useConfirmPayment;
export const initStripe = stripe.initStripe;