import { readFileSync } from "node:fs";
import { MOBILITY_CONTACTS, SOURCES } from "../src/sources.js";

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
assert(packageJson.scripts?.["quality:eval"], "quality:eval script is required");
assert(packageJson.scripts?.["source:check"], "source:check script is required");
assert(packageJson.scripts?.inspect?.includes("--cache .npm-cache"), "inspector scripts must use repo-local npm cache");
assert(packageJson.scripts?.["inspect:tools"]?.includes("--cache .npm-cache"), "inspect:tools must use repo-local npm cache");
assert(packageJson.scripts?.["inspect:resources"]?.includes("--cache .npm-cache"), "inspect:resources must use repo-local npm cache");

const dockerfile = readFileSync("Dockerfile", "utf8");
assert(/EXPOSE 3000/.test(dockerfile), "Dockerfile must expose port 3000");
assert(/CMD \["node", "dist\/src\/server\.js"\]/.test(dockerfile), "Dockerfile CMD must start built server");

const server = readFileSync("src/server.ts", "utf8");
assert(/MCP_ALLOWED_HOSTS/.test(server), "server must support MCP_ALLOWED_HOSTS for host header protection on public deployments");
assert(/name:\s*"dolbom-navi"/.test(server), "MCP server name must be the contest-facing dolbom-navi name");
assert(!/name:\s*"[^"]*kakao[^"]*"/i.test(server), "MCP server name must not include kakao");

const smoke = readFileSync("scripts/smoke.ts", "utf8");
assert(/supportedPlayMcpProtocolVersions/.test(smoke), "smoke test must verify PlayMCP-supported MCP protocol negotiation");
assert(/getServerVersion/.test(smoke), "smoke test must verify MCP server identity");
assert(/assertInputSchemaDescriptions/.test(smoke), "smoke test must verify Korean input schema descriptions");

const qualityEval = readFileSync("scripts/quality-eval.ts", "utf8");
assert(/make_family_share_summary/.test(qualityEval), "quality eval must cover family-share output");
assert(/build_dementia_care_checklist/.test(qualityEval), "quality eval must cover dementia safety output");
assert(/compare_care_or_support_options/.test(qualityEval), "quality eval must cover facility comparison output");
assert(/dolbom-navi:\/\/sources\/official/.test(qualityEval), "quality eval must cover official source registry resource");

const sourceCheck = readFileSync("scripts/check-sources.ts", "utf8");
assert(/SOURCE_CHECK_TIMEOUT_MS/.test(sourceCheck), "source check must support a timeout override");
assert(/MOBILITY_CONTACTS/.test(sourceCheck), "source check must cover mobility contacts");
assert(/SOURCES/.test(sourceCheck), "source check must cover official sources");

const ci = readFileSync(".github/workflows/ci.yml", "utf8");
assert(/docker build --platform linux\/amd64/.test(ci), "CI must verify linux/amd64 Docker build");
assert(/MCP_ENDPOINT=http:\/\/127\.0\.0\.1:3000\/mcp npm run smoke/.test(ci), "CI must run MCP smoke test with an explicit endpoint");
assert(/MCP_ENDPOINT=http:\/\/127\.0\.0\.1:3000\/mcp npm run quality:eval/.test(ci), "CI must run deterministic MCP quality eval with an explicit endpoint");

const categories = new Set(SOURCES.map(source => source.category));
for (const category of ["long_term_care", "welfare", "medical", "dementia", "mobility", "facility", "emergency", "local_government"]) {
  assert(categories.has(category as never), `source category missing: ${category}`);
}

const sourceNames = SOURCES.map(source => source.sourceName);
for (const expected of ["국민건강보험공단 노인장기요양보험", "정부24", "복지로", "보건복지부", "중앙치매센터", "응급의료포털 E-Gen", "119", "경찰청 112"]) {
  assert(sourceNames.some(name => name.includes(expected)), `official source missing: ${expected}`);
}

for (const expected of ["서울", "부산", "경기", "인천", "대구", "대전", "광주", "울산", "세종", "강원", "충남", "전북", "전남", "경북", "경남", "제주"]) {
  assert(
    MOBILITY_CONTACTS.some(contact => contact.regions.includes(expected) && contact.phoneNumbers.length > 0),
    `official mobility contact missing: ${expected}`
  );
}

console.log("PlayMCP deployment validation passed");
