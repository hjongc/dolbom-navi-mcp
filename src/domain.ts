import { mobilityContactsFor, renderMobilityContacts, renderSources, SourceCategory, sourcesFor } from "./sources.js";

export interface CareProfileInput {
  situation: string;
  region?: string;
  ageRange?: string;
  dementiaStatus?: "suspected" | "diagnosed" | "unknown" | "severe_symptoms";
  longTermCareGradeStatus?: "none" | "applied" | "has_grade" | "unknown";
  mobilityStatus?: string;
  livingSituation?: string;
  supportArea?: "welfare" | "medical" | "care" | "mobility" | "facility" | "administration" | "unknown";
}

export interface RoutedArea {
  area: SourceCategory;
  label: string;
  reason: string;
  firstContact: string;
}

const EMERGENCY_PATTERNS = [
  /실종/,
  /사라졌/,
  /위험/,
  /자해/,
  /폭력/,
  /호흡/,
  /의식/,
  /쓰러/,
  /급성/,
  /배회/,
  /길을 잃/
];

function hasAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some(word => lower.includes(word.toLowerCase()));
}

function lineItems(items: string[]): string {
  return items.map(item => `- ${item}`).join("\n");
}

function hasMobilityRoute(routes: RoutedArea[]): boolean {
  return routes.some(route => route.area === "mobility");
}

function optionalItem(label: string, value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? `${label}: ${trimmed}` : undefined;
}

function sanitizeUserText(text: string): string {
  return text
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, "[민감번호 생략]")
    .replace(/\b01[016789]-?\d{3,4}-?\d{4}\b/g, "[연락처 생략]")
    .replace(/\b0(?:2|[3-6][1-5]|70|80)-?\d{3,4}-?\d{4}\b/g, "[연락처 생략]");
}

function familyShareSummary(situation: string, firstAction: string): string {
  return [
    "## 가족 공유 요약",
    `현재 상황: ${sanitizeUserText(situation)}`,
    `이번 주 우선 할 일: ${firstAction}`,
    "확정 판단이 아니라 가족 논의용 초안이므로, 등급·혜택·입소 가능 여부는 공식 기관에 확인해야 합니다."
  ].join("\n");
}

function mobilityContactSection(region: string, routes: RoutedArea[]): string {
  if (!hasMobilityRoute(routes)) return "";

  const contacts = mobilityContactsFor(region);
  if (contacts.length > 0) {
    return [
      "## 지역 교통 문의처",
      renderMobilityContacts(contacts),
      "교통약자 이동지원은 지역별 이용대상, 등록서류, 예약방식, 운행구역이 다르므로 전화 전 공식 사이트의 이용대상과 서류를 함께 확인하세요."
    ].join("\n");
  }

  return [
    "## 지역 교통 문의처",
    region === "미확인"
      ? "- 거주지 시·도명이 확인되면 해당 지역 공식 교통약자 이동지원센터 대표번호를 우선 안내할 수 있습니다."
      : `- ${region}의 공식 교통약자 이동지원센터 번호가 내장 목록에 아직 없습니다. 정부24 지자체 누리집 또는 거주지 시·군·구청 교통·복지 담당 부서에서 최신 번호를 확인하세요.`
  ].join("\n");
}

function normalizeProfile(input: CareProfileInput): Required<CareProfileInput> {
  return {
    situation: sanitizeUserText(input.situation.trim()),
    region: sanitizeUserText(input.region?.trim() || "미확인"),
    ageRange: sanitizeUserText(input.ageRange?.trim() || "미확인"),
    dementiaStatus: input.dementiaStatus || "unknown",
    longTermCareGradeStatus: input.longTermCareGradeStatus || "unknown",
    mobilityStatus: sanitizeUserText(input.mobilityStatus?.trim() || "미확인"),
    livingSituation: sanitizeUserText(input.livingSituation?.trim() || "미확인"),
    supportArea: input.supportArea || "unknown"
  };
}

export function detectEmergency(situation: string): boolean {
  return EMERGENCY_PATTERNS.some(pattern => pattern.test(situation));
}

