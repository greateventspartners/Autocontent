import { describe, it, expect } from "vitest";
import {
  brandKitSchema,
  contentGenerateSchema,
  contentScheduleSchema,
  analyticsEventSchema,
  integrationUpsertSchema,
} from "@/lib/validation";

describe("Validation Schemas", () => {
  describe("brandKitSchema", () => {
    it("should accept minimal valid input", () => {
      const result = brandKitSchema.safeParse({ name: "Test Brand" });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = brandKitSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("should accept full brand kit", () => {
      const result = brandKitSchema.safeParse({
        name: "Acme Corp",
        website: "https://acme.com",
        slogan: "We build",
        description: "A company",
        colors: { primary: "#8b5cf6", secondary: "#ec4899", background: "#0f172a" },
        tone: ["Professional", "Direct"],
        voiceRules: ["Be concise"],
        personas: [{ name: "John", role: "CTO", bio: "Loves tech" }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("contentGenerateSchema", () => {
    it("should accept valid input", () => {
      const result = contentGenerateSchema.safeParse({
        brandKitId: "bk_123",
        topic: "AI Marketing",
        type: "BLOG",
      });
      expect(result.success).toBe(true);
    });

    it("should accept optional count", () => {
      const result = contentGenerateSchema.safeParse({
        brandKitId: "bk_123",
        topic: "AI Marketing",
        type: "SOCIAL",
        count: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = contentGenerateSchema.safeParse({
        brandKitId: "bk_123",
        topic: "AI",
        type: "INVALID",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("analyticsEventSchema", () => {
    it("should accept valid event", () => {
      const result = analyticsEventSchema.safeParse({
        channel: "LINKEDIN",
        event: "clicks",
        value: 42,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid event name", () => {
      const result = analyticsEventSchema.safeParse({
        channel: "LINKEDIN",
        event: "bogus",
        value: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("contentScheduleSchema", () => {
    it("should accept optional date", () => {
      const result = contentScheduleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe("integrationUpsertSchema", () => {
    it("should accept valid config", () => {
      const result = integrationUpsertSchema.safeParse({
        channel: "WORDPRESS",
        config: { siteUrl: "https://example.com" },
      });
      expect(result.success).toBe(true);
    });
  });
});
