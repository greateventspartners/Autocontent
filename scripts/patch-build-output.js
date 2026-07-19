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
let totalPatches = 0;

for (const filePath of targets) {
  let code = fs.readFileSync(filePath, "utf-8");
  let changed = false;
  const relPath = path.relative(outputDir, filePath);

  const requirePattern = /require\([^)]*INSTRUMENTATION_HOOK_FILENAME[^)]*\)/g;
  const matches = code.match(requirePattern);
  if (matches) {
    console.log(`[${relPath}] Patching ${matches.length} INSTRUMENTATION_HOOK_FILENAME require() call(s)`);
    code = code.replace(requirePattern, "null");
    changed = true;
    totalPatches += matches.length;
  }

  if (changed) fs.writeFileSync(filePath, code, "utf-8");
}

if (totalPatches === 0) console.log("patch-build-output: no patches applied (patterns not found)");
else console.log(`patch-build-output: applied ${totalPatches} patches`);