export function routeAreas(input: CareProfileInput): RoutedArea[] {
  const profile = normalizeProfile(input);
  const text = `${profile.situation} ${profile.mobilityStatus} ${profile.livingSituation}`;
  const routes: RoutedArea[] = [];

  if (profile.supportArea === "welfare" || hasAny(text, ["복지", "혜택", "지원금", "기초연금", "차상위", "수급"])) {
    routes.push({
      area: "welfare",
      label: "복지·공공혜택",
      reason: "지원금, 감면, 노인복지 서비스처럼 자격요건 확인이 필요한 표현이 포함되어 있습니다.",
      firstContact: "정부24에서 서비스명을 확인하고, 거주지 주민센터 또는 시·군·구청 복지 담당 부서에 문의하세요."
    });
  }

  if (
    profile.supportArea === "medical" ||
    hasAny(text, ["의료", "진료", "병원", "퇴원", "치료", "간병", "의사", "간호", "응급의료", "의료비"])
  ) {
    routes.push({
      area: "medical",
      label: "의료·진료 지원",
      reason: "진료, 퇴원, 의료비, 의료기관 상담처럼 의료·보건 경로 확인이 필요한 표현이 포함되어 있습니다.",
      firstContact: "현재 진료기관 또는 보건복지부·응급의료포털 등 공식 의료 경로에서 상담·기관 정보를 확인하세요."
    });
  }

  if (profile.dementiaStatus !== "unknown" || hasAny(text, ["치매", "인지", "기억", "배회", "망상"])) {
    routes.push({
      area: "dementia",
      label: "치매·인지건강 지원",
      reason: "치매 의심, 진단, 배회, 기억저하 등 전문 평가와 지역 치매안심센터 연결이 필요한 신호가 있습니다.",
      firstContact: "가까운 치매안심센터 또는 의료기관에 문의하고 가족 관찰 기록을 준비하세요."
    });
  }

  if (
    profile.supportArea === "care" ||
    profile.longTermCareGradeStatus !== "unknown" ||
    hasAny(text, ["돌봄", "장기요양", "등급", "요양", "방문요양", "주야간보호", "거동", "일상생활"])
  ) {
    routes.push({
      area: "long_term_care",
      label: "장기요양·일상돌봄",
      reason: "일상생활 지원, 거동 어려움, 장기요양등급, 방문요양·주야간보호 같은 표현이 포함되어 있습니다.",
      firstContact: "국민건강보험공단 노인장기요양보험 경로에서 장기요양인정 신청과 기관 정보를 확인하세요."
    });
  }

  if (profile.supportArea === "mobility" || hasAny(text, ["교통", "이동", "병원동행", "휠체어", "택시", "운전", "외출"])) {
    routes.push({
      area: "mobility",
      label: "이동·교통·병원동행",
      reason: "병원 이동, 외출, 교통지원, 동행 지원처럼 지역별 서비스 확인이 필요한 표현이 있습니다.",
      firstContact: "거주지 시·군·구청, 주민센터, 노인복지관의 교통·동행 지원 사업을 확인하세요."
    });
  }

  if (profile.supportArea === "facility" || hasAny(text, ["요양원", "요양병원", "시설", "입소", "상담", "보호센터"])) {
    routes.push({
      area: "facility",
      label: "시설·서비스 비교",
      reason: "요양원, 요양병원, 보호센터, 입소 상담처럼 선택지 비교와 상담 질문 정리가 필요한 상황입니다.",
      firstContact: "장기요양기관 정보와 의료기관 정보를 구분해서 보고, 전화 상담 전 질문 목록을 준비하세요."
    });
  }

  if (profile.supportArea === "administration" || routes.length === 0) {
    routes.push({
      area: "local_government",
      label: profile.supportArea === "administration" ? "행정·지자체 창구" : "초기 행정 내비게이션",
      reason:
        profile.supportArea === "administration"
          ? "민원, 신청, 지역 담당 창구 확인처럼 지자체 또는 행정기관 연결이 필요한 상황입니다."
          : "구체 분야가 아직 드러나지 않았습니다. 먼저 거주지와 현재 가장 불편한 일을 기준으로 분류해야 합니다.",
      firstContact: "거주지 주민센터 또는 시·군·구청 노인복지 담당 부서에 현재 상황을 설명하고 담당 창구를 확인하세요."
    });
  }

  const seen = new Set<string>();
  return routes.filter(route => {
    if (seen.has(route.area)) return false;
    seen.add(route.area);
    return true;
  });
}

