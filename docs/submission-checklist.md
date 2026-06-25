# Submission Checklist

## Contest Critical Path

- [x] Create Kakao Cloud MCP server endpoint.
- [ ] Register MCP server in PlayMCP developer console.
- [ ] Test as temporary registration before final review request.
- [ ] Request PlayMCP review for final submission server.
- [ ] After review approval, change visibility from "private to me" to "public".
- [ ] Submit through the AGENTIC PLAYER 10 preliminary participation button.
- [ ] Do not miss that final submission is one-time only.

## Recommended Deadline

Aim to request PlayMCP review by July 7, 2026.

Reason: the contest page says PlayMCP server review can take up to 7 business days, and review requests by July 7 are expected to be reviewed by July 10. Later requests may be hard to finish before the July 14 preliminary deadline.

## Preliminary Submission Copy

### Service Name

돌봄내비

### One-Line Description

부모님·조부모님 돌봄 앞에서 복지, 의료, 교통, 요양, 시설 정보를 어디서부터 봐야 할지 막막한 가족에게 공식 정보 기반의 다음 행동 체크리스트를 만들어주는 돌봄 길잡이입니다.

### Problem

부모님 세대가 조부모님을 챙기면서 복지 혜택, 의료 지원, 교통/동행, 돌봄 서비스, 요양원, 치매 지원, 장기요양등급 정보를 찾을 때 정보가 여러 기관에 흩어져 있어 어디서부터 시작해야 할지 판단하기 어렵습니다.

### Solution

가족 상황을 자연어로 입력하면 돌봄내비가 복지, 의료, 교통, 돌봄, 요양/시설, 장기요양, 치매 지원, 가족 논의 중 어떤 경로가 필요한지 분류하고, 공식 출처 기반 설명과 이번 주 실행 체크리스트, 가족 단톡방 공유 요약을 제공합니다.

### Why It Matters

가족 돌봄은 갑자기 시작되지만, 필요한 제도와 서비스 선택은 복잡합니다. 돌봄내비는 검색 시간을 줄이고 가족이 같은 정보를 바탕으로 빠르게 다음 행동을 정할 수 있도록 돕습니다.

### Demo Scenarios

1. "부모님이 할머니 돌봄 문제로 막막해하시는데 복지, 의료, 교통, 요양 중 어디서부터 봐야 하나요?"
2. "할머니가 치매 의심 증상이 있는데 장기요양등급부터 신청해야 할까요?"
3. "아버지가 병원 이동이 힘든데 교통이나 동행 지원이 있을까요?"
4. "요양원 상담 전화 전에 어떤 질문을 해야 하나요?"
5. "이 상황을 가족 단톡방에 공유할 수 있게 정리해줘."

## Manual QA

- [x] Suspected dementia flow avoids diagnosis.
- [x] Long-term care grade flow avoids guaranteed eligibility.
- [x] Facility comparison flow avoids fabricated ranking.
- [x] Missing region asks a concise follow-up.
- [x] Emergency-like scenario triggers safety response.
- [x] Source unavailable state fails clearly.
- [x] Family-share summary is concise and readable.
- [x] No sensitive personal identifiers are requested.
- [x] MCP server uses Streamable HTTP.
- [x] MCP Inspector CLI passes.
- [x] MCP protocol version is within PlayMCP-supported range.
- [x] Every tool has required annotations.
- [x] Tool names use only allowed characters.
- [x] Tool/server names do not include `kakao`.
- [x] Tool count is between 3 and 10.
- [x] Tool responses are compact and not raw API dumps.
- [x] Tool latency is checked, especially p99 under 3 seconds.

## Current Verification

- Latest 10-tool scenario expansion on 2026-06-25:
  - Final tool set: existing broad analysis, routing, long-term-care path, dementia checklist, care option comparison, and family-share summary tools remain.
  - Added tools: `find_local_support_contacts`, `prepare_institution_call_script`, `check_urgent_care_need`, and `explain_care_service_types`.
  - `npm run verify`: passed, 21 tests.
  - `MCP_ENDPOINT=http://127.0.0.1:3920/mcp npm run smoke`: passed; protocol `2025-11-25`, 10 tools, avg latency 2.8ms, max 5.9ms.
  - `MCP_ENDPOINT=http://127.0.0.1:3920/mcp npm run quality:eval`: passed deterministic MCP scenarios for existing safety behavior plus local contact lookup, call-script preparation, urgent triage, and service-type explanation.
  - `npm run source:check`: passed for official national/public sources and 16 regional mobility-contact URLs.
  - `OPENROUTER_API_KEY=... MCP_ENDPOINT=http://127.0.0.1:3921/mcp npm run llm:eval`: passed 12/12 local LLM-connected scenarios after tightening the evaluator to accept equivalent official-confirmation wording.
  - Remote endpoint still needs redeploy/recheck before claiming the public PlayMCP server has the 10-tool build.

