import { createServerSupabaseClient } from "../supabase-server";

export async function listBrandKits(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("brand_kits")
    .select("*, tones(*), voice_rules(*), personas(*)")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getBrandKit(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("brand_kits")
    .select("*, tones(*), voice_rules(*), personas(*)")
    .eq("id", id)
    .single();
  return data;
}

export async function createBrandKit(workspaceId: string, body: {
  name: string;
  website?: string | null;
  slogan?: string | null;
  description?: string | null;
  colors?: any;
  tone?: string[];
  voiceRules?: string[];
  personas?: { name: string; role: string; bio: string }[];
}) {
  const supabase = await createServerSupabaseClient();

  const { data: brandKit, error } = await supabase
    .from("brand_kits")
    .insert({
      workspace_id: workspaceId,
      name: body.name,
      website: body.website ?? null,
      slogan: body.slogan ?? null,
      description: body.description ?? null,
      colors: body.colors ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  if (body.tone?.length) {
    await supabase.from("tones").insert(
      body.tone.map((label) => ({ brand_kit_id: brandKit.id, label }))
    );
  }

  if (body.voiceRules?.length) {
    await supabase.from("voice_rules").insert(
      body.voiceRules.map((rule) => ({ brand_kit_id: brandKit.id, rule }))
    );
  }

  if (body.personas?.length) {
    await supabase.from("personas").insert(
      body.personas.map((p) => ({
        brand_kit_id: brandKit.id,
        name: p.name,
        role: p.role,
        bio: p.bio,
      }))
    );
  }

  return getBrandKit(brandKit.id);
}

export async function updateBrandKit(id: string, body: {
  name?: string;
  website?: string | null;
  slogan?: string | null;
  description?: string | null;
  colors?: any;
  tone?: string[];
  voiceRules?: string[];
  personas?: { name: string; role: string; bio: string }[];
}) {
  const supabase = await createServerSupabaseClient();

  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.website !== undefined) updateData.website = body.website;
  if (body.slogan !== undefined) updateData.slogan = body.slogan;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.colors !== undefined) updateData.colors = body.colors;

  if (Object.keys(updateData).length > 0) {
    await supabase.from("brand_kits").update(updateData).eq("id", id);
  }

  if (body.tone !== undefined) {
    await supabase.from("tones").delete().eq("brand_kit_id", id);
    if (body.tone.length) {
      await supabase.from("tones").insert(
        body.tone.map((label) => ({ brand_kit_id: id, label }))
      );
    }
  }

  if (body.voiceRules !== undefined) {
    await supabase.from("voice_rules").delete().eq("brand_kit_id", id);
    if (body.voiceRules.length) {
      await supabase.from("voice_rules").insert(
        body.voiceRules.map((rule) => ({ brand_kit_id: id, rule }))
      );
    }
  }

  if (body.personas !== undefined) {
    await supabase.from("personas").delete().eq("brand_kit_id", id);
    if (body.personas.length) {
      await supabase.from("personas").insert(
        body.personas.map((p) => ({
          brand_kit_id: id,
          name: p.name,
          role: p.role,
          bio: p.bio,
        }))
      );
    }
  }

  return getBrandKit(id);
}

export async function deleteBrandKit(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("brand_kits").delete().eq("id", id);
}