export function analyzeFamilyCareSituation(input: CareProfileInput): string {
  const profile = normalizeProfile(input);
  const emergency = detectEmergency(profile.situation);
  const routes = routeAreas(profile);
  const sourceCategories = routes.map(route => route.area);
  const sources = sourcesFor(sourceCategories);

  if (emergency) {
    return [
      "## 상황 요약",
      "즉각적인 안전 확인이 먼저 필요한 표현이 포함되어 있습니다. 이 경우 복지·요양 절차 안내보다 현재 위치와 안전 확보가 우선입니다.",
      "",
      "## 지금 할 일",
      lineItems([
        "실종·배회처럼 위치 확인이 급하면 112, 생명·신체 위험이나 급성 증상이 있으면 119 또는 가까운 응급의료기관에 연락하세요.",
        "가족 중 한 명은 현재 위치, 마지막 확인 시각, 복용 약, 진단 여부를 정리하세요.",
        "상황이 안정된 뒤 치매안심센터, 장기요양보험, 지자체 돌봄 창구를 순서대로 확인하세요."
      ]),
      "",
      "## 공식 출처",
      renderSources(sourcesFor(["emergency", "dementia", "long_term_care"]))
    ].join("\n");
  }

  const missing = [];
  if (profile.region === "미확인") missing.push("거주지 시·군·구");
  if (profile.ageRange === "미확인") missing.push("연령대");
  if (profile.longTermCareGradeStatus === "unknown") missing.push("장기요양등급 신청/보유 여부");
  if (profile.mobilityStatus === "미확인") missing.push("거동·병원 이동 가능 여부");

  return [
    "## 상황 요약",
    `입력된 상황: ${profile.situation}`,
    `거주지: ${profile.region} / 연령대: ${profile.ageRange} / 장기요양등급: ${profile.longTermCareGradeStatus}`,
    "",
    "## 먼저 볼 지원 영역",
    routes.map(route => `- ${route.label}: ${route.reason}`).join("\n"),
    "",
    "## 이번 주 첫 행동",
    routes.map(route => `- ${route.label}: ${route.firstContact}`).join("\n"),
    "",
    mobilityContactSection(profile.region, routes),
    "",
    "## 추가로 확인하면 정확해지는 정보",
    missing.length > 0 ? lineItems(missing) : "- 현재 입력만으로 1차 경로 분류가 가능합니다.",
    profile.region === "미확인" ? "\n먼저 한 가지만 확인할게요: 어르신의 거주지 시·군·구가 어디인가요?" : "",
    "",
    "## 주의",
    "이 결과는 가족 의사결정을 돕는 내비게이션이며, 등급·급여·의학적 진단·입소 가능 여부를 확정하지 않습니다. 최종 판단은 공식 기관과 의료진에게 확인해야 합니다.",
    "",
    familyShareSummary(profile.situation, routes[0]?.firstContact || "거주지와 가장 급한 돌봄 문제를 가족끼리 먼저 정리"),
    "",
    "## 공식 출처",
    renderSources(sources)
  ].join("\n");
}

export function routeSupportOptions(input: CareProfileInput & { mainConcern?: string }): string {
  const profile = normalizeProfile({ ...input, situation: input.mainConcern || input.situation });
  const routes = routeAreas(profile);
  return [
    "## 추천 경로",
    routes.map((route, index) => `${index + 1}. ${route.label}\n   - 이유: ${route.reason}\n   - 첫 문의처: ${route.firstContact}`).join("\n"),
    "",
    "## 가족이 오늘 정리할 것",
    lineItems([
      "어르신 거주지와 실제 돌봄 장소가 같은지 확인",
      "최근 1개월 동안 가장 힘들어진 일 3가지 기록",
      "장기요양등급 신청/보유 여부 확인",
      "병원 이동, 식사, 목욕, 복약, 배회 등 일상 지원 필요도를 가족끼리 합의"
    ]),
    "",
    mobilityContactSection(profile.region, routes),
    "",
    familyShareSummary(profile.situation, routes[0]?.firstContact || "거주지와 가장 급한 돌봄 문제를 가족끼리 먼저 정리"),
    "",
    "## 공식 출처",
    renderSources(sourcesFor(routes.map(route => route.area)))
  ].join("\n");
}

