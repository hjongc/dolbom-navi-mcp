import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeFamilyCareSituation,
  buildDementiaCareChecklist,
  compareCareOrSupportOptions,
  makeFamilyShareSummary,
  routeSupportOptions
} from "./domain.js";
import { mobilityContactsFor, renderSources } from "./sources.js";

test("analyzes broad family care situation across multiple support domains", () => {
  const output = analyzeFamilyCareSituation({
    situation: "부모님이 할머니 돌봄 정보를 찾기 힘들어하세요. 복지, 의료, 요양 중 어디서부터 봐야 하나요?",
    region: "서울 관악구",
    ageRange: "80대"
  });

  assert.match(output, /먼저 볼 지원 영역/);
  assert.match(output, /공식 출처/);
  assert.match(output, /정부24/);
  assert.match(output, /국민건강보험공단/);
  assert.match(output, /\[official_national\]/);
  assert.match(output, /가족 공유 요약/);
  assert.doesNotMatch(output, /확정합니다/);
});

test("dementia checklist refuses diagnosis framing and includes official sources", () => {
  const output = buildDementiaCareChecklist({
    dementiaStatus: "suspected",
    region: "서울 관악구",
    situation: "할머니가 치매 의심 증상이 있어요"
  });

  assert.match(output, /진단하지 않습니다/);
  assert.match(output, /중앙치매센터/);
});

test("enum state labels are rendered in Korean for users", () => {
  const analysis = analyzeFamilyCareSituation({
    situation: "할머니 치매 의심과 장기요양, 어디부터 시작하죠",
    dementiaStatus: "suspected",
    longTermCareGradeStatus: "unknown"
  });
  const checklist = buildDementiaCareChecklist({
    dementiaStatus: "suspected",
    situation: "할머니가 기억력이 떨어졌어요"
  });

  assert.match(analysis, /장기요양등급: 미확인/);
  assert.doesNotMatch(analysis, /장기요양등급: unknown/);
  assert.match(checklist, /현재 상태: 의심됨/);
  assert.doesNotMatch(checklist, /현재 상태: suspected/);
});

test("missing region asks one concise follow-up question", () => {
  const output = analyzeFamilyCareSituation({
    situation: "아버지가 병원 이동이 힘든데 교통 지원이나 동행 서비스가 있을까요?"
  });

  assert.match(output, /거주지 시·군·구가 어디인가요\?/);
});

test("explicit medical support area routes to medical guidance", () => {
  const output = analyzeFamilyCareSituation({
    situation: "아버지가 퇴원 후 진료비와 의료 지원이 필요해요",
    region: "서울 관악구",
    ageRange: "80대",
    supportArea: "medical"
  });

  assert.match(output, /의료·진료 지원/);
  assert.match(output, /보건복지부/);
  assert.doesNotMatch(output, /구체 분야가 아직 드러나지 않았습니다/);
});

test("explicit administration support area routes to local government guidance", () => {
  const output = analyzeFamilyCareSituation({
    situation: "어느 부서에 신청해야 하는지 행정 창구를 알고 싶어요",
    region: "서울 관악구",
    ageRange: "80대",
    supportArea: "administration"
  });

  assert.match(output, /행정·지자체 창구/);
  assert.match(output, /시·군·구청/);
});

test("mobility route includes verified local mobility contact when region matches", () => {
  const output = analyzeFamilyCareSituation({
    situation: "아버지가 병원 이동이 힘든데 교통 지원이나 동행 서비스가 있을까요?",
    region: "서울 관악구",
    ageRange: "80대"
  });

  assert.match(output, /지역 교통 문의처/);
  assert.match(output, /서울시설공단 장애인콜택시/);
  assert.match(output, /1588-4388/);
});

test("explicit mobility intent is prioritized over medical keyword matches", () => {
  const output = routeSupportOptions({
    situation: "아버지 병원 이동과 동행 지원이 필요해요",
    mainConcern: "병원 이동 및 동행 지원 문의",
    supportArea: "mobility",
    region: "unknown"
  });

  assert.match(output, /1\. 이동·교통·병원동행/);
  assert.match(output, /이번 주 우선 할 일: 거주지 시·군·구청, 주민센터, 노인복지관의 교통·동행 지원 사업을 확인하세요\./);
});

