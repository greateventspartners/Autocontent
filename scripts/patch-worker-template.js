const fs = require("node:fs");
const path = require("node:path");

const workerPath = path.resolve(
  __dirname,
  "../node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js"
);

const original = fs.readFileSync(workerPath, "utf-8");

const patched = original.replace(
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {`,
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {
            try {`
);

const patched2 = patched.replace(
  `        });
    },
};`,
  `            } catch (err) {
                console.error("Worker error:", err);
                return new Response(JSON.stringify({
                    error: err instanceof Error ? err.message : String(err),
                    stack: err instanceof Error ? err.stack : undefined,
                }), {
                    status: 500,
                    headers: { "content-type": "application/json" },
                });
            }
        });
    },
};`
);

fs.writeFileSync(workerPath, patched2, "utf-8");
console.log("Patched worker template with error handling");
