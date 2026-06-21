import { z } from "zod/v4";

export const brandKitSchema = z.object({
  name: z.string().min(1).max(100),
  website: z.string().url().optional().or(z.literal("")),
  slogan: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  colors: z
    .object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      background: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    })
    .optional(),
  tone: z.array(z.string().min(1)).optional(),
  voiceRules: z.array(z.string().min(1)).optional(),
  personas: z
    .array(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        bio: z.string().min(1),
      })
    )
    .optional(),
});

export const contentGenerateSchema = z.object({
  brandKitId: z.string().min(1),
  topic: z.string().min(1).max(500),
  type: z.enum(["SOCIAL", "BLOG", "EMAIL", "AD"]),
  count: z.number().int().min(1).max(20).optional(),
});

export const contentScheduleSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
});

export const analyticsEventSchema = z.object({
  contentId: z.string().optional(),
  channel: z.string().min(1),
  event: z.enum(["impressions", "clicks", "engagement"]),
  value: z.number().int().min(0),
});

export const integrationUpsertSchema = z.object({
  channel: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional(),
});

export const workspaceMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["MEMBER", "ADMIN", "VIEWER"]),
});

export const apiKeyCreateSchema = z.object({
  label: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

export type BrandKitInput = z.input<typeof brandKitSchema>;
export type ContentGenerateInput = z.input<typeof contentGenerateSchema>;
export type AnalyticsEventInput = z.input<typeof analyticsEventSchema>;
