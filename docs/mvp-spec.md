# MVP Specification

## Product Goal

Build a PlayMCP-compatible service that helps Korean families navigate senior support decisions across welfare, care, medical support, mobility, facilities, local benefits, dementia, and long-term care grades.

## Core Tools

PlayMCP development guide constraints:

- Support MCP protocol versions from `2025-03-26` through `2025-11-25`.
- Use Streamable HTTP transport only.
- Expose a remote MCP server through a public URL.
- Prefer stateless operation with no server-side session dependency.
- Use an actively maintained MCP SDK.
- Inspect the server with MCP Inspector before PlayMCP registration.
- Do not include `kakao` anywhere in the MCP server name or tool names, regardless of case.
- Keep tool names to English letters, numbers, underscore, and hyphen only.
- Keep total tool count at 3-10 tools for the first release.
- Include `name`, `description`, `inputSchema`, and `annotations` for every tool.
- Set all annotation fields: `title`, `readOnlyHint`, `destructiveHint`, `openWorldHint`, `idempotentHint`.
- Keep tool descriptions under 1,024 characters, write the user-facing description in natural Korean, and include the service name in the description.
- Keep tool results compact and return cleaned text/markdown rather than raw API payloads.
- Target average tool latency under 100ms where possible; p99 must stay under 3,000ms.
- Do not design tool responses to expose or induce advertising.

### 1. `analyze_family_care_situation`

Input:

- Natural language description of the elder's situation
- Optional region
- Optional age range
- Optional dementia status
- Optional long-term care grade status
- Optional mobility and daily living status
- Optional support area: welfare, medical, care, mobility, facility, administration, unknown

Output:

- Structured care profile
- Missing information questions
- Risk/urgency flags
- Recommended support categories and next workflows

Behavior:

- Ask for only information needed for care navigation.
- Do not ask for resident registration number, exact address, financial account details, or medical record files.
- If the user describes an emergency, advise calling emergency services or a medical provider instead of continuing normal guidance.

### 2. `route_support_options`

Input:

- Care profile
- User's main concern

Output:

- Matched support areas
- Why each area may be relevant
- Recommended first contact or source category
- Official regional mobility center contact when a verified representative number is available
- Missing facts to confirm
- This week's action checklist

Behavior:

- Use cautious language: "may be relevant", "needs official confirmation", "prepare to ask".
- Never guarantee benefit eligibility, grade approval, medical outcome, or facility admission.

### 3. `explain_long_term_care_path`

Input:

- Care profile
- Whether long-term care grade has already been received

Output:

- Explanation of long-term care recognition process
- Who usually applies or contacts the institution
- What facts/documents to prepare
- What the family can do this week
- Official source links

Behavior:

- Treat this as one workflow among several, not the entire product.
- Use cautious language and require official confirmation for eligibility-sensitive claims.

### 4. `build_dementia_care_checklist`

Input:

- Dementia status: suspected, diagnosed, unknown, severe symptoms
- Region if available

Output:

- Diagnosis/support path overview
- Family observation checklist
- Questions to ask clinic, dementia center, or local institution
- Next action checklist

Behavior:

- Do not diagnose dementia.
- Encourage professional evaluation when symptoms are suspected.

### 5. `compare_care_or_support_options`

Input:

- Region
- Desired support or facility type if known
- Care needs
- Family priorities

Output:

- Facility/service comparison criteria
- Phone consultation script
- Visit checklist
- Red flags to watch
- Official search/source links where possible

Behavior:

- Prefer official facility search and evaluation sources.
- Avoid ranking facilities or services without verified data.

### 6. `find_local_support_contacts`

Input:

- Natural language care situation
- Region
- Support area if known
- Mobility status if relevant

Output:

- Prioritized official contact paths
- Local mobility support contact when a verified representative contact exists
- What to prepare before calling
- Official source links

Behavior:

- Do not fabricate local phone numbers or facility names.
- If the region is missing, ask for the city/district instead of pretending to localize.

### 7. `prepare_institution_call_script`

Input:

- Natural language care situation
- Institution type: NHIS, dementia center, local government, medical provider, mobility center, care facility, or unknown
- Region
- Main concern

Output:

- First sentence for the phone call
- Official-confirmation questions
- Notes to capture during the call
- Source-backed caution about sensitive data

Behavior:

