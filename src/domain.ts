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

export type InstitutionType =
  | "nhis"
  | "dementia_center"
  | "local_government"
  | "medical_provider"
  | "mobility_center"
  | "care_facility"
  | "unknown";

export type CareServiceType =
  | "nursing_home"
  | "care_hospital"
  | "day_night_care"
  | "home_visit_care"
  | "short_term_care"
  | "mobility_support"
  | "hospital_companion"
  | "unknown";

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
  /길을 잃/,
  /낙상/,
  /마비/,
  /가슴\s*통증/,
  /말이\s*어눌/,
  /섬망/
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

function isUnknownPlaceholder(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return [
    "",
    "unknown",
    "undefined",
    "null",
    "n/a",
    "na",
    "none",
    "not sure",
    "unspecified",
    "미상",
    "미정",
    "모름",
    "모르겠음",
    "알 수 없음",
    "확인 필요"
  ].includes(normalized);
}

function sanitizeUserText(text: string): string {
  return text
    .replace(/\b\d{6}-?[1-4]\d{6}\b/g, "[민감번호 생략]")
    .replace(/\b01[016789]-?\d{3,4}-?\d{4}\b/g, "[연락처 생략]")
    .replace(/\b0(?:2|[3-6][1-5]|70|80)-?\d{3,4}-?\d{4}\b/g, "[연락처 생략]");
}

function cleanOptionalText(value: string | undefined, fallback = "미확인"): string {
  if (!value || isUnknownPlaceholder(value)) return fallback;
  return sanitizeUserText(value.trim());
}

function cleanOptionalDetail(value: string | undefined): string {
  if (!value || isUnknownPlaceholder(value)) return "";
  return sanitizeUserText(value.trim());
}

function officialConfirmationNotice(): string {
  return [
    "## 확인 필요",
    "이 안내는 가족이 다음 문의와 준비를 시작하기 위한 정리입니다. 의학적 진단, 장기요양등급 승인, 혜택 대상 여부, 시설 입소 가능 여부, 시설 순위는 확정하지 않으며 공식 기관과 의료진 확인이 필요합니다."
  ].join("\n");
}

function renderDementiaStatus(status: Required<CareProfileInput>["dementiaStatus"]): string {
  return {
    suspected: "의심됨",
    diagnosed: "진단받음",
    unknown: "미확인",
    severe_symptoms: "즉시 안전 확인 필요"
  }[status];
}

function renderLongTermCareGradeStatus(status: Required<CareProfileInput>["longTermCareGradeStatus"]): string {
  return {
    none: "없음",
    applied: "신청 중",
    has_grade: "등급 있음",
    unknown: "미확인"
  }[status];
}

function preferredAreaFor(profile: Required<CareProfileInput>): SourceCategory | undefined {
  if (profile.supportArea === "welfare") return "welfare";
  if (profile.supportArea === "medical") return "medical";
  if (profile.supportArea === "care") return "long_term_care";
  if (profile.supportArea === "mobility") return "mobility";
  if (profile.supportArea === "facility") return "facility";
  if (profile.supportArea === "administration") return "local_government";
  if (profile.dementiaStatus !== "unknown") return "dementia";
  return undefined;
}

