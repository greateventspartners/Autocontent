import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  const checks: Record<string, string | boolean> = {};

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("users").select("id").limit(1);
    checks.database = !error;
  } catch (err: any) {
    checks.database = err.message;
  }

  const s3Endpoint = process.env.S3_ENDPOINT;
  checks.storage = s3Endpoint ? "configured" : "not configured";

  const allOk = checks.database === true;

  return Response.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: process.env.npm_package_version || "0.1.0",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
