# Verification Log

## 2026-06-24

### Passed

- Installed dependencies with `npm install --cache .npm-cache`.
- Confirmed dependency audit result: 0 vulnerabilities.
- Built TypeScript with `npm run build`.
- Ran domain tests with `npm test`.
  - 12 tests passed.
  - Includes explicit failure coverage for empty official-source rendering.
  - Includes regression coverage for medical and administration support routing.
  - Includes regression coverage for facility comparison using care needs and family priorities.
  - Includes regression coverage for source confidence badges, family-share summaries, and sensitive number redaction.
- Started the Streamable HTTP server with `npm start`.
- Confirmed health endpoint:
  - `GET /healthz`
  - Response includes `transport: streamable-http` and `stateless: true`.
- Ran MCP client smoke test with `npm run smoke`.
  - Confirmed negotiated MCP protocol version: `2025-11-25`.
  - Listed 6 tools.
  - Confirmed tool count is within PlayMCP recommended range.
  - Confirmed server name is present and does not include the forbidden `kakao` string.
  - Confirmed no tool names include forbidden `kakao` string.
  - Confirmed tool names use only PlayMCP-allowed characters.
  - Confirmed every tool exposes required annotation fields.
  - Called `analyze_family_care_situation` successfully.
  - Confirmed the representative tool response includes family-share summary and source confidence badges.
  - Repeated local tool call latency after protocol and identity hardening: avg 3.1ms, max 7.9ms.
- Ran MCP Inspector CLI checks against `http://127.0.0.1:3000/mcp`.
  - `tools/list`: passed and returned 6 annotated tools.
  - `tools/call` for `analyze_family_care_situation`: passed.
  - `resources/list`: passed and returned `dolbom-navi://sources/official`.
  - `resources/read` for the official source registry: passed.
- Built the deploy image for the PlayMCP container requirement:
  - `docker build --platform linux/amd64 -t dolbom-navi-mcp:local .`
- Ran the built image locally:
  - `docker run --rm -d --name dolbom-navi-mcp-smoke -p 3100:3000 dolbom-navi-mcp:local`
  - `curl http://127.0.0.1:3100/healthz`
  - `MCP_ENDPOINT=http://127.0.0.1:3100/mcp npm run smoke`
  - Container smoke latency: avg 8.9ms, max 14.9ms.
- Added `npm run validate:playmcp`.
  - Confirms required deployment files exist.
  - Confirms MCP SDK is pinned.
  - Confirms Dockerfile starts the built server and exposes port 3000.
  - Confirms CI includes smoke and linux/amd64 Docker build.
  - Confirms official source categories and required official source names are present.
- Confirmed Inspector scripts use the repo-local `.npm-cache` so they do not fail on a broken global npm cache.
- Confirmed optional `MCP_ALLOWED_HOSTS` host-header protection.
  - `MCP_ALLOWED_HOSTS=127.0.0.1,localhost npm start` starts without the SDK DNS rebinding warning.
  - Normal `127.0.0.1` health and MCP smoke calls pass.
  - `Host: evil.example` is rejected with `403 Invalid Host`.
- Confirmed user-provided resident-registration-like numbers and phone numbers are redacted in user-facing summaries while official source phone numbers remain available where intentionally curated.
- Added CI workflow for build, test, smoke, and linux/amd64 Docker build on GitHub-hosted runners.

### Not Verified Yet

- MCP Inspector browser UI review.
  - Inspector CLI passed, but the browser UI can still be used as a final manual sanity check before PlayMCP review.
- PlayMCP in KC Endpoint issuance.
  - Blocked externally by PlayMCP in KC auth page showing `Internal Server Error: Failed to retrieve connector list.`