test("mobility contact registry maps province aliases", () => {
  const contacts = mobilityContactsFor("경기도 성남시 분당구");

  assert.equal(contacts.length, 1);
  assert.equal(contacts[0]?.centerName, "경기도 교통약자 광역이동지원센터");
  assert.deepEqual(contacts[0]?.phoneNumbers.slice(0, 1), ["1666-0420"]);
});

test("emergency-like scenario prioritizes safety", () => {
  const output = buildDementiaCareChecklist({
    situation: "밤에 배회하다가 실종될까봐 위험해요",
    dementiaStatus: "severe_symptoms"
  });

  assert.match(output, /안전 확인/);
  assert.match(output, /119/);
});

test("facility comparison avoids fabricated rankings", () => {
  const output = compareCareOrSupportOptions({
    region: "성남시 분당구",
    desiredType: "요양원",
    careNeeds: "인지저하와 이동 도움"
  });

  assert.match(output, /특정 기관 순위/);
  assert.match(output, /공식 정보/);
});

test("facility comparison uses care needs and family priorities", () => {
  const output = compareCareOrSupportOptions({
    region: "서울 관악구",
    desiredType: "요양원",
    careNeeds: "치매와 배회 위험",
    familyPriorities: "야간 대응과 비용 투명성"
  });

  assert.match(output, /필요 지원: 치매와 배회 위험/);
  assert.match(output, /가족 우선순위: 야간 대응과 비용 투명성/);
  assert.match(output, /치매와 배회 위험/);
  assert.match(output, /야간 대응과 비용 투명성/);
});

test("llm placeholder strings are not surfaced as real user facts", () => {
  const output = compareCareOrSupportOptions({
    region: "unknown",
    desiredType: "요양원",
    careNeeds: "비용, 야간대응",
    familyPriorities: "unknown"
  });

  assert.match(output, /지역: 미확인 \/ 희망 유형: 요양원/);
  assert.match(output, /필요 지원: 비용, 야간대응/);
  assert.doesNotMatch(output, /unknown/);
  assert.doesNotMatch(output, /가족 우선순위: unknown/);
});

test("tool outputs keep a user-facing safety notice for llm summarization", () => {
  const output = routeSupportOptions({
    situation: "아버지 병원 이동 지원은 어디에 문의해야 하나요",
    supportArea: "mobility",
    region: "unknown"
  });

  assert.match(output, /확인 필요/);
  assert.match(output, /의학적 진단/);
  assert.match(output, /장기요양등급 승인/);
  assert.match(output, /공식 기관과 의료진 확인이 필요합니다/);
  assert.doesNotMatch(output, /region: unknown/);
});

test("family care analysis keeps caveat concise without duplicate warning sections", () => {
  const output = analyzeFamilyCareSituation({
    situation: "할머니 치매 의심과 장기요양, 어디부터 시작하죠",
    dementiaStatus: "suspected"
  });

  assert.match(output, /## 확인 필요/);
  assert.doesNotMatch(output, /## 주의\n이 결과는 가족 의사결정을 돕는 내비게이션/);
});

test("family share summary is concise and does not request sensitive identifiers", () => {
  const output = makeFamilyShareSummary({
    situation: "아버지가 병원 이동이 어려움. 연락처 010-1234-5678, 주민번호 440101-1234567",
    checklist: ["거주지 교통지원 확인", "장기요양등급 여부 확인", "담당자 02-123-4567에 전화"]
  });

  assert.match(output, /가족 공유용 요약/);
  assert.doesNotMatch(output, /주민등록/);
  assert.doesNotMatch(output, /010-1234-5678/);
  assert.doesNotMatch(output, /440101-1234567/);
  assert.doesNotMatch(output, /02-123-4567/);
  assert.match(output, /\[연락처 생략\]/);
  assert.match(output, /\[민감번호 생략\]/);
});

test("source unavailable state fails clearly", () => {
  assert.throws(() => renderSources([]), /Official source registry returned no sources/);
});
