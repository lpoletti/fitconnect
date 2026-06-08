import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop) => {
    const instance = getStripe();
    return (instance as any)[prop];
  },
});

// Map internal plan keys to Stripe price lookups
// These use lookup_keys so they work across Stripe accounts
export const STRIPE_PLAN_CONFIG: Record<string, {
  monthlyPriceLookup: string;
  annualPriceLookup: string;
  plan: string;
  maxStudents: number;
}> = {
  pro10: {
    monthlyPriceLookup: 'fitconnect_pro10_monthly',
    annualPriceLookup: 'fitconnect_pro10_annual',
    plan: 'pro10',
    maxStudents: 10,
  },
  pro50: {
    monthlyPriceLookup: 'fitconnect_pro50_monthly',
    annualPriceLookup: 'fitconnect_pro50_annual',
    plan: 'pro50',
    maxStudents: 50,
  },
  pro100: {
    monthlyPriceLookup: 'fitconnect_pro100_monthly',
    annualPriceLookup: 'fitconnect_pro100_annual',
    plan: 'pro100',
    maxStudents: 100,
  },
};
