/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const files = [
  "next/dist/esm/server/lib/router-utils/instrumentation-globals.external.js",
  "next/dist/server/lib/router-utils/instrumentation-globals.external.js",
];

let patched = 0;

for (const relPath of files) {
  const filePath = path.resolve(__dirname, "../node_modules", relPath);
  if (!fs.existsSync(filePath)) continue;

  let code = fs.readFileSync(filePath, "utf-8");

  const origPattern =
    /cachedInstrumentationModule\s*=\s*interopRequireDefault\(\s*await\s*require\([\s\S]*?\)\s*\)\s*\)\s*;?/;

  if (origPattern.test(code)) {
    code = code.replace(origPattern, "cachedInstrumentationModule = null;");
    fs.writeFileSync(filePath, code, "utf-8");
    patched++;
    console.log(`Patched ${relPath} (interopRequireDefault → null)`);
    continue;
  }

  const altPattern =
    /cachedInstrumentationModule\s*=\s*interopDefault\(\s*await\s*require\([\s\S]*?\)\s*\)\s*\)\s*;?/;

  if (altPattern.test(code)) {
    code = code.replace(altPattern, "cachedInstrumentationModule = null;");
    fs.writeFileSync(filePath, code, "utf-8");
    patched++;
    console.log(`Patched ${relPath} (interopDefault → null)`);
    continue;
  }

  const cjsPattern =
    /cachedInstrumentationModule\s*=\s*\(0,.*?\)\(\s*await\s*require\([\s\S]*?\)\s*\)\s*,\s*cachedInstrumentationModule/;

  if (cjsPattern.test(code)) {
    code = code.replace(cjsPattern, "cachedInstrumentationModule = null");
    fs.writeFileSync(filePath, code, "utf-8");
    patched++;
    console.log(`Patched ${relPath} (CJS require → null)`);
    continue;
  }

  if (code.includes("require") && code.includes("INSTRUMENTATION_HOOK_FILENAME")) {
    const genericPattern =
      /cachedInstrumentationModule\s*=\s*[\s\S]*?require\([\s\S]*?INSTRUMENTATION_HOOK_FILENAME[\s\S]*?\)[\s\S]*?cachedInstrumentationModule/;

    if (genericPattern.test(code)) {
      code = code.replace(genericPattern, "cachedInstrumentationModule = null");
      fs.writeFileSync(filePath, code, "utf-8");
      patched++;
      console.log(`Patched ${relPath} (generic require → null)`);
    }
  }
}

if (patched === 0) {
  console.log("patch-instrumentation: no files to patch (already patched or not found)");
}
