import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  handleApiError,
} from "@/lib/errors";

describe("Error Handling", () => {
  it("AppError should have correct properties", () => {
    const err = new AppError("Test error", 400, "TEST_CODE", { foo: "bar" });
    expect(err.message).toBe("Test error");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("TEST_CODE");
    expect(err.details).toEqual({ foo: "bar" });
    expect(err).toBeInstanceOf(Error);
  });

  it("NotFoundError should default to 404", () => {
    const err = new NotFoundError("Widget", "w_123");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe('Widget "w_123" not found');
  });

  it("ValidationError should default to 400", () => {
    const err = new ValidationError("Invalid input");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("UnauthorizedError should default to 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("ForbiddenError should default to 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("handleApiError should return structured Response", async () => {
    const err = new NotFoundError("Item");
    const res = handleApiError(err);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: "Item not found", code: "NOT_FOUND", details: undefined });
  });

  it("handleApiError should handle unknown errors", async () => {
    const res = handleApiError(new Error("Boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal server error" });
  });
});
