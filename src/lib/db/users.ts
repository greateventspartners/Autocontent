import { createServerSupabaseClient } from "../supabase-server";

export async function getUserById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getUserByEmail(email: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  return data;
}

export async function createUser(email: string, name?: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .insert({ email, name: name ?? null })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("user_preferences").insert({
    user_id: data.id,
    locale: "fr",
    theme: "dark",
    email_notifications: true,
  });

  return data;
}
