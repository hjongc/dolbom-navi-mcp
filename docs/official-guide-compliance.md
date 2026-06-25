# Official Guide Compliance

This repository was shaped by the official contest and PlayMCP guide documents supplied by the user.

## Referenced Official Documents

- AGENTIC PLAYER 10 contest page
- Agentic Player 10 participation guide
- PlayMCP in KC required notes
- PlayMCP in KC Git source build guide
- PlayMCP in KC container image guide
- PlayMCP server development guide

## Implementation Decisions

| Guide Requirement | Implementation |
| --- | --- |
| Use PlayMCP in KC for contest endpoint issuance | `docs/playmcp-kc-setup.md` uses Git source build as the primary deployment path. |
| Remote MCP server only | `src/server.ts` exposes `POST /mcp` over HTTP. |
| Streamable HTTP only | Server uses `StreamableHTTPServerTransport`. |
| Stateless recommended | `sessionIdGenerator: undefined`; no database or server-side session state. |
| 3-10 tools recommended | Server exposes 10 tools. |
| Tool names use only allowed characters | Smoke test enforces `^[A-Za-z0-9_-]{1,128}$`. |
| No `kakao` in server/tool names | Server name is `dolbom-navi`; smoke test rejects forbidden tool names. |
| Required tool annotations | Every tool sets `title`, `readOnlyHint`, `destructiveHint`, `openWorldHint`, and `idempotentHint`. |
| Compact tool results | Tools return concise markdown text, not raw official API payloads. |
| Avoid advertising behavior | Facility tool avoids rankings, ads, sponsored recommendations, and unverified reviews. |
| Docker deployment path | Root `Dockerfile` and `.dockerignore` are included. |
| linux/amd64 image requirement for container path | Docker verification command uses `--platform linux/amd64`; CI is configured to build linux/amd64. |
| MCP Inspector validation | Inspector CLI passed for tool listing, representative tool call, resource listing, and official source registry read. |

## Source Trust Policy

The first release uses curated official/public-agency source records instead of live scraping. This keeps the service deterministic, fast, and safe for review while still giving users official confirmation paths.

Primary sources include:

- 국민건강보험공단 노인장기요양보험
- 정부24
- 복지로
- 보건복지부
- 중앙치매센터
- 응급의료포털 E-Gen
- 거주지 시·군·구청 공식 누리집
- 119
- 경찰청 112

## Current External Status

The repository now exposes the 10-tool build locally. Before public/final submission, the PlayMCP in KC endpoint must be redeployed from the latest commit and rechecked with:

- `MCP_ENDPOINT=<new endpoint> npm run smoke`
- `MCP_ENDPOINT=<new endpoint> npm run quality:eval`
- `OPENROUTER_API_KEY=... MCP_ENDPOINT=<new endpoint> npm run llm:eval`

Remaining external steps are latest-code PlayMCP in KC redeploy, developer-console temporary/private testing, review request, public visibility after approval, and AGENTIC PLAYER 10 preliminary submission.
