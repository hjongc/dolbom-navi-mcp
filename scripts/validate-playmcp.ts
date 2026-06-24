import { readFileSync } from "node:fs";
import { SOURCES } from "../src/sources.js";

const requiredFiles = [
  "Dockerfile",
  ".dockerignore",
  ".github/workflows/ci.yml",
  "README.md",
  "docs/playmcp-kc-setup.md",
  "docs/official-guide-compliance.md",
  "docs/verification.md"
];

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  name: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

for (const file of requiredFiles) {
  readFileSync(file, "utf8");
}

assert(!/kakao/i.test(packageJson.name), "package name must not include kakao");
assert(packageJson.dependencies?.["@modelcontextprotocol/sdk"] === "1.29.0", "MCP SDK version must be pinned");
assert(packageJson.scripts?.build, "build script is required");
assert(packageJson.scripts?.test, "test script is required");
assert(packageJson.scripts?.smoke, "smoke script is required");

const dockerfile = readFileSync("Dockerfile", "utf8");
assert(/EXPOSE 3000/.test(dockerfile), "Dockerfile must expose port 3000");
assert(/CMD \["node", "dist\/src\/server\.js"\]/.test(dockerfile), "Dockerfile CMD must start built server");

const ci = readFileSync(".github/workflows/ci.yml", "utf8");
assert(/docker build --platform linux\/amd64/.test(ci), "CI must verify linux/amd64 Docker build");
assert(/npm run smoke/.test(ci), "CI must run MCP smoke test");

const categories = new Set(SOURCES.map(source => source.category));
for (const category of ["long_term_care", "welfare", "medical", "dementia", "mobility", "facility", "emergency", "local_government"]) {
  assert(categories.has(category as never), `source category missing: ${category}`);
}

const sourceNames = SOURCES.map(source => source.sourceName);
for (const expected of ["국민건강보험공단 노인장기요양보험", "정부24", "복지로", "보건복지부", "중앙치매센터", "응급의료포털 E-Gen", "119", "경찰청 112"]) {
  assert(sourceNames.some(name => name.includes(expected)), `official source missing: ${expected}`);
}

console.log("PlayMCP deployment validation passed");
