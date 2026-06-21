import { NextRequest } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

async function findWorkspaceByStripeCustomer(customer: string) {
  const supabase = getServiceRoleClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("clerk_org_id", customer)
    .maybeSingle();
  return workspace;
}

async function markProcessed(eventId: string) {
  const supabase = getServiceRoleClient();
  await supabase
    .from("webhook_events")
    .update({ processed: true })
    .eq("event_id", eventId);
}

async function handleCheckoutSessionCompleted(obj: any) {
  const session = obj;
  const workspaceId = session.metadata?.workspaceId;
  if (!workspaceId) {
    logger.warn("checkout.session.completed missing workspaceId in metadata");
    return;
  }

  const priceId = session.metadata?.priceId ?? session.line_items?.data?.[0]?.price?.id;
  const supabase = getServiceRoleClient();

  await supabase
    .from("subscriptions")
    .update({
      stripe_id: session.customer,
      stripe_price_id: priceId,
      plan: "PRO" as any,
      status: "ACTIVE" as any,
      current_period_start: new Date(session.created * 1000).toISOString(),
      current_period_end: new Date((session.created + 2592000) * 1000).toISOString(),
    })
    .eq("workspace_id", workspaceId);

  logger.info("Subscription upgraded to PRO", { workspaceId });
}

async function handleSubscriptionCreated(obj: any) {
  const sub = obj;
  const workspace = await findWorkspaceByStripeCustomer(sub.customer);
  if (!workspace) {
    logger.warn("subscription.created: no workspace for customer", { customer: sub.customer });
    return;
  }

  const supabase = getServiceRoleClient();
  await supabase
    .from("subscriptions")
    .update({
      stripe_id: sub.customer,
      stripe_price_id: sub.items?.data?.[0]?.price?.id,
      plan: (sub.items?.data?.[0]?.price?.nickname === "Enterprise" ? "ENTERPRISE" : "PRO") as any,
      status: (sub.status === "active" ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : "INCOMPLETE") as any,
      current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : undefined,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
    })
    .eq("workspace_id", workspace.id);

  logger.info("Subscription created via Stripe", { workspaceId: workspace.id });
}

async function handleSubscriptionUpdated(obj: any) {
  const sub = obj;
  const workspace = await findWorkspaceByStripeCustomer(sub.customer);
  if (!workspace) return;

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    trialing: "ACTIVE",
  };

  const supabase = getServiceRoleClient();
  await supabase
    .from("subscriptions")
    .update({
      stripe_price_id: sub.items?.data?.[0]?.price?.id,
      plan: (sub.items?.data?.[0]?.price?.nickname === "Enterprise" ? "ENTERPRISE" : "PRO") as any,
      status: (statusMap[sub.status] ?? "ACTIVE") as any,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
    })
    .eq("workspace_id", workspace.id);
}

async function handleSubscriptionDeleted(obj: any) {
  const sub = obj;
  const workspace = await findWorkspaceByStripeCustomer(sub.customer);
  if (!workspace) return;

  const supabase = getServiceRoleClient();
  await supabase
    .from("subscriptions")
    .update({ status: "CANCELED" as any })
    .eq("workspace_id", workspace.id);

  logger.info("Subscription canceled", { workspaceId: workspace.id });
}

async function handleInvoicePaymentSucceeded(obj: any) {
  const invoice = obj;
  const workspace = await findWorkspaceByStripeCustomer(invoice.customer);
  if (!workspace) return;

  const supabase = getServiceRoleClient();
  await supabase
    .from("subscriptions")
    .update({ status: "ACTIVE" as any })
    .eq("workspace_id", workspace.id);

  logger.info("Invoice payment succeeded", { workspaceId: workspace.id });
}

async function handleInvoicePaymentFailed(obj: any) {
  const invoice = obj;
  const workspace = await findWorkspaceByStripeCustomer(invoice.customer);
  if (!workspace) return;

  const supabase = getServiceRoleClient();
  await supabase
    .from("subscriptions")
    .update({ status: "PAST_DUE" as any })
    .eq("workspace_id", workspace.id);

  logger.warn("Invoice payment failed", { workspaceId: workspace.id });
}

async function handleInvoicePaymentActionRequired(obj: any) {
  const invoice = obj;
  const workspace = await findWorkspaceByStripeCustomer(invoice.customer);
  if (!workspace) return;

  const supabase = getServiceRoleClient();
  await supabase
    .from("subscriptions")
    .update({ status: "INCOMPLETE" as any })
    .eq("workspace_id", workspace.id);

  logger.warn("Invoice payment action required (SCA)", { workspaceId: workspace.id, invoiceId: invoice.id });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const body = await request.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    logger.warn("Stripe webhook not configured, skipping");
    return Response.json({ received: true });
  }

  let event: any;
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(stripeKey, {});
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    logger.error("Stripe webhook signature verification failed", { error: err.message });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    return Response.json({ received: true });
  }

  await supabase.from("webhook_events").insert({
    source: "stripe",
    event_id: event.id,
    type: event.type,
    raw: event.data.object,
    processed: false,
  });

  const handlerMap: Record<string, (obj: any) => Promise<void>> = {
    "checkout.session.completed": handleCheckoutSessionCompleted,
    "customer.subscription.created": handleSubscriptionCreated,
    "customer.subscription.updated": handleSubscriptionUpdated,
    "customer.subscription.deleted": handleSubscriptionDeleted,
    "invoice.payment_succeeded": handleInvoicePaymentSucceeded,
    "invoice.payment_failed": handleInvoicePaymentFailed,
    "invoice.payment_action_required": handleInvoicePaymentActionRequired,
  };

  const handler = handlerMap[event.type];
  if (handler) {
    try {
      await handler(event.data.object);
    } catch (err: any) {
      logger.error(`Stripe webhook handler failed for ${event.type}`, { error: err.message, eventId: event.id });
    }
  } else {
    logger.info(`Unhandled Stripe event type: ${event.type}`);
  }

  await markProcessed(event.id);

  return Response.json({ received: true });
}
