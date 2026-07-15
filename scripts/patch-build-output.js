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

  // 2. Patch the internal Next.js error handler to expose the actual error
  // Pattern: this.logError(PROCESS_ERROR),RESP.statusCode=500,RESP.body("Internal Server Error").send()
  // We replace the ENTIRE statement to capture the error and include it in a header
  if (code.includes('.body("Internal Server Error").send()')) {
    console.log(`[${relPath}] Found .body("Internal Server Error").send() — patching to expose error`);
    
    // Strategy: replace the body text to include error info
    // Pattern: ,VAR.statusCode=500,VAR.body("Internal Server Error").send()
    // Replace with: ,VAR.statusCode=500,VAR.setHeader("x-error-msg",String(ERROR_VAR?.message||ERROR_VAR)),VAR.body("Internal Server Error").send()
    // We need to capture the error variable from the logError call
    
    // First try: match the full statement including logError
    const fullPattern = /(\w+)\.statusCode=500,\1\.body\("Internal Server Error"\)\.send\(\)/g;
    const fullMatches = [...code.matchAll(fullPattern)];
    console.log(`  Found ${fullMatches.length} direct .statusCode=500,...send() pattern(s)`);
    
    for (const m of fullMatches) {
      const resp = m[1];
      const matchStart = m.index;
      
      // Look backward to find the logError call and capture the error variable
      const before = code.substring(Math.max(0, matchStart - 200), matchStart);
      
      // Pattern: logError(...ERROR_VAR)...),RESP.statusCode=500
      // The error variable is the argument to getProperError or similar
      const logErrMatch = before.match(/\.logError\(\S+\((\w+)\)\)/);
      if (logErrMatch) {
        const errVar = logErrMatch[1];
        console.log(`  Captured error variable: ${errVar}`);
        // Replace: add the error message as a header
        const replacement = `${resp}.statusCode=500,${resp}.setHeader("x-error-msg",String(${errVar}?.message||${errVar})),${resp}.setHeader("x-error-stack",String(${errVar}?.stack||"").substring(0,500)),${resp}.body("Internal Server Error").send()`;
        code = code.substring(0, matchStart) + replacement + code.substring(matchStart + m[0].length);
        changed = true;
        totalPatches++;
      } else {
        // Fallback: just add the header without error details
        console.log(`  Could not capture error variable, adding marker only`);
        const replacement = `${resp}.statusCode=500,${resp}.setHeader("x-error-detail","internal-error-caught"),${resp}.body("Internal Server Error").send()`;
        code = code.substring(0, matchStart) + replacement + code.substring(matchStart + m[0].length);
        changed = true;
        totalPatches++;
      }
    }
  }

  // 3. Patch the "Server failed to respond" JSON error to include full error details
  if (code.includes('"Server failed to respond."')) {
    console.log(`[${relPath}] Found "Server failed to respond." — patching to include error details`);
    code = code.replace(
      /(\w+)\.statusCode=500,\1\.setHeader\("Content-Type","application\/json"\),\1\.end\(JSON\.stringify\(\{message:"Server failed to respond\.",details:(\w+)\},null,2\)\)/g,
      (_, resp, err) => {
        console.log(`  Patching: resp=${resp}, err=${err}`);
        totalPatches++;
        return `${resp}.statusCode=500,${resp}.setHeader("Content-Type","application/json"),${resp}.end(JSON.stringify({message:"Server failed to respond.",errorMessage:${err}?.message,errorName:${err}?.name,errorStack:${err}?.stack,digest:${err}?.digest},null,2))`;
      }
    );
    changed = true;
  }

  if (changed) fs.writeFileSync(filePath, code, "utf-8");
}

if (totalPatches === 0) console.log("patch-build-output: no patches applied (patterns not found)");
else console.log(`patch-build-output: applied ${totalPatches} patches`);
