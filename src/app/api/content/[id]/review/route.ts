import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { createReview } from "@/lib/db/reviews";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: item } = await supabase
      .from("content_items")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!item) {
      return NextResponse.json({ error: "Contenu introuvable" }, { status: 404 });
    }

    const body = await _request.json().catch(() => ({}));
    const reviewerEmail = body.reviewerEmail || null;
    const reviewerName = body.reviewerName || null;

    const review = await createReview(id, reviewerEmail, reviewerName);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      review,
      reviewUrl: `${baseUrl}/review/${review.token}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
