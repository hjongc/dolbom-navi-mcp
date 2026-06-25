# PlayMCP Redeploy Runbook

Use this before official PlayMCP review when the KC endpoint is reachable but stale.

## Current Evidence

- Latest GitHub `main`: `d615e669d182324caea332f19c6d77b075b3742a`
- Latest CI on `main`: passed
- KC server `dolbom-navi-v2` / ID `627`: `Active`
- KC endpoint: `https://dolbom-navi-v2.playmcp-endpoint.kakaocloud.io/mcp`
- Remote v2 is stale:
  - `smoke` fails because `analyze_family_care_situation` title is not Korean.
  - `quality:eval` fails because the official-source resource title is not Korean.
- KC detail UI shows only `중지` and `삭제`; no visible rebuild/redeploy action.
- PlayMCP developer-console draft `돌봄내비` still points to the old offline endpoint:
  - `https://dolbom-navi.playmcp-endpoint.kakaocloud.io/mcp`

## KC Endpoint Replacement

Preferred path if the account cannot create a third KC server:

1. In PlayMCP in KC, delete the stale `dolbom-navi-v2` server.
2. Create a new Git source build server.
3. Use these values:

| Field | Value |
| --- | --- |
| MCP server name | `dolbom-navi-v2` |
| Description | `부모님·조부모님 돌봄 상황에서 필요한 복지·의료·교통 등 공공 지원 정보를 공식 출처 기반으로 쉽게 찾아보고, 다음 행동까지 정리해주는 MCP입니다.` |
| Git URL | `https://github.com/hjongc/dolbom-navi-mcp` |
| Branch / ref | `main` |
| Dockerfile path | `Dockerfile` |
| PAT | empty, because the repository is public |

Alternative path if KC allows another server without deletion:

1. Create a replacement server with a new name such as `dolbom-navi-v3`.
2. Use the same Git source build values above.
3. Use the new endpoint in all remote checks and PlayMCP developer-console registration.

## Remote Verification Gate

Run these against the new KC endpoint before changing PlayMCP review state:

```bash
MCP_ENDPOINT=https://NEW-ENDPOINT.playmcp-endpoint.kakaocloud.io/mcp npm run smoke
MCP_ENDPOINT=https://NEW-ENDPOINT.playmcp-endpoint.kakaocloud.io/mcp npm run quality:eval
OPENROUTER_API_KEY=... MCP_ENDPOINT=https://NEW-ENDPOINT.playmcp-endpoint.kakaocloud.io/mcp npm run llm:eval
```

Expected result:

- `smoke` passes with protocol `2025-11-25` and 6 tools.
- `quality:eval` passes Korean tool titles, Korean input schema descriptions, Korean source resource metadata, safety outputs, mobility priority, facility-ranking avoidance, and sensitive-identifier redaction.
- `llm:eval` passes 10/10 model-connected scenarios, including diagnosis overclaim, long-term-care grade guarantee, facility ranking, and sensitive-data prompt-injection pressure.

Also run the source gate before final review:

```bash
npm run source:check
```

## PlayMCP Developer Console Update

The existing draft currently shows:

- Service name: `돌봄내비`
- Status: `심사 중`
- MCP status: `Offline`
- Endpoint: old `dolbom-navi` endpoint

Before official review, the draft must point to the latest-code endpoint that passed the remote gate.

If the draft cannot be edited while `심사 중`:

1. Create a new temporary registration with the latest endpoint, or cancel/delete the stale draft if the console allows it.
2. Reuse the current service copy and examples from `docs/submission-checklist.md`.
3. Confirm the temporary registration status becomes online/reachable.
4. Only then request final PlayMCP review.

## Do Not Claim Ready Until

- Latest-code KC endpoint passes remote `smoke`.
- Latest-code KC endpoint passes remote `quality:eval`.
- Latest-code KC endpoint passes remote expanded `llm:eval`.
- PlayMCP developer console points to that same endpoint.
- Temporary/private PlayMCP testing works from the console.
