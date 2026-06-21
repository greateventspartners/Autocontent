import { describe, it, expect } from "vitest";
import { ROLE_HIERARCHY, hasMinRole, canWrite, canAdmin } from "@/lib/rbac";

describe("RBAC Utilities", () => {
  it("should define correct role hierarchy", () => {
    expect(ROLE_HIERARCHY.VIEWER).toBe(0);
    expect(ROLE_HIERARCHY.MEMBER).toBe(1);
    expect(ROLE_HIERARCHY.ADMIN).toBe(2);
    expect(ROLE_HIERARCHY.OWNER).toBe(3);
  });

  it("hasMinRole — should return true for sufficient role", () => {
    expect(hasMinRole("ADMIN", "MEMBER")).toBe(true);
    expect(hasMinRole("OWNER", "ADMIN")).toBe(true);
  });

  it("hasMinRole — should return false for insufficient role", () => {
    expect(hasMinRole("VIEWER", "MEMBER")).toBe(false);
    expect(hasMinRole(null, "MEMBER")).toBe(false);
    expect(hasMinRole(undefined, "MEMBER")).toBe(false);
  });

  it("canWrite — should allow MEMBER and above", () => {
    expect(canWrite("MEMBER")).toBe(true);
    expect(canWrite("ADMIN")).toBe(true);
    expect(canWrite("OWNER")).toBe(true);
    expect(canWrite("VIEWER")).toBe(false);
  });

  it("canAdmin — should allow ADMIN and above", () => {
    expect(canAdmin("ADMIN")).toBe(true);
    expect(canAdmin("OWNER")).toBe(true);
    expect(canAdmin("MEMBER")).toBe(false);
    expect(canAdmin("VIEWER")).toBe(false);
  });
});