export function explainLongTermCarePath(input: CareProfileInput): string {
  const profile = normalizeProfile(input);
  return [
    "## 장기요양 경로",
    "장기요양은 고령이나 노인성 질병 등으로 일상생활 지원이 필요한지 공식 절차로 확인하는 영역입니다. 등급 가능성을 이 도구가 확정할 수는 없지만, 가족이 준비할 내용은 정리할 수 있습니다.",
    "",
    "## 현재 상태별 안내",
    profile.longTermCareGradeStatus === "has_grade"
      ? "이미 등급이 있다면 급여 종류, 이용 가능한 기관, 본인부담, 기존 서비스 불편 사항을 확인하는 단계가 우선입니다."
      : "등급이 없거나 모르면 장기요양인정 신청 대상인지 공식 경로에서 확인하고, 최근 일상생활 어려움을 구체적으로 기록해 두는 것이 좋습니다.",
    "",
    "## 준비할 정보",
    lineItems([
      "어르신 성함 같은 민감 식별정보는 이 도구에 입력하지 말고, 가족 내부에서만 관리",
      "거주지 시·군·구와 실제 돌봄 장소",
      "식사, 목욕, 배변, 이동, 복약, 인지 변화 등 도움이 필요한 일",
      "최근 진료 이력과 진단 여부는 의료기관·공단 문의 시 확인",
      "현재 이용 중인 복지·돌봄 서비스"
    ]),
    "",
    "## 이번 주 할 일",
    lineItems([
      "국민건강보험공단 노인장기요양보험 공식 사이트에서 신청 절차와 기관 정보를 확인",
      "가족 관찰 메모를 1장으로 정리",
      "주민센터 또는 공단 문의 전, '가장 힘든 일상동작'을 가족끼리 합의",
      "등급 결과와 관계없이 필요한 지역 돌봄·교통·의료 지원도 같이 확인"
    ]),
    "",
    familyShareSummary(
      profile.situation,
      "장기요양인정 신청 절차와 최근 일상생활 어려움 기록을 먼저 확인"
    ),
    "",
    "## 공식 출처",
    renderSources(sourcesFor(["long_term_care", "welfare", "local_government"]))
  ].join("\n");
}

export function buildDementiaCareChecklist(input: { dementiaStatus?: CareProfileInput["dementiaStatus"]; region?: string; situation?: string }): string {
  const status = input.dementiaStatus || "unknown";
  const situation = sanitizeUserText(input.situation || "");
  if (detectEmergency(situation)) {
    return [
      "## 먼저 안전 확인",
      "배회, 실종, 급성 혼란, 즉각적 위험이 의심되면 일반 상담보다 안전 조치가 우선입니다.",
      "",
      lineItems([
        "실종·배회는 112, 생명·신체 위험이나 급성 증상은 119 또는 가까운 응급의료기관에 연락",
        "마지막 확인 위치·시간·복장·복용약을 가족끼리 공유",
        "상황이 안정된 뒤 치매안심센터와 의료기관에 후속 상담"
      ]),
      "",
      "## 공식 출처",
      renderSources(sourcesFor(["emergency", "dementia"]))
    ].join("\n");
  }

  return [
    "## 치매·인지건강 체크리스트",
    `현재 상태: ${status}`,
    "",
    "## 가족 관찰 메모",
    lineItems([
      "기억 저하가 언제부터, 얼마나 자주 나타났는지",
      "약속, 돈 관리, 요리, 외출, 복약에서 달라진 점",
      "배회, 길 잃음, 망상, 공격성, 수면 변화 여부",
      "최근 낙상, 감염, 약 변경, 우울감 등 갑작스러운 변화 요인",
      "가족이 가장 걱정하는 장면 3가지"
    ]),
    "",
    "## 문의 순서",
    lineItems([
      `${input.region || "거주지"} 치매안심센터 또는 의료기관에서 평가·상담 경로 확인`,
      "진단·상담 결과에 따라 장기요양, 돌봄, 교통·동행 지원을 함께 검토",
      "가족 단톡방에는 관찰 사실과 다음 예약/문의 일정을 짧게 공유"
    ]),
    "",
    "## 주의",
    "이 도구는 치매를 진단하지 않습니다. 의심 증상이 있으면 전문 평가가 필요합니다.",
    "",
    familyShareSummary(
      situation || "치매·인지건강 관련 가족 확인이 필요함",
      `${sanitizeUserText(input.region || "거주지")} 치매안심센터 또는 의료기관 상담 경로 확인`
    ),
    "",
    "## 공식 출처",
    renderSources(sourcesFor(["dementia", "medical", "long_term_care"]))
  ].join("\n");
}

