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

const targets = [
  ...findFiles(outputDir, /handler\.mjs$/),
  ...findFiles(outputDir, /worker\.js$/),
];

for (const filePath of targets) {
  console.log(`Patching ${filePath}...`);
  let code = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  // Replace the instrumentation hook error throw with a simple null
  // The minified bundled code has: throw Object.defineProperty(new Error('An error occurred...'), "__NEXT_ERROR_CODE", {...})
  // We replace it with a return statement to make loadInstrumentationModule a no-op
  const newCode = code.replace(
    /throw\s+Object\.defineProperty\s*\(\s*new\s+Error\s*\(\s*['"]An error occurred while loading the instrumentation hook['"]/g,
    "/* patched */ return void 0 /*"
  );

  if (newCode !== code) {
    code = newCode;
    changed = true;
  }

  // Also replace the dynamic require call in getInstrumentationModule
  // Pattern: await require(_nodepath.default.join(projectDir, distDir, 'server', `...instrumentation.js`))
  // In bundled code this would be: await require(...path...,"server",...+"instrumentation"+...)
  const code2 = code.replace(
    /require\s*\([^)]*join\s*\([^)]*server[^)]*instrumentation[^)]*\)\s*\)/g,
    "null /* patched dynamic require */"
  );

  if (code2 !== code) {
    code = code2;
    changed = true;
  }

  // Also replace: cachedInstrumentationModule = (0, _interopdefault.interopDefault)(await require(...))
  // to: cachedInstrumentationModule = null
  const code3 = code.replace(
    /cachedInstrumentationModule\s*=\s*\(?\s*0?\s*,\s*_interopdefault\??\.?\s*interopDefault\s*\)?\s*\(\s*await\s+null\s*\/\*\s*patched\s+dynamic\s+require\s*\*\//g,
    "cachedInstrumentationModule = null"
  );

  if (code3 !== code) {
    code = code3;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, code, "utf-8");
    console.log(`  Patched successfully`);
  } else {
    console.log(`  No instrumentation pattern found (already patched or different structure)`);
  }
}

console.log("Done patching build output");
