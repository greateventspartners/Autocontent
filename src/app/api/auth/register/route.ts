import { NextRequest } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase-admin";
import { ensureWorkspace } from "@/lib/db/workspaces";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, userId } = body;

  if (!email || !userId) {
    return Response.json({ error: "Email et userId requis" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return Response.json({ id: existing.id, email }, { status: 200 });
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: userId,
    email,
    name: name || null,
  });

  if (insertError) {
    console.error("[register] User insert error:", insertError);
    return Response.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
  }

  await supabase.from("user_preferences").insert({
    user_id: userId,
    locale: "fr",
    theme: "dark",
    email_notifications: true,
  });

  const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 63);

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ clerk_org_id: userId, name: name || email, slug })
    .select()
    .single();

  if (wsError) {
    console.error("[register] Workspace error:", wsError);
  } else {
    await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "OWNER",
    });

    await supabase.from("subscriptions").insert({
      workspace_id: workspace.id,
      plan: "FREE",
      status: "ACTIVE",
      content_limit: 10,
    });
  }

  return Response.json({ id: userId, email, name: name || null }, { status: 201 });
}
