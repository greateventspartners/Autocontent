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

  // 1. Patch INSTRUMENTATION_HOOK_FILENAME require()
  const requirePattern = /require\([^)]*INSTRUMENTATION_HOOK_FILENAME[^)]*\)/g;
  const matches = code.match(requirePattern);
  if (matches) {
    console.log(`[${relPath}] Patching ${matches.length} INSTRUMENTATION_HOOK_FILENAME require() call(s)`);
    code = code.replace(requirePattern, "null");
    changed = true;
    totalPatches += matches.length;
  }

  // 2. Patch the "Internal Server Error" plain text response to include error details
  // The pattern in minified Next.js is: .body("Internal Server Error").send()
  // We want to add error info to a header before sending
  // Strategy: find "Internal Server Error" near .logError and capture the error
  if (code.includes('.body("Internal Server Error").send()')) {
    console.log(`[${relPath}] Found .body("Internal Server Error").send() — patching to expose errors`);
    // Replace the entire error-handling statement
    // The pattern is: ...logError(...)),RESP.statusCode=500,RESP.body("Internal Server Error").send()
    // We add a header with the error details before sending
    code = code.replace(
      /(\w+)\.statusCode=500,\1\.body\("Internal Server Error"\)\.send\(\)/g,
      (_, resp) => {
        console.log(`  Patching response variable: ${resp}`);
        totalPatches++;
        return `${resp}.statusCode=500,${resp}.setHeader("x-error-detail","internal-error-caught"),${resp}.body("Internal Server Error").send()`;
      }
    );
    changed = true;
  }

  // 3. Patch the "Server failed to respond" JSON error to include full error details
  // Pattern: W.end(JSON.stringify({message:"Server failed to respond.",details:I},null,2))
  if (code.includes('"Server failed to respond."')) {
    console.log(`[${relPath}] Found "Server failed to respond." — patching to include error details`);
    code = code.replace(
      /(\w+)\.end\(JSON\.stringify\(\{message:"Server failed to respond\.",details:(\w+)\},null,2\)\)/g,
      (_, resp, err) => {
        console.log(`  Patching: resp=${resp}, err=${err}`);
        totalPatches++;
        return `${resp}.end(JSON.stringify({message:"Server failed to respond.",errorMessage:${err}?.message,errorName:${err}?.name,errorStack:${err}?.stack,digest:${err}?.digest},null,2))`;
      }
    );
    changed = true;
  }

  if (changed) fs.writeFileSync(filePath, code, "utf-8");
}

if (totalPatches === 0) console.log("patch-build-output: no patches applied (patterns not found — may already be patched or code structure changed)");
else console.log(`patch-build-output: applied ${totalPatches} patches`);