function prioritizeRoutes(routes: RoutedArea[], preferredArea: SourceCategory | undefined): RoutedArea[] {
  if (!preferredArea) return routes;
  return [...routes].sort((left, right) => {
    if (left.area === preferredArea && right.area !== preferredArea) return -1;
    if (right.area === preferredArea && left.area !== preferredArea) return 1;
    return 0;
  });
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

function supportAreaCategories(area?: CareProfileInput["supportArea"]): SourceCategory[] {
  if (area === "welfare") return ["welfare", "local_government"];
  if (area === "medical") return ["medical"];
  if (area === "care") return ["long_term_care", "local_government"];
  if (area === "mobility") return ["mobility", "local_government"];
  if (area === "facility") return ["facility", "long_term_care", "medical"];
  if (area === "administration") return ["local_government"];
  return ["welfare", "long_term_care", "dementia", "mobility", "local_government"];
}

function renderInstitutionType(type: InstitutionType): string {
  return {
    nhis: "국민건강보험공단 노인장기요양보험",
    dementia_center: "치매안심센터·중앙치매센터",
    local_government: "주민센터·시군구청",
    medical_provider: "의료기관·보건의료 상담 경로",
    mobility_center: "교통약자 이동지원센터",
    care_facility: "요양시설·돌봄 서비스 기관",
    unknown: "확인할 기관 미정"
  }[type];
}

function categoriesForInstitution(type: InstitutionType): SourceCategory[] {
  const categories: Record<InstitutionType, SourceCategory[]> = {
    nhis: ["long_term_care"],
    dementia_center: ["dementia", "medical"],
    local_government: ["local_government", "welfare"],
    medical_provider: ["medical"],
    mobility_center: ["mobility", "local_government"],
    care_facility: ["facility", "long_term_care", "medical"],
    unknown: ["local_government", "welfare", "long_term_care"]
  };
  return categories[type];
}

function callQuestionsFor(type: InstitutionType, concern: string, region: string): string[] {
  const common = [
    `이 상황(${concern})에서 먼저 확인해야 할 공식 절차나 담당 창구가 어디인가요?`,
    "전화 뒤에 가족이 준비해야 할 서류, 관찰 메모, 방문 일정이 있나요?",
    "대상 여부나 비용은 어떤 기준으로 최종 확인되나요?"
  ];

  const byType: Record<InstitutionType, string[]> = {
    nhis: [
      "장기요양인정 신청 전 가족이 기록해 둘 일상생활 어려움은 무엇인가요?",
      "등급 결과 전후로 이용 가능한 급여나 기관 확인은 어디서 하나요?",
      "신청, 방문조사, 의사소견서 등 다음 단계별 예상 순서는 어떻게 되나요?"
    ],
    dementia_center: [
      "치매를 확정하려는 것이 아니라 상담·검사 경로를 확인하려면 어디로 예약해야 하나요?",
      "배회, 수면 변화, 기억저하처럼 가족이 관찰한 내용을 어떤 형식으로 가져가면 좋나요?",
      `${region}에서 이용 가능한 치매안심센터 프로그램이나 가족 상담이 있나요?`
    ],
    local_government: [
      `${region} 기준 노인복지, 병원동행, 돌봄, 교통 지원 중 어느 부서가 담당하나요?`,
      "연령, 거주지, 소득, 장애 등록, 장기요양등급 등 확인해야 할 조건은 무엇인가요?",
      "온라인 신청과 방문 신청 중 어떤 경로가 공식 절차인가요?"
    ],
    medical_provider: [
      "현재 증상이 응급실, 외래, 보건소, 전문기관 중 어디로 가야 하는 상황인가요?",
      "복용약, 최근 낙상, 감염, 수면 변화, 인지 변화 중 진료 전에 정리할 것은 무엇인가요?",
      "진단명이나 치료 방향은 의료진 상담 후 어떻게 가족에게 설명하면 좋나요?"
    ],
    mobility_center: [
      `${region}에서 교통약자 이동지원 등록 대상과 필요한 서류는 무엇인가요?`,
      "병원 이동, 휠체어, 보호자 동승, 예약 가능 시간과 운행 구역 제한은 어떻게 되나요?",
      "당일 이용이 어려울 때 대체로 문의할 수 있는 지자체 사업이나 병원동행 서비스가 있나요?"
    ],
    care_facility: [
      "어르신 상태에서 입소, 주야간보호, 방문요양 중 어느 유형이 맞는지 상담 기준은 무엇인가요?",
      "야간 대응, 낙상·배회 대응, 응급 이송, 가족 연락 기준은 어떻게 운영되나요?",
      "월 비용, 추가 비용, 계약 전 확인 서류, 환불·퇴소 조건을 문서로 받을 수 있나요?"
    ],
    unknown: common
  };

  return [...common, ...byType[type]];
}

function renderCareServiceType(type: CareServiceType): { label: string; summary: string; useWhen: string; verify: string[] } {
  return {
    nursing_home: {
      label: "요양원",
      summary: "일상생활 돌봄과 장기요양급여 이용을 중심으로 보는 장기요양기관 유형입니다.",
      useWhen: "식사, 목욕, 이동, 인지저하, 배회 대응처럼 생활 돌봄이 지속적으로 필요한지 확인할 때",
      verify: ["장기요양기관 정보", "입소 가능 여부", "야간·응급 대응", "본인부담과 추가 비용"]
    },
    care_hospital: {
      label: "요양병원",
      summary: "의료기관 성격이 강해 진료, 처치, 재활, 의학적 관리 필요성을 함께 봐야 합니다.",
      useWhen: "치료·재활·의학적 관리 필요성이 돌봄보다 더 큰지 의료진과 상의할 때",
      verify: ["진료 필요성", "입원 적합성", "간병 구조", "비급여·간병비", "퇴원 후 돌봄 연계"]
    },
    day_night_care: {
      label: "주야간보호",
      summary: "낮 또는 일정 시간 동안 기관에서 돌봄과 활동 지원을 받는 방식입니다.",
      useWhen: "가족이 함께 살거나 밤에는 집에 계시지만 낮 시간 돌봄 공백이 클 때",
      verify: ["송영 가능 지역", "운영 시간", "인지·신체 프로그램", "식사·투약 지원", "등급별 이용 조건"]
    },
    home_visit_care: {
      label: "방문요양",
      summary: "요양보호사가 집으로 방문해 일상생활 지원을 제공하는 방식입니다.",
      useWhen: "집에서 생활을 유지하면서 식사, 목욕, 이동, 청소 등 일부 도움이 필요할 때",
      verify: ["방문 가능 시간", "제공 서비스 범위", "담당자 교체 기준", "등급·급여 조건"]
    },
    short_term_care: {
      label: "단기보호",
      summary: "가족 사정이나 돌봄 공백이 생겼을 때 일정 기간 기관 보호를 검토하는 유형입니다.",
      useWhen: "보호자 입원, 출장, 번아웃, 임시 돌봄 공백처럼 기간이 정해진 지원이 필요할 때",
      verify: ["이용 가능 기간", "예약 가능 여부", "응급 대응", "비용", "퇴소 후 연계"]
    },
    mobility_support: {
      label: "교통약자 이동지원",
      summary: "지역별 등록 기준과 예약 방식에 따라 병원·외출 이동을 지원하는 교통 서비스입니다.",
      useWhen: "휠체어, 보행 어려움, 대중교통 이용 곤란 등으로 이동 자체가 문제일 때",
      verify: ["지역별 등록 대상", "필요 서류", "예약 방식", "운행 구역", "보호자 동승"]
    },
    hospital_companion: {
      label: "병원동행",
      summary: "병원 방문 과정에서 이동, 접수, 수납, 귀가 동행을 돕는 지역·민간 혼합 서비스입니다.",
      useWhen: "진료는 가능하지만 보호자가 매번 동행하기 어렵거나 이동 과정이 복잡할 때",
      verify: ["지자체 사업 여부", "이용 대상", "본인부담", "동행 범위", "의료 판단 대행 금지"]
    },
    unknown: {
      label: "유형 미정",
      summary: "먼저 돌봄의 중심 문제가 의료, 생활지원, 이동, 임시보호 중 무엇인지 나눠야 합니다.",
      useWhen: "요양원, 요양병원, 주야간보호, 방문요양 중 무엇이 맞는지 아직 모를 때",
      verify: ["가장 힘든 일상동작", "의료진 확인 필요성", "장기요양등급 상태", "거주지와 이동 가능성"]
    }
  }[type];
}

function normalizeProfile(input: CareProfileInput): Required<CareProfileInput> {
  return {
    situation: sanitizeUserText(input.situation.trim()),
    region: cleanOptionalText(input.region),
    ageRange: cleanOptionalText(input.ageRange),
    dementiaStatus: input.dementiaStatus || "unknown",
    longTermCareGradeStatus: input.longTermCareGradeStatus || "unknown",
    mobilityStatus: cleanOptionalText(input.mobilityStatus),
    livingSituation: cleanOptionalText(input.livingSituation),
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
  const uniqueRoutes = routes.filter(route => {
    if (seen.has(route.area)) return false;
    seen.add(route.area);
    return true;
  });
  return prioritizeRoutes(uniqueRoutes, preferredAreaFor(profile));
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
      renderSources(sourcesFor(["emergency", "dementia", "long_term_care"])),
      "",
      officialConfirmationNotice()
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
    `거주지: ${profile.region} / 연령대: ${profile.ageRange} / 장기요양등급: ${renderLongTermCareGradeStatus(profile.longTermCareGradeStatus)}`,
    "",
    "## 먼저 볼 지원 영역",
    routes.map(route => `- ${route.label}: ${route.reason}`).join("\n"),
    "",
    "## 이번 주 첫 행동",
    routes.map(route => `- ${route.label}: ${route.firstContact}`).join("\n"),
    "",
    mobilityContactSection(profile.region, routes),
    "",
    officialConfirmationNotice(),
    "",
    "## 추가로 확인하면 정확해지는 정보",
    missing.length > 0 ? lineItems(missing) : "- 현재 입력만으로 1차 경로 분류가 가능합니다.",
    profile.region === "미확인" ? "\n먼저 한 가지만 확인할게요: 어르신의 거주지 시·군·구가 어디인가요?" : "",
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
    officialConfirmationNotice(),
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
    renderSources(sourcesFor(["long_term_care", "welfare", "local_government"])),
    "",
    officialConfirmationNotice()
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
      renderSources(sourcesFor(["emergency", "dementia"])),
      "",
      officialConfirmationNotice()
    ].join("\n");
  }

  return [
    "## 치매·인지건강 체크리스트",
    `현재 상태: ${renderDementiaStatus(status)}`,
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
    renderSources(sourcesFor(["dementia", "medical", "long_term_care"])),
    "",
    officialConfirmationNotice()
  ].join("\n");
}

