# Data And Safety Plan

## Source Policy

Use official and public-interest sources first across senior welfare, care, medical support, mobility, facilities, and administration.

Primary source categories:

- 국민건강보험공단 노인장기요양보험
- 정부24
- 복지로
- 보건복지부
- 중앙치매센터 and local 치매안심센터 information
- 응급의료포털 E-Gen
- Public Data Portal datasets where stable and legally usable
- Local government senior welfare, transportation, care, and living-support pages

Secondary sources may support UX wording or general context, but they must not override official sources.

## Provenance Requirements

For each knowledge item, store:

- Source name
- Source URL
- Retrieved or reviewed date
- Topic category
- Region, if applicable
- Whether it is national or local
- Confidence level
- Notes on update frequency

## Suggested Knowledge Schema

```json
{
  "id": "ltc-application-overview",
  "title": "Long-term care recognition application overview",
  "category": "long_term_care",
  "region": "national",
  "source_name": "National Health Insurance Service Long-Term Care Insurance",
  "source_url": "https://www.longtermcare.or.kr/",
  "reviewed_at": "2026-06-24",
  "summary": "Plain-language summary goes here.",
  "eligibility_notes": ["Use cautious language and require official confirmation."],
  "next_actions": ["Contact NHIS long-term care insurance channel.", "Prepare family observation notes."],
  "confidence": "official_source",
  "must_confirm": true
}
```

## Privacy Rules

Do not collect:

- Resident registration number
- Exact home address
- Phone number
- Account or payment details
- Medical record files
- Facility contract documents

Allowed minimal context:

- Age range
- City/district
- Dementia status as described by family
- Long-term care grade status
- Mobility/daily-living support needs
- Living situation
- Family's current question
- Broad support goal such as welfare, medical, care, mobility, facility, administration, or unknown

## Medical And Legal Safety

The service must not:

- Diagnose dementia
- Determine official long-term care grade eligibility
- Guarantee benefit approval
- Guarantee facility admission, transportation support, or local benefit eligibility
- Recommend stopping or starting treatment
- Replace a medical professional, NHIS, local government office, or care institution

The service may:

- Explain official processes in plain language
- Route a family situation to likely support categories
- Help prepare questions
- Help organize family observations
- Point users to official institutions
- Summarize next actions

## Emergency Handling

If the user mentions immediate danger, severe confusion with risk, wandering, self-harm, violence, sudden acute symptoms, or inability to maintain safety:

- Stop normal guidance.
- Recommend contacting emergency services or an appropriate medical provider.
- Provide a short family safety checklist.
- Avoid lengthy policy explanations.

## Hallucination Controls

- Prefer retrieval from curated source records over model memory.
- Include "official confirmation needed" for eligibility-sensitive claims.
- If a requested region or institution is not in the data, say so clearly.
- Do not fabricate facility names, phone numbers, grade status, or local benefits.
- Keep "unknown" as a valid output state.

## Trust Features

- Source badges: official national, official local, public dataset, user-provided.
- "Why this is relevant" explanation.
- "What to verify by phone" checklist.
- Reviewed date for guidance.
- Clear separation between general guidance and official decisions.

## PlayMCP Operational Constraints

- Keep tool responses small and user-facing.
- Do not return raw official API payloads directly.
- Prefer concise markdown for normal text responses.
- Avoid OAuth and personal-data flows for the preliminary MVP unless absolutely necessary.
- If authentication is later added, implement MCP-standard OAuth and configure the PlayMCP redirect URI after registration.
- Avoid advertising, sponsored facility ranking, or lead-generation behavior.
- Keep the first version stateless. If profile memory is added later, make it explicit and privacy-reviewed.
