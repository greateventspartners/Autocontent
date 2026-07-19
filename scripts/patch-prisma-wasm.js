/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Post-build patch for Prisma 7 WASM on Cloudflare Workers.
 *
 * Strategy:
 * 1. Copy the WASM binary into the worker directory.
 * 2. Add a static ESM import in worker.js (the wrangler entry point)
 *    so that wrangler's `CompiledWasm` rule compiles it at deploy time.
 * 3. Set `globalThis.__prismaWasmModule` before any other code runs.
 *
 * The bundled handler.mjs already contains the patched `getQueryCompilerWasmModule`
 * (from class.ts) that reads `globalThis.__prismaWasmModule`.
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const WORKER_DIR = path.join(ROOT, ".open-next/server-functions/default");
const HANDLER_PATH = path.join(WORKER_DIR, "handler.mjs");
const WORKER_JS_PATH = path.join(ROOT, ".open-next/worker.js");
const WASM_SRC = path.join(ROOT, "src/generated/prisma/internal/query_compiler_fast_bg.wasm");

// ── Guard ──────────────────────────────────────────────────────────────
if (!fs.existsSync(WORKER_JS_PATH)) {
  console.log("patch-prisma-wasm: worker.js not found, skipping");
  process.exit(0);
}
if (!fs.existsSync(WASM_SRC)) {
  console.log("patch-prisma-wasm: WASM source not found at " + WASM_SRC + ", skipping");
  process.exit(0);
}

// ── 1. Copy WASM binary into the worker directory ──────────────────────
const WASM_DEST = path.join(WORKER_DIR, "query_compiler_fast_bg.wasm");
fs.copyFileSync(WASM_SRC, WASM_DEST);
console.log(`patch-prisma-wasm: copied WASM (${(fs.statSync(WASM_DEST).size / 1024 / 1024).toFixed(1)} MB) to worker dir`);

// ── 2. Patch worker.js: add static WASM import at the very top ────────
let workerJs = fs.readFileSync(WORKER_JS_PATH, "utf-8");

// Remove any previous WASM import lines (idempotent)
workerJs = workerJs.replace(/^import __prismaWasmModule from "[^"]*query_compiler_fast_bg\.wasm";\n/m, "");
workerJs = workerJs.replace(/^globalThis\.__prismaWasmModule = __prismaWasmModule;\n/m, "");

// Add import + assignment at the very first line (before any other imports)
const WASM_LINE = `import __prismaWasmModule from "./server-functions/default/query_compiler_fast_bg.wasm";
globalThis.__prismaWasmModule = __prismaWasmModule;
`;
workerJs = WASM_LINE + workerJs;
fs.writeFileSync(WORKER_JS_PATH, workerJs, "utf-8");
console.log("patch-prisma-wasm: added static WASM import to worker.js");

// ── 3. Clean handler.mjs: remove any previous WASM import/base64 ──────
if (fs.existsSync(HANDLER_PATH)) {
  let handler = fs.readFileSync(HANDLER_PATH, "utf-8");
  const originalLength = handler.length;
  // Remove previous import + globalThis lines
  handler = handler.replace(/^import __prismaWasmModule from "[^"]*query_compiler_fast_bg\.wasm";\n/m, "");
  handler = handler.replace(/^globalThis\.__prismaWasmModule = __prismaWasmModule;\n/m, "");
  // Remove any base64 preamble from previous patches
  handler = handler.replace(/^var __wasmBase64 = ".*?";\s*\nvar __wasmBytes = Uint8Array\.from\(atob\(__wasmBase64\).*?\nglobalThis\.__prismaWasmModule = WebAssembly\.compile\(__wasmBytes\);\s*\n/s, "");
  if (handler.length !== originalLength) {
    fs.writeFileSync(HANDLER_PATH, handler, "utf-8");
    console.log(`patch-prisma-wasm: cleaned handler.mjs (removed ${(originalLength - handler.length).toLocaleString()} chars)`);
  } else {
    console.log("patch-prisma-wasm: handler.mjs already clean");
  }
}

console.log("patch-prisma-wasm: done");
