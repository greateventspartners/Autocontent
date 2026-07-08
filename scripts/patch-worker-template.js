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

// 2. Replace DO exports with stubs
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

// 3. WRAP ENTIRE FETCH in try-catch with await (async functions never throw synchronously)
code = code.replace(
  `export default {
    async fetch(request, env, ctx) {
        return runWithCloudflareRequestContext(request, env, ctx, async () => {`,
  `export default {
    async fetch(request, env, ctx) {
        console.log("fetch called", Date.now());
        try {
        return await runWithCloudflareRequestContext(request, env, ctx, async () => {`
);

// 4. Use dynamic middleware handler
code = code.replace(
  `const reqOrResp = await middlewareHandler(request, env, ctx);`,
  `const mw = await getMwHandler();
const reqOrResp = await mw(request, env, ctx);`,
);

// 5. Replace the closing: add catch for the outer try
code = code.replace(
  `        });
    },
};`,
  `        });
        } catch (err) {
            console.error("Worker startup error:", err);
            return new Response(JSON.stringify({
                error: err?.message ?? String(err),
                stack: err?.stack ?? undefined,
                name: err?.name ?? typeof err,
            }), {
                status: 500,
                headers: { "content-type": "application/json" },
            });
        }
    },
};`
);

fs.writeFileSync(workerPath, code, "utf-8");
console.log("Worker template patched: outer try-catch + dynamic middleware + DO stubs");

// --- Also patch the OpenNext requestHandler error serialization ---
const requestHandlerPath = path.resolve(
  __dirname,
  "../node_modules/@opennextjs/aws/dist/core/requestHandler.js"
);
let rhCode = fs.readFileSync(requestHandlerPath, "utf-8");
rhCode = rhCode.replace(
  `res.end(JSON.stringify({
            message: "Server failed to respond.",
            details: e,
        }, null, 2));`,
  `res.end(JSON.stringify({
            message: "Server failed to respond.",
            errorMessage: e?.message ?? (typeof e === "string" ? e : undefined),
            errorName: e?.name ?? typeof e,
            errorStack: e?.stack ?? undefined,
        }, null, 2));`
);
fs.writeFileSync(requestHandlerPath, rhCode, "utf-8");
console.log("requestHandler patched: error details include message and stack");

// --- Patch next-server.js to suppress instrumentation hook loading error ---
const nextServerPath = path.resolve(
  __dirname,
  "../node_modules/next/dist/server/next-server.js"
);
let nsCode = fs.readFileSync(nextServerPath, "utf-8");
// Replace the loadInstrumentationModule method with a no-op that never throws
nsCode = nsCode.replace(
  `async loadInstrumentationModule() {
        if (!this.serverOptions.dev) {
            try {
                this.instrumentation = await (0, _instrumentationglobalsexternal.getInstrumentationModule)(this.dir, this.nextConfig.distDir);
            } catch (err) {
                if (err.code !== 'MODULE_NOT_FOUND') {
                    throw Object.defineProperty(new Error('An error occurred while loading the instrumentation hook', {
                        cause: err
                    }), "__NEXT_ERROR_CODE", {
                        value: "E92",
                        enumerable: false,
                        configurable: true
                    });
                }
            }
        }
        return this.instrumentation;
    }`,
  `async loadInstrumentationModule() {
        if (!this.serverOptions.dev) {
            try {
                this.instrumentation = await (0, _instrumentationglobalsexternal.getInstrumentationModule)(this.dir, this.nextConfig.distDir);
            } catch (err) {
                // Silently ignore instrumentation loading errors on edge
            }
        }
        return this.instrumentation;
    }`
);
fs.writeFileSync(nextServerPath, nsCode, "utf-8");
console.log("next-server.js patched: instrumentation hook errors suppressed");

// --- Patch instrumentation-globals.external.js to not use dynamic require ---
const instrumentationGlobalsPath = path.resolve(
  __dirname,
  "../node_modules/next/dist/server/lib/router-utils/instrumentation-globals.external.js"
);
let igCode = fs.readFileSync(instrumentationGlobalsPath, "utf-8");
// Replace getInstrumentationModule to return null (no-op on edge workers)
igCode = igCode.replace(
  `async function getInstrumentationModule(projectDir, distDir) {
    if (cachedInstrumentationModule) {
        return cachedInstrumentationModule;
    }
    try {
        cachedInstrumentationModule = (0, _interopdefault.interopDefault)(await require(_nodepath.default.join(projectDir, distDir, 'server', \`\${_constants.INSTRUMENTATION_HOOK_FILENAME}.js\`)));
        return cachedInstrumentationModule;
    } catch (err) {
        if ((0, _iserror.default)(err) && err.code !== 'ENOENT' && err.code !== 'MODULE_NOT_FOUND' && err.code !== 'ERR_MODULE_NOT_FOUND') {
            throw err;
        }
    }
}`,
  `async function getInstrumentationModule(projectDir, distDir) {
    if (cachedInstrumentationModule) {
        return cachedInstrumentationModule;
    }
    // Dynamic require is not supported on edge workers, return null
    cachedInstrumentationModule = null;
    return cachedInstrumentationModule;
}`
);
fs.writeFileSync(instrumentationGlobalsPath, igCode, "utf-8");
console.log("instrumentation-globals.external.js patched: getInstrumentationModule returns null");