export function compareCareOrSupportOptions(input: { region?: string; desiredType?: string; careNeeds?: string; familyPriorities?: string }): string {
  const region = cleanOptionalText(input.region);
  const desiredType = cleanOptionalText(input.desiredType);
  const careNeeds = cleanOptionalDetail(input.careNeeds);
  const familyPriorities = cleanOptionalDetail(input.familyPriorities);
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
    officialConfirmationNotice(),
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

export function findLocalSupportContacts(input: {
  situation: string;
  region?: string;
  supportArea?: CareProfileInput["supportArea"];
  mobilityStatus?: string;
}): string {
  const situation = sanitizeUserText(input.situation.trim());
  const region = cleanOptionalText(input.region);
  const area = input.supportArea || "unknown";
  const routes = routeAreas({
    situation,
    region,
    supportArea: area,
    mobilityStatus: input.mobilityStatus
  });
  const categories = supportAreaCategories(area);

  return [
    "## 지역 문의처 찾기",
    `상황: ${situation}`,
    `지역: ${region}`,
    "",
    "## 우선 문의 순서",
    routes
      .slice(0, 4)
      .map((route, index) => `${index + 1}. ${route.label}\n   - 시작 경로: ${route.firstContact}\n   - 이유: ${route.reason}`)
      .join("\n"),
    "",
    mobilityContactSection(region, routes),
    "",
    region === "미확인"
      ? "## 한 가지 확인 질문\n지역 서비스는 거주지 기준으로 달라집니다. 어르신의 거주지 시·군·구를 확인하면 교통·복지·돌봄 문의처를 더 구체화할 수 있습니다."
      : "## 전화 전 준비\n- 거주지와 실제 돌봄 장소가 같은지 확인\n- 장기요양등급 신청/보유 여부 확인\n- 병원 이동, 식사, 목욕, 복약, 인지 변화 중 가장 급한 문제 1가지를 정리\n- 민감번호, 정확한 주소, 의료기록 파일은 이 도구에 입력하지 않고 공식 기관 문의 때만 필요한 범위에서 확인",
    "",
    "## 공식 출처",
    renderSources(sourcesFor([...categories, ...routes.map(route => route.area)])),
    "",
    officialConfirmationNotice()
  ].join("\n");
}

export function prepareInstitutionCallScript(input: {
  situation: string;
  institutionType?: InstitutionType;
  region?: string;
  mainConcern?: string;
}): string {
  const situation = sanitizeUserText(input.situation.trim());
  const region = cleanOptionalText(input.region);
  const institutionType = input.institutionType || "unknown";
  const concern = cleanOptionalText(input.mainConcern, situation);
  const questions = callQuestionsFor(institutionType, concern, region);

  return [
    "## 기관 전화 준비",
    `문의 대상: ${renderInstitutionType(institutionType)}`,
    `지역: ${region}`,
    `핵심 고민: ${concern}`,
    "",
    "## 전화 첫 문장",
    `안녕하세요. ${region}에 계신 어르신 돌봄 문제로 문의드립니다. ${concern} 상황인데, 어느 공식 절차나 담당 창구부터 확인해야 하는지 안내받고 싶습니다.`,
    "",
    "## 꼭 물어볼 질문",
    lineItems(questions),
    "",
    "## 전화 중 남길 메모",
    lineItems([
      "담당 기관명과 부서명",
      "다음 연락처 또는 공식 사이트 경로",
      "준비해야 할 서류·관찰 메모",
      "대상 여부를 최종 판단하는 기관과 기준",
      "다음 행동의 날짜와 담당자"
    ]),
    "",
    "## 주의",
    "전화 스크립트는 상담 준비용입니다. 주민등록번호, 정확한 주소, 의료기록 파일, 결제 정보는 이 도구에 입력하지 말고 공식 절차에서 필요한 범위로만 제출하세요.",
    "",
    "## 공식 출처",
    renderSources(sourcesFor(categoriesForInstitution(institutionType))),
    "",
    officialConfirmationNotice()
  ].join("\n");
}

export function checkUrgentCareNeed(input: {
  situation: string;
  dementiaStatus?: CareProfileInput["dementiaStatus"];
  recentChange?: string;
  safetyConcern?: string;
}): string {
  const situation = sanitizeUserText(input.situation.trim());
  const recentChange = cleanOptionalDetail(input.recentChange);
  const safetyConcern = cleanOptionalDetail(input.safetyConcern);
  const combined = [situation, recentChange, safetyConcern, input.dementiaStatus || ""].join(" ");
  const urgent = detectEmergency(combined) || input.dementiaStatus === "severe_symptoms";

  if (urgent) {
    return [
      "## 긴급도 확인",
      "현재 입력에는 먼저 안전 확인이 필요한 신호가 있습니다. 복지·요양 절차보다 위치 확인, 생명·신체 안전, 급성 증상 대응이 우선입니다.",
      "",
      "## 지금 할 일",
      lineItems([
        "실종·배회·범죄 위험은 112에 연락",
        "호흡곤란, 의식저하, 갑작스러운 마비·가슴 통증, 심한 낙상, 급성 혼란은 119 또는 가까운 응급의료기관에 연락",
        "가족 한 명은 마지막 확인 위치, 시간, 복장, 복용약, 최근 변화, 진단 여부를 짧게 정리",
        "안전이 확보된 뒤 치매안심센터, 의료기관, 장기요양보험, 지자체 돌봄 창구를 순서대로 확인"
      ]),
      "",
      "## 공식 출처",
      renderSources(sourcesFor(["emergency", "medical", "dementia"])),
      "",
      officialConfirmationNotice()
    ].join("\n");
  }

  return [
    "## 긴급도 확인",
    "입력만으로 즉시 112·119가 필요한 신호는 뚜렷하지 않습니다. 다만 고령자 상태 변화는 빠르게 달라질 수 있으므로 가족이 관찰 기준을 정해 두는 것이 좋습니다.",
    "",
    "## 오늘 확인할 기준",
    lineItems([
      "갑작스러운 의식 변화, 호흡곤란, 마비, 가슴 통증, 심한 낙상, 실종·배회 위험이 생기면 즉시 119 또는 112",
      "기억저하, 수면 변화, 복약 실수, 외출 후 길 잃음이 반복되면 의료기관 또는 치매안심센터 상담",
      "식사, 목욕, 이동, 배변, 복약이 지속적으로 어려우면 장기요양·지자체 돌봄 경로 확인",
      "병원 이동이나 외출이 어려우면 지역 교통약자 이동지원과 병원동행 사업 확인"
    ]),
    "",
    "## 공식 출처",
    renderSources(sourcesFor(["emergency", "medical", "dementia", "long_term_care", "mobility"])),
    "",
    officialConfirmationNotice()
  ].join("\n");
}

export function explainCareServiceTypes(input: {
  situation?: string;
  serviceType?: CareServiceType;
  region?: string;
  careNeeds?: string;
}): string {
  const type = input.serviceType || "unknown";
  const service = renderCareServiceType(type);
  const region = cleanOptionalText(input.region);
  const careNeeds = cleanOptionalDetail(input.careNeeds);
  const situation = cleanOptionalDetail(input.situation);

  const comparisonTypes: CareServiceType[] =
    type === "unknown"
      ? ["nursing_home", "care_hospital", "day_night_care", "home_visit_care", "mobility_support", "hospital_companion"]
      : [type];

  return [
    "## 돌봄 서비스 유형 설명",
    situation ? `상황: ${situation}` : "상황: 미확인",
    `지역: ${region}`,
    careNeeds ? `필요 지원: ${careNeeds}` : "필요 지원: 미확인",
    "",
    "## 핵심 구분",
    comparisonTypes
      .map(item => {
        const detail = renderCareServiceType(item);
        return `- ${detail.label}: ${detail.summary}\n  - 맞는 경우: ${detail.useWhen}\n  - 공식 확인: ${detail.verify.join(", ")}`;
      })
      .join("\n"),
    "",
    type === "unknown"
      ? "## 먼저 나눌 질문\n- 의료 처치와 입원 필요성이 큰가요, 일상생활 돌봄 공백이 큰가요?\n- 집에서 지내는 것을 유지하고 싶은가요, 일정 시간 기관 이용이 필요한가요?\n- 이동 자체가 어려운가요, 병원 방문 과정의 동행이 어려운가요?"
      : `## 이 유형을 볼 때 물어볼 질문\n- ${service.label}이 현재 필요와 맞는지 공식 기준이나 상담 답변으로 확인할 수 있나요?\n- 비용, 이용 조건, 응급 대응, 가족 연락 방식이 문서로 설명되나요?\n- 의료 판단이나 장기요양등급 승인 여부를 이 기관이 확정한다고 말하지는 않나요?`,
    "",
    "## 공식 출처",
    renderSources(sourcesFor(["facility", "long_term_care", "medical", "mobility", "local_government"])),
    "",
    officialConfirmationNotice()
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
