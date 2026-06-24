import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeFamilyCareSituation,
  buildDementiaCareChecklist,
  compareCareOrSupportOptions,
  makeFamilyShareSummary
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

test("missing region asks one concise follow-up question", () => {
  const output = analyzeFamilyCareSituation({
    situation: "아버지가 병원 이동이 힘든데 교통 지원이나 동행 서비스가 있을까요?"
  });

  assert.match(output, /거주지 시·군·구가 어디인가요\?/);
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

test("family share summary is concise and does not request sensitive identifiers", () => {
  const output = makeFamilyShareSummary({
    situation: "아버지가 병원 이동이 어려움",
    checklist: ["거주지 교통지원 확인", "장기요양등급 여부 확인"]
  });

  assert.match(output, /가족 공유용 요약/);
  assert.doesNotMatch(output, /주민등록/);
});

test("source unavailable state fails clearly", () => {
  assert.throws(() => renderSources([]), /Official source registry returned no sources/);
});
