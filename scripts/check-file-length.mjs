import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_LINES = 200;
const ROOTS = ["packages"];
const EXTENSIONS = [".ts", ".tsx", ".vue", ".mjs"];
const IGNORED = new Set(["node_modules", "dist", "__generated__"]);

const collect = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (IGNORED.has(entry)) {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collect(full));
    } else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
};

const offenders = [];
for (const root of ROOTS) {
  for (const file of collect(root)) {
    const lineCount = readFileSync(file, "utf8").split("\n").length;
    if (lineCount > MAX_LINES) {
      offenders.push({ file, lineCount });
    }
  }
}

if (offenders.length > 0) {
  console.error(`Files exceeding the ${MAX_LINES}-line limit:`);
  for (const { file, lineCount } of offenders) {
    console.error(`  ${file} (${lineCount} lines)`);
  }
  process.exit(1);
}

console.log(`All files are within the ${MAX_LINES}-line limit.`);
