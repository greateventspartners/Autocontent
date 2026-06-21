import { createServerSupabaseClient } from "../supabase-server";
import crypto from "crypto";

export async function createReview(contentItemId: string, reviewerEmail?: string, reviewerName?: string) {
  const supabase = await createServerSupabaseClient();
  const token = crypto.randomBytes(32).toString("hex");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      content_item_id: contentItemId,
      token,
      reviewer_email: reviewerEmail ?? null,
      reviewer_name: reviewerName ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReviewByToken(token: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, content_items(*)")
    .eq("token", token)
    .maybeSingle();
  return data;
}

export async function submitReview(token: string, body: {
  status: "APPROVED" | "CHANGES_REQUESTED";
  comments?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({
      status: body.status,
      comments: body.comments ?? null,
      responded_at: new Date().toISOString(),
    })
    .eq("token", token)
    .select()
    .single();

  if (error) throw error;
  return data;
}
