/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const outputDir = path.resolve(__dirname, "../.open-next");

function findFiles(dir, pattern) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...findFiles(fullPath, pattern));
      else if (pattern.test(entry.name)) results.push(fullPath);
    }
  } catch {}
  return results;
}

const targets = findFiles(outputDir, /\.(mjs|js)$/);
let patched = 0;

for (const filePath of targets) {
  let code = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  const requirePattern = /require\([^)]*INSTRUMENTATION_HOOK_FILENAME[^)]*\)/g;
  const matches = code.match(requirePattern);
  if (matches) {
    console.log(`Patching INSTRUMENTATION_HOOK_FILENAME require() in ${path.relative(outputDir, filePath)}`);
    for (const m of matches) console.log(`  ${m.substring(0, 80)}`);
    code = code.replace(requirePattern, "null");
    changed = true;
    patched += matches.length;
  }

  if (changed) fs.writeFileSync(filePath, code, "utf-8");
}

if (patched === 0) console.log("patch-build-output: no INSTRUMENTATION_HOOK_FILENAME require() found (already patched or absent)");
else console.log(`patch-build-output: replaced ${patched} require() call(s)`);