- `npm install --cache .npm-cache`: passed, 0 vulnerabilities.
- `npm run build`: passed.
- `npm test`: passed, 17 tests.
- Source unavailable failure path: covered by `source unavailable state fails clearly`.
- Source confidence badges, family-share summaries, and sensitive number redaction: covered by domain tests.
- `MCP_ENDPOINT=http://127.0.0.1:3911/mcp npm run smoke`: passed against the latest local Streamable HTTP endpoint; checked MCP protocol `2025-11-25`, 6 tools, Korean tool descriptions, required annotations, allowed tool-name characters, no forbidden server/tool naming, and repeated call latency under 3 seconds. Latest local repeated-call latency: avg 6.9ms, max 17.4ms.
- `OPENROUTER_API_KEY=... MCP_ENDPOINT=http://127.0.0.1:3911/mcp npm run llm:eval`: passed 6/6 local LLM-connected scenarios using `openai/gpt-4.1-mini`.
- Latest metadata/product-quality pass after commit `5064076`:
  - `npm run verify`: passed, 17 tests.
  - `MCP_ENDPOINT=http://127.0.0.1:3912/mcp npm run smoke`: passed; now also checks Korean tool titles and Korean input schema descriptions.
  - `MCP_ENDPOINT=http://127.0.0.1:3912/mcp npm run quality:eval`: passed deterministic MCP quality scenarios.
  - `OPENROUTER_API_KEY=... MCP_ENDPOINT=http://127.0.0.1:3912/mcp npm run llm:eval`: passed 6/6 local LLM-connected scenarios.
- Latest source/data gate:
  - `npm run source:check`: passed.
  - Verified official source and mobility-contact URL reachability for all registered source URLs.
  - Confirmed 16 regional mobility contact records include phone numbers.
- Latest expanded local MCP/LLM safety gate:
  - `MCP_ENDPOINT=http://127.0.0.1:3914/mcp npm run smoke`: passed.
  - `MCP_ENDPOINT=http://127.0.0.1:3914/mcp npm run quality:eval`: passed.
  - `OPENROUTER_API_KEY=... MCP_ENDPOINT=http://127.0.0.1:3914/mcp npm run llm:eval`: passed 10/10 scenarios using `openai/gpt-4.1-mini`.
  - Added coverage for diagnosis overclaim pressure, long-term-care grade guarantee pressure, facility-ranking/advertising pressure, and sensitive-identifier prompt injection.
- `npm run validate:playmcp`: passed; checks required deploy files, pinned SDK, Dockerfile command, CI smoke/Docker build, and official source registry coverage.
- MCP Inspector CLI: passed for `tools/list`, `resources/list`, and `resources/read`; Inspector scripts now use repo-local `.npm-cache`.
- `MCP_ALLOWED_HOSTS=127.0.0.1,localhost npm start`: passed without the SDK DNS rebinding warning; invalid `Host: evil.example` returns `403`.
- `curl http://127.0.0.1:3000/healthz`: passed.
- `docker build --platform linux/amd64 -t dolbom-navi-mcp:local .`: passed.
- Container smoke test on `http://127.0.0.1:3100/mcp`: passed; latest repeated-call latency avg 8.9ms, max 14.9ms.
- Historical PlayMCP in KC Git-source deployment from GitHub `main` commit `0f793c8`: passed on 2026-06-24.
- Current remote status on 2026-06-25: latest KC endpoint is live and verified.
  - Fresh PlayMCP in KC endpoint `https://dolbom-navi.playmcp-endpoint.kakaocloud.io/mcp`: Active.
  - Server ID: `631`; build job: `mcp-build-apply-631`.
  - `MCP_ENDPOINT=https://dolbom-navi.playmcp-endpoint.kakaocloud.io/mcp npm run smoke`: passed; protocol `2025-11-25`, 6 tools, avg latency 24.7ms, max 53.7ms.
  - `MCP_ENDPOINT=https://dolbom-navi.playmcp-endpoint.kakaocloud.io/mcp npm run quality:eval`: passed deterministic MCP quality scenarios.
  - `OPENROUTER_API_KEY=... MCP_ENDPOINT=https://dolbom-navi.playmcp-endpoint.kakaocloud.io/mcp npm run llm:eval`: passed 10/10 remote LLM-connected scenarios.
  - `npm run source:check`: passed after remote endpoint verification.
  - PlayMCP developer-console temporary registration for `돌봄내비` now shows `MCP 상태 Online`.
  - Remaining before public/final claim: confirm review status and follow the PlayMCP review/public visibility flow in the console.
