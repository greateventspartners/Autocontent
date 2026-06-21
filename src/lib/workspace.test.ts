import { describe, it, expect } from "vitest";
import { getWorkspaceId } from "@/lib/db/workspaces";

describe("Workspace Utilities", () => {
  it("getWorkspaceId should return orgId when available", async () => {
    await expect(getWorkspaceId("org_123", "user_456")).resolves.toBe("org_123");
  });

  it("getWorkspaceId should fall back to userId when orgId is null", async () => {
    await expect(getWorkspaceId(null, "user_456")).resolves.toBe("user_456");
  });

  it("getWorkspaceId should fall back to userId when orgId is undefined", async () => {
    await expect(getWorkspaceId(undefined, "user_456")).resolves.toBe("user_456");
  });
});
