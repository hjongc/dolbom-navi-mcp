# AGENTIC PLAYER 10 Contest Strategy

## Strategy Summary

Win by solving a concrete family pain, not by building a broad generic assistant.

The chosen wedge is family senior-support navigation: helping families find the right path across welfare, care, medical support, mobility, facilities, local services, dementia, and long-term care grades.

## Why This Direction Is Strong

Previous MCP Player winners shared a pattern:

- They targeted a specific user with a painful, repeated workflow.
- They transformed scattered information into an actionable answer.
- They had a clear "why now" story and a believable user context.
- They were practical rather than only technically impressive.

This project follows that pattern:

- User: adult children and parents caring for grandparents.
- Pain: senior-support information is fragmented, emotionally stressful, and hard to act on.
- Workflow: explain situation, identify the right support area, prepare documents/questions, share with family.
- Distribution fit: KakaoTalk is a natural place for family coordination.

## Contest Criteria Mapping

### Creativity

The idea reframes senior support from "search for information" into "family decision navigation".

Differentiators:

- Family-share summaries
- Situation-aware checklists
- Multi-domain routing across welfare, medical, care, mobility, facility, and local services
- Dementia and long-term care path routing as high-empathy scenarios
- Facility/service consultation scripts

### Convenience

The service should answer the question families actually have:

"Which support area should we start from, and what should we do next this week?"

Convenience features:

- Plain Korean explanations
- Minimal intake questions
- Step-by-step next actions
- KakaoTalk-ready family message
- Phone-call, visit, and application-preparation checklists

### Stability

Trust is the central product quality.

Stability choices:

- Official-source-first data
- No diagnosis claims
- No guaranteed eligibility claims
- No sensitive identifiers
- Clear uncertainty and official-confirmation language
- Fail-fast errors when source data is unavailable

## Submission Narrative

Short version:

> Families do not struggle with elder care because there is no information. They struggle because dementia support, long-term care grades, and nursing home decisions are scattered across institutions and difficult to turn into action. `돌봄내비` helps families explain the situation once, then receive a source-backed next-step plan, facility checklist, and family-share summary.

Long version:

> I watched my parents struggle while looking for nursing homes and dementia/long-term care information for my grandparents. The hardest part was not simply searching. It was knowing where to start, what applied to our situation, what to ask institutions, and how to align the family. `돌봄내비` is a care navigation MCP for families. It organizes the elderly person's situation, explains likely official pathways, prepares questions for care facilities and institutions, and creates a concise KakaoTalk-ready summary for family discussion.

## MVP Scope For Preliminary Round

Build one focused flow:

1. User describes a senior-support or family-care situation.
2. Service classifies the situation into one or more pathways:
   - Welfare and public benefits
   - Medical or dementia support
   - Long-term care and daily support
   - Mobility and transportation
   - Facility or service comparison
   - Family coordination
3. Service returns:
   - Situation summary
   - Recommended first step
   - Checklist
   - Source-backed cautions
   - Family-share summary

## Timeline

Target: submit PlayMCP review by July 7, 2026 if possible.

| Date | Milestone |
| --- | --- |
| Jun 24-25 | Freeze brief, MVP flow, source plan |
| Jun 26-28 | Implement MCP server skeleton and first 3 tools |
| Jun 29-Jul 1 | Add source-backed knowledge layer and response templates |
| Jul 2-3 | Manual test with 30 realistic family scenarios |
| Jul 4-5 | Harden safety, errors, and PlayMCP registration copy |
| Jul 6-7 | Request PlayMCP review |
| Jul 8-14 | Fix review feedback and finalize preliminary submission |

## One-Person Execution Rule

Do not build a large care platform.

Build a reliable narrow agent that handles 4 high-frequency family questions extremely well:

1. "Which support category fits our situation?"
2. "Where do we start with dementia or suspected dementia?"
3. "How do we understand and prepare for long-term care grade application?"
4. "How do we compare facilities or services without being fooled by vague marketing?"

## Backlog After MVP

- Region-specific local benefit finder
- Official facility search integration
- Long-term care grade preparation wizard
- Family role assignment checklist
- Reminder generation for follow-up calls
- Care meeting agenda generator
- Kakao Tools widget rendering for checklist cards
