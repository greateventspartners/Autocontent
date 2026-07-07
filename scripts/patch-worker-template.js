const fs = require("node:fs");
const path = require("node:path");

const workerPath = path.resolve(
  __dirname,
  "../node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js"
);

const original = fs.readFileSync(workerPath, "utf-8");

// Replace static import of middleware with dynamic import at the top
const step1 = original.replace(
  `import { handler as middlewareHandler } from "./middleware/handler.mjs";`,
  `let middlewareHandler;
async function getMiddlewareHandler() {
  if (!middlewareHandler) {
    const mod = await import("./middleware/handler.mjs");
    middlewareHandler = mod.handler;
  }
  return middlewareHandler;
}`,
);

// Replace static import of server-functions with dynamic
const step2 = step1.replace(
  `import { handler as serverHandler } from "./server-functions/default/handler.mjs";`,
  "",
);

// Insert try-catch in fetch handler
const step3 = step2.replace(
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {`,
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            try {`
);

const step4 = step3.replace(
  `const reqOrResp = await middlewareHandler(request, env, ctx);`,
  `const reqOrResp = await getMiddlewareHandler().then(h => h(request, env, ctx));`,
);

const step5 = step4.replace(
  `        });
    },
};`,
  `            } catch (err) {
                console.error("Worker error:", err);
                return new Response(JSON.stringify({
                    error: err?.message ?? String(err),
                    stack: err?.stack ?? undefined,
                }), {
                    status: 500,
                    headers: { "content-type": "application/json" },
                });
            }
        });
    },
};`
);

fs.writeFileSync(workerPath, step5, "utf-8");
console.log("Patched worker template with dynamic middleware import + error handling");
