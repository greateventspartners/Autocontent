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

const targets = findFiles(outputDir, /\.(mjs|js)$/);
const ERROR_MSG = "An error occurred while loading the instrumentation hook";

let totalPatched = 0;

for (const filePath of targets) {
  let code = fs.readFileSync(filePath, "utf-8");

  if (!code.includes(ERROR_MSG)) continue;

  console.log(`Found instrumentation error in ${filePath}`);
  totalPatched++;

  const idx = code.indexOf(ERROR_MSG);
  if (idx < 0) continue;

  let throwStart = -1;
  for (let i = idx - 1; i >= Math.max(0, idx - 300); i--) {
    if (code.substring(i, i + 5) === "throw") {
      throwStart = i;
      break;
    }
  }

  if (throwStart < 0) {
    console.log("  Could not find 'throw' keyword before error message");
    continue;
  }

  let endIdx = idx + ERROR_MSG.length;
  let depth = 0;
  let foundFirst = false;
  for (let i = throwStart; i < code.length; i++) {
    if (code[i] === "(") { depth++; foundFirst = true; }
    if (code[i] === ")") { depth--; }
    if (foundFirst && depth === 0) {
      endIdx = i + 1;
      break;
    }
  }
  if (endIdx < code.length && code[endIdx] === ";") endIdx++;

  const patched = code.substring(0, throwStart) + "(void 0)" + code.substring(endIdx);
  fs.writeFileSync(filePath, patched, "utf-8");
  console.log(`  Patched: replaced throw statement at char ${throwStart}-${endIdx}`);
}

if (totalPatched === 0) {
  console.log("No instrumentation error found in any files");
}

console.log("Done");