export function compareCareOrSupportOptions(input: { region?: string; desiredType?: string; careNeeds?: string; familyPriorities?: string }): string {
  const region = sanitizeUserText(input.region || "미확인");
  const desiredType = sanitizeUserText(input.desiredType || "미확인");
  const careNeeds = sanitizeUserText(input.careNeeds?.trim() || "");
  const familyPriorities = sanitizeUserText(input.familyPriorities?.trim() || "");
  const context = [
    optionalItem("필요 지원", careNeeds),
    optionalItem("가족 우선순위", familyPriorities)
  ].filter((item): item is string => Boolean(item));
  const priorityQuestion = familyPriorities
    ? `가족 우선순위인 '${familyPriorities}'을 기준으로 비용, 야간 대응, 소통 방식 중 어떤 항목을 계약서나 공식 설명으로 확인할 수 있나요?`
    : "가족이 가장 중요하게 보는 기준 2가지를 충족하는지 공식 설명과 상담 답변으로 확인할 수 있나요?";
  const careNeedQuestion = careNeeds
    ? `어르신의 '${careNeeds}' 상황에서 이용 제한, 추가 비용, 야간·응급 대응 기준은 무엇인가요?`
    : "현재 어르신 상태에서 이용 가능 여부를 판단하려면 어떤 정보를 준비해야 하나요?";

  return [
    "## 비교 대상",
    `지역: ${region} / 희망 유형: ${desiredType}`,
    context.length > 0 ? lineItems(context) : "- 필요 지원과 가족 우선순위가 있으면 비교 질문을 더 구체화할 수 있습니다.",
    "",
    "## 비교 기준",
    lineItems([
      "공식 등록·평가 정보가 있는지",
      "어르신 상태와 필요한 지원이 맞는지",
      "응급상황 대응, 야간 대응, 병원 연계 방식",
      "비용 구조와 추가 비용 설명이 명확한지",
      "가족 방문·상담·소통 방식",
      "광고성 후기보다 공식 정보와 직접 상담 답변이 일관적인지"
    ]),
    "",
    "## 전화 상담 질문",
    lineItems([
      careNeedQuestion,
      "장기요양등급이 없거나 신청 중이어도 상담이 가능한가요?",
      "인력 배치, 야간 대응, 응급 이송 절차는 어떻게 되나요?",
      "인지저하·배회·낙상 위험이 있을 때 관리 방식은 무엇인가요?",
      "계약 전 가족이 직접 확인해야 할 서류와 비용 항목은 무엇인가요?",
      priorityQuestion
    ]),
    "",
    "## 주의",
    "이 도구는 특정 기관 순위를 만들지 않습니다. 검증되지 않은 리뷰나 광고 문구를 근거로 추천하지 말고, 공식 정보와 직접 상담 내용을 함께 확인하세요.",
    "",
    familyShareSummary(
      `${region}에서 ${desiredType} 비교 필요`,
      "공식 등록·평가 정보, 야간·응급 대응, 비용 항목을 같은 질문표로 확인"
    ),
    "",
    "## 공식 출처",
    renderSources(sourcesFor(["facility", "long_term_care", "local_government", "medical"]))
  ].join("\n");
}

export function makeFamilyShareSummary(input: { situation: string; recommendedPath?: string; checklist?: string[] }): string {
  const checklist = input.checklist?.length
    ? input.checklist
    : [
        "거주지 기준으로 복지·돌봄 담당 창구 확인",
        "장기요양등급 신청/보유 여부 확인",
        "병원 이동·식사·복약·인지 변화 중 가장 급한 문제 정리"
      ];

  return [
    "[가족 공유용 요약]",
    `현재 상황: ${sanitizeUserText(input.situation)}`,
    `우선 경로: ${sanitizeUserText(input.recommendedPath || "복지·의료·돌봄·교통·시설 중 해당 영역을 먼저 분류하고 공식 기관에 확인")}`,
    "",
    "이번 주 할 일",
    checklist.map((item, index) => `${index + 1}. ${sanitizeUserText(item)}`).join("\n"),
    "",
    "주의: 이 내용은 가족 논의를 돕기 위한 정리이며, 혜택 대상 여부·의학적 판단·입소 가능 여부는 공식 기관과 의료진에게 확인해야 합니다."
  ].join("\n");
}
