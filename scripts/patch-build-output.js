const fs = require("node:fs");
const path = require("node:path");

const outputDir = path.resolve(__dirname, "../.open-next");

function findFiles(dir, pattern) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern));
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch { }
  return results;
}

const targets = findFiles(outputDir, /\.(mjs|js)$/);

for (const filePath of targets) {
  let code = fs.readFileSync(filePath, "utf-8");
  let original = code;

  // Pattern 1: Replace throw of instrumentation error with no-op
  code = code.replace(
    /throw\s+Object\.defineProperty\s*\(\s*new\s+Error\s*\(\s*(['"])(An error occurred while loading the instrumentation hook)\1[\s\S]*?\)\s*;/g,
    "/* instrumentation hook suppressed on edge */"
  );

  // Pattern 2: Replace the dynamic require in getInstrumentationModule
  code = code.replace(
    /async function getInstrumentationModule\([\s\S]*?\{[\s\S]*?(?:cachedInstrumentationModule\s*=\s*(?:await\s+)?require\([\s\S]*?INSTRUMENTATION_HOOK_FILENAME[\s\S]*?instrumentation[\s\S]*?\))[\s\S]*?return\s+cachedInstrumentationModule[\s\S]*?\}/g,
    "async function getInstrumentationModule(a,b) { if (cachedInstrumentationModule) return cachedInstrumentationModule; cachedInstrumentationModule = null; return cachedInstrumentationModule; }"
  );

  // Pattern 3: Replace registerInstrumentation to no-op
  code = code.replace(
    /async function registerInstrumentation\([\s\S]*?\{[\s\S]*?(?:getInstrumentationModule|instrumentation\??\.\s*register)[\s\S]*?\}/g,
    "async function registerInstrumentation(a,b) { }"
  );

  // Pattern 4: Replace loadInstrumentationModule to suppress error
  code = code.replace(
    /async\s+(?:loadInstrumentationModule)\s*\([\s\S]*?\{[\s\S]*?(?:err\.code\s*(?:!==?|!=)\s*(['"])MODULE_NOT_FOUND\1)[\s\S]*?(?:throw\s+Object\.defineProperty|instrumentation\s*hook)[\s\S]*?return\s+(?:this\.)?instrumentation[\s\S]*?\}/g,
    "async loadInstrumentationModule() { try { this.instrumentation = null; } catch(e) {} return this.instrumentation; }"
  );

  if (code !== original) {
    fs.writeFileSync(filePath, code, "utf-8");
    console.log(`Patched: ${filePath}`);
  }
}

console.log("Done patching build output");
