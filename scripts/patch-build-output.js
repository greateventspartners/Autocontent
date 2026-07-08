const fs = require("node:fs");
const path = require("node:path");

const outputDir = path.resolve(__dirname, "../.open-next");

// Find the bundled handler.mjs
function findHandlerFiles(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findHandlerFiles(fullPath));
      } else if (entry.name === "handler.mjs") {
        results.push(fullPath);
      }
    }
  } catch { }
  return results;
}

const handlers = findHandlerFiles(outputDir);

if (handlers.length === 0) {
  console.error("No handler.mjs found in .open-next/");
  process.exit(1);
}

for (const handlerPath of handlers) {
  console.log(`Patching ${handlerPath}...`);
  let code = fs.readFileSync(handlerPath, "utf-8");

  // Patch 1: Replace getInstrumentationModule to return null instead of dynamic require
  // The bundled code has a function that tries to require("instrumentation.js")
  // Match the pattern: cachedInstrumentationModule = ... require(... instrumentation.js
  code = code.replace(
    /async function getInstrumentationModule\([^)]+\)\s*\{[^}]*cachedInstrumentationModule\s*=.*?require\([^)]*instrumentation[^)]*\)[^}]*return\s+cachedInstrumentationModule[^}]*\}/gs,
    `async function getInstrumentationModule(a,b) { if (cachedInstrumentationModule) return cachedInstrumentationModule; cachedInstrumentationModule = null; return cachedInstrumentationModule; }`
  );

  // Patch 2: Make loadInstrumentationModule in next-server not throw
  // Match: loadInstrumentationModule() { ... if(err.code!==... ) throw ... }
  code = code.replace(
    /async\s+loadInstrumentationModule\s*\(\s*\)\s*\{[^}]*err\.code\s*!==\s*['"]MODULE_NOT_FOUND['"][^}]*throw[^}]*Error\([^)]*instrumentation[^)]*\)[^}]*\}/gs,
    `async loadInstrumentationModule() { try { this.instrumentation = null; } catch(e) {} return this.instrumentation; }`
  );

  // Patch 3: Replace instrumentation-globals' registerInstrumentation to no-op
  // This is called from prepareImpl -> runInstrumentationHookIfAvailable -> ensureInstrumentationRegistered -> registerInstrumentation
  code = code.replace(
    /async\s+function\s+registerInstrumentation\s*\([^)]*\)\s*\{[^}]*getInstrumentationModule[^}]*instrumentation\??\s*\.\s*register[^}]*\}/gs,
    `async function registerInstrumentation(a,b) { }`
  );

  fs.writeFileSync(handlerPath, code, "utf-8");
  console.log(`  Patched successfully (${code.length} bytes)`);
}

console.log("Build output patched successfully");
