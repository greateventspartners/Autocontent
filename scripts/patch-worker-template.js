const fs = require("node:fs");
const path = require("node:path");

const workerPath = path.resolve(
  __dirname,
  "../node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js"
);

let code = fs.readFileSync(workerPath, "utf-8");

// 0. Add startup log
code = `console.log("Worker loaded at", Date.now());\n` + code;

// 1. Replace static middleware import with dynamic lazy import
code = code.replace(
  `import { handler as middlewareHandler } from "./middleware/handler.mjs";`,
  `let _mwHandler;
async function getMwHandler() {
  if (!_mwHandler) {
    const mod = await import("./middleware/handler.mjs");
    _mwHandler = mod.handler;
  }
  return _mwHandler;
}`,
);

// 2. Replace DO exports with lazy stubs (avoids loading failing modules at startup)
code = code.replace(
  `//@ts-expect-error: Will be resolved by wrangler build
export { DOQueueHandler } from "./.build/durable-objects/queue.js";
//@ts-expect-error: Will be resolved by wrangler build
export { DOShardedTagCache } from "./.build/durable-objects/sharded-tag-cache.js";
//@ts-expect-error: Will be resolved by wrangler build
export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";`,
  `export const DOQueueHandler = undefined;
export const DOShardedTagCache = undefined;
export const BucketCachePurge = undefined;`,
);

// 3. Wrap fetch handler with try-catch
code = code.replace(
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {`,
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            try {`
);

// 4. Use dynamic middleware handler
code = code.replace(
  `const reqOrResp = await middlewareHandler(request, env, ctx);`,
  `const mw = await getMwHandler();
const reqOrResp = await mw(request, env, ctx);`,
);

// 5. Replace closing with error handler
code = code.replace(
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

fs.writeFileSync(workerPath, code, "utf-8");
console.log("Worker template patched: lazy DO imports + dynamic middleware + error handling");
