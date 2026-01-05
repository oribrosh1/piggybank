// Web Stripe stubs (Stripe React Native not supported on web)

export default {
    CardField: null as any,
    useConfirmPayment: () => ({
        confirmPayment: async () => ({
            error: { message: 'Stripe not available on web', code: 'Unavailable' } as any,
            paymentIntent: undefined
        })
    }),
    initStripe: async () => {
        console.warn('Stripe is not available on web platform');
    }
};
