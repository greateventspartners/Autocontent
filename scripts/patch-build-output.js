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

for (const filePath of targets) {
  let code = fs.readFileSync(filePath, "utf-8");
  let original = code;
  let pos = code.indexOf(ERROR_MSG);

  if (pos < 0) continue;

  console.log(`Found instrumentation error in ${filePath}`);

  // Walk backwards to find `throw` (the keyword right before the Object.defineProperty)
  let throwPos = -1;
  for (let i = pos; i >= 0; i--) {
    const snippet = code.substring(i, i + 5);
    if (snippet === "throw") {
      // Verify it's actually a throw keyword (not "throw" inside a string or variable)
      const before = i > 0 ? code[i - 1] : " ";
      const after = code[i + 5] || " ";
      if (/\s/.test(before) && /\s/.test(after)) {
        throwPos = i;
        break;
      }
    }
  }

  if (throwPos < 0) {
    console.log("  Could not find 'throw' before the error message");
    continue;
  }

  // Walk forward to find the end of the throw statement (the final ; or ))
  // Count parentheses to find matching close
  let parenCount = 0;
  let endPos = pos;
  // First, find the beginning of Object.defineProperty
  let objDefPos = code.indexOf("Object.defineProperty", pos - 80);
  if (objDefPos < 0 || objDefPos > pos) objDefPos = pos;
  
  // Count from objDefPos to find matching closing
  let started = false;
  for (let i = objDefPos; i < code.length; i++) {
    if (code[i] === "(") { parenCount++; started = true; }
    else if (code[i] === ")") { parenCount--; }
    if (started && parenCount === 0) {
      endPos = i;
      break;
    }
  }

  // The end of throw statement is endPos + 1 (the closing ) ) plus optional ;
  let stmtEnd = endPos + 1;
  // Skip the )
  // If next char is ;, include it
  if (stmtEnd < code.length && code[stmtEnd] === ";") stmtEnd++;

  // Replace the entire throw statement with a no-op
  const beforeThrow = code.substring(0, throwPos);
  const afterStmt = code.substring(stmtEnd);
  
  code = beforeThrow + "{/* instrumentation hook suppressed on edge */}" + afterStmt;

  if (code !== original) {
    fs.writeFileSync(filePath, code, "utf-8");
    console.log("  Patched successfully");
  }
}

console.log("Done");
