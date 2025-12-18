import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    appInfo: {
        name: 'Social Welfare Console',
        version: '0.1.0',
    },
    typescript: true,
});
