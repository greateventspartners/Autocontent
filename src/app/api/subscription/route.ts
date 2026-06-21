import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { getSubscription } from "@/lib/db/subscriptions";

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const sub = await getSubscription(workspaceId);
    return Response.json(sub);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();

    if (body.action === "checkout") {
      const { createCheckoutSession } = await import("@/lib/stripe");
      const url = await createCheckoutSession({
        workspaceId,
        priceId: body.priceId,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
      return Response.json({ url });
    }

    if (body.action === "portal") {
      const supabase = await createServerSupabaseClient();
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("stripe_id")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (!sub?.stripe_id) return Response.json({ error: "No stripe customer" }, { status: 400 });

      const { createPortalSession } = await import("@/lib/stripe");
      const url = await createPortalSession({
        stripeCustomerId: sub.stripe_id,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      });
      return Response.json({ url });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return handleApiError(err);
  }
}
