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
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern));
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch { }
  return results;
}

const ERROR_MSG_1 = "An error occurred while loading the instrumentation hook";
const ERROR_MSG_2 = "Dynamic require";

const targets = findFiles(outputDir, /\.(mjs|js)$/);
let totalPatched = 0;

for (const filePath of targets) {
  let code = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  if (code.includes(ERROR_MSG_1)) {
    console.log(`Found instrumentation error in ${filePath}`);
    totalPatched++;
    const idx = code.indexOf(ERROR_MSG_1);
    if (idx >= 0) {
      let throwStart = -1;
      for (let i = idx - 1; i >= Math.max(0, idx - 300); i--) {
        if (code.substring(i, i + 5) === "throw") {
          throwStart = i;
          break;
        }
      }
      if (throwStart >= 0) {
        let endIdx = idx + ERROR_MSG_1.length;
        let depth = 0;
        let foundFirst = false;
        for (let i = throwStart; i < code.length; i++) {
          if (code[i] === "(") { depth++; foundFirst = true; }
          if (code[i] === ")") { depth--; }
          if (foundFirst && depth === 0) { endIdx = i + 1; break; }
        }
        if (endIdx < code.length && code[endIdx] === ";") endIdx++;
        code = code.substring(0, throwStart) + "(void 0)" + code.substring(endIdx);
        changed = true;
        console.log(`  Patched: suppressed throw at char ${throwStart}`);
      }
    }
  }

  if (code.includes("INSTRUMENTATION_HOOK_FILENAME")) {
    const requirePattern = /require\([^)]*INSTRUMENTATION_HOOK_FILENAME[^)]*\)/g;
    const matches = code.match(requirePattern);
    if (matches) {
      console.log(`Found INSTRUMENTATION_HOOK_FILENAME require() in ${filePath}`);
      totalPatched++;
      for (const match of matches) {
        console.log(`  Replacing: ${match.substring(0, 80)}...`);
      }
      code = code.replace(requirePattern, "null");
      changed = true;
      console.log(`  Replaced ${matches.length} require() call(s) with null`);
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, code, "utf-8");
  }
}

if (totalPatched === 0) {
  console.log("No instrumentation issues found in any files");
}

console.log("Done");
