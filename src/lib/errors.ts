export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} "${id}" not found` : `${entity} not found`,
      404,
      "NOT_FOUND"
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super("Too many requests", 429, "RATE_LIMIT");
  }
}

export function handleApiError(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(
      {
        error: err.message,
        code: err.code,
        details: err.details,
      },
      { status: err.statusCode }
    );
  }

  console.error("[UnhandledError]", err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}

export function withErrorHandler(handler: (...args: any[]) => Promise<Response>) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (err) {
      return handleApiError(err);
    }
  };
}
