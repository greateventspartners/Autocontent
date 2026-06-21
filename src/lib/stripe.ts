import Stripe from "stripe";

export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function createCheckoutSession(params: {
  workspaceId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: params.priceId, quantity: 1 }],
    client_reference_id: params.workspaceId,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { workspaceId: params.workspaceId },
  });

  return session.url;
}

export async function createPortalSession(params: {
  stripeCustomerId: string;
  returnUrl: string;
}): Promise<string | null> {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });

  return session.url;
}
