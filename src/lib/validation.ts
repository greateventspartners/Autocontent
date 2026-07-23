import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const copilotGenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt requis").max(10000),
  platform: z.enum(["linkedin", "twitter", "instagram", "facebook", "tiktok", "pinterest", "wordpress", "medium"]),
  image: z.object({
    data: z.string().min(1),
    mimeType: z.string().min(1),
  }).optional(),
});

export function validateBody<T extends z.ZodType>(schema: T, data: unknown): { success: true; data: z.infer<T> } | { success: false; error: Response } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const message = result.error.issues.map((i) => i.message).join(", ");
  return { success: false, error: Response.json({ error: message }, { status: 400 }) };
}
