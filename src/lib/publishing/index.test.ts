import { describe, it, expect } from "vitest";
import { wordpressAdapter } from "@/lib/publishing/wordpress";
import { linkedinAdapter } from "@/lib/publishing/linkedin";
import { getAdapter } from "@/lib/publishing";

describe("Publishing Adapters", () => {
  describe("WordPress", () => {
    it("should have correct name", () => {
      expect(wordpressAdapter.name).toBe("wordpress");
    });

    it("should validate required config", () => {
      expect(wordpressAdapter.validate({})).toBe("Missing siteUrl");
      expect(wordpressAdapter.validate({ siteUrl: "https://example.com" })).toBe("Missing username");
      expect(wordpressAdapter.validate({ siteUrl: "https://example.com", username: "admin" })).toBe("Missing appPassword");
      expect(
        wordpressAdapter.validate({
          siteUrl: "https://example.com",
          username: "admin",
          appPassword: "pass",
        })
      ).toBeNull();
    });
  });

  describe("LinkedIn", () => {
    it("should have correct name", () => {
      expect(linkedinAdapter.name).toBe("linkedin");
    });

    it("should validate required config", () => {
      expect(linkedinAdapter.validate({})).toBe("Missing LinkedIn accessToken");
      expect(linkedinAdapter.validate({ accessToken: "tok" })).toBe("Missing LinkedIn authorId (URN)");
      expect(linkedinAdapter.validate({ accessToken: "tok", authorId: "abc" })).toBeNull();
    });
  });

  describe("Adapter Registry", () => {
    it("should return adapter for known channels", () => {
      expect(getAdapter("WORDPRESS")).toBe(wordpressAdapter);
      expect(getAdapter("LINKEDIN")).toBe(linkedinAdapter);
    });

    it("should return undefined for unknown channels", () => {
      expect(getAdapter("SLACK")).toBeUndefined();
    });

    it("should be case insensitive", () => {
      expect(getAdapter("wordpress")).toBe(wordpressAdapter);
      expect(getAdapter("LinkedIn")).toBe(linkedinAdapter);
    });
  });
});