- Prepare users to ask better questions without deciding eligibility, diagnosis, facility fit, or costs.
- Do not ask the user to enter resident registration numbers, exact addresses, payment information, or medical files.

### 8. `check_urgent_care_need`

Input:

- Natural language situation
- Dementia status if known
- Recent sudden change
- Safety concern

Output:

- Whether the situation should prioritize 112, 119, or immediate medical contact
- Short family safety checklist
- Post-safety follow-up path

Behavior:

- If emergency-like language is present, stop normal navigation and surface safety-first guidance.
- Do not diagnose the cause of acute symptoms.

### 9. `explain_care_service_types`

Input:

- Situation
- Service type if known
- Region
- Care needs

Output:

- Plain-language difference between common care service types
- When each type may fit
- Official facts to verify before deciding

Behavior:

- Distinguish medical institution needs from daily living support needs.
- Do not rank or recommend a specific provider from unverified reviews.

### 10. `make_family_share_summary`

Input:

- Care profile
- Recommended path
- Checklist

Output:

- KakaoTalk-ready family summary
- "이번 주 할 일" checklist
- "가족에게 확인할 것" checklist

Behavior:

- Keep summary concise and non-alarming.
- Avoid exposing sensitive health details unless the user provided them and asks to include them.

## MVP Data Sources

Priority 1 official sources:

- 국민건강보험공단 노인장기요양보험: long-term care insurance, long-term care recognition, care institution information.
- 정부24: government services, benefit discovery, senior-related services.
- 중앙치매센터 and 치매안심센터 sources: dementia support and local dementia service pathways.
- 보건복지부: senior care policy and official announcements.
- Local government senior welfare pages: region-specific welfare, mobility, care, and living support programs.
- Official metropolitan 교통약자 이동지원센터 pages for representative mobility-support contact numbers.

Priority 2 structured/public sources:

- Public data portal datasets related to long-term care institutions or senior welfare facilities, if API access is stable.
- Local government senior welfare pages for region-specific benefits.

Avoid for MVP:

- Blog-only medical claims
- Ad-heavy nursing home recommendation pages
- User reviews as authoritative ranking data
- Scraped private personal data

## Response Quality Requirements

Every substantial answer should include:

- Situation summary
- Matched support area
- Recommended next step
- Why this path is relevant
- What to prepare
- What needs official confirmation
- Source links or source names
- Family-share summary when useful

## Fail-Fast Rules

- If official data cannot be loaded, return a clear data-source error.
- If region is required but missing, ask one concise follow-up question.
- If the user asks for diagnosis or guaranteed eligibility, refuse that framing and provide a safe navigation path.
- If the request involves emergency symptoms, surface emergency guidance instead of normal service flow.

## Evaluation Queries

Use these as early manual tests:

1. "부모님이 할머니 돌봄 정보를 찾기 힘들어하세요. 복지, 의료, 요양 중 어디서부터 봐야 해요?"
2. "할머니가 82세이고 치매 의심 증상이 있어요. 장기요양등급을 받아야 하나요?"
3. "아버지가 병원 이동이 힘든데 교통 지원이나 동행 서비스가 있을까요?"
4. "요양원 상담 전에 뭘 물어봐야 할지 모르겠어요."
5. "서울 관악구에서 치매 관련 도움을 어디에 문의해야 해?"
6. "장기요양등급 신청 절차를 가족 단톡방에 공유할 수 있게 정리해줘."
7. "아직 진단은 없는데 밤에 배회가 있어요. 어떻게 해야 해?"
8. "요양원과 요양병원 차이를 쉽게 설명해줘."
9. "등급이 없으면 요양원 입소가 불가능한가요?"
10. "가족들이 의견이 달라서 이번 주 논의할 체크리스트가 필요해요."

## Acceptance Criteria

- A first-time user can understand which support area to start from within one response.
- The service does not pretend to diagnose dementia or decide eligibility.
- The service provides at least one concrete next action.
- The service can produce a family-shareable summary.
- The service cites or names official source categories.
- The service fails clearly when source-backed data is unavailable.
- MCP Inspector passes before PlayMCP registration.
- Every tool includes required PlayMCP-compatible annotations.
- Tool count remains within the 3-10 recommended range.
- Tool names do not include `kakao`.
- Local contact, phone-script, urgent-safety, and service-type scenarios are covered by deterministic tests.
