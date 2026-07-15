/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const workerPath = path.resolve(
  __dirname,
  "../node_modules/@opennextjs/cloudflare/dist/cli/templates/worker.js"
);

let code = fs.readFileSync(workerPath, "utf-8");

if (code.includes('console.error("Worker error:"')) {
  console.log("Worker template already patched");
  process.exit(0);
}

code = code.replace(
  `    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {`,
  `    async fetch(request, env, ctx) {
        try {
        return await runWithCloudflareRequestContext(request, env, ctx, async () => {`
);

code = code.replace(
  `        });
    },
};`,
  `        });
        } catch (err) {
            console.error("Worker error:", err);
            return new Response(JSON.stringify({
                error: String(err?.message ?? err),
            }), {
                status: 500,
                headers: { "content-type": "application/json" },
            });
        }
    },
};`
);

fs.writeFileSync(workerPath, code, "utf-8");
console.log("Worker template patched: try-catch wrapper added");
