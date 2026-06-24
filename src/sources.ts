export type SourceCategory =
  | "long_term_care"
  | "welfare"
  | "medical"
  | "dementia"
  | "mobility"
  | "facility"
  | "emergency"
  | "local_government";

export interface SourceRecord {
  id: string;
  title: string;
  category: SourceCategory;
  sourceName: string;
  url: string;
  reviewedAt: string;
  confidence: "official_national" | "official_local" | "public_agency";
  useFor: string;
}

export const REVIEWED_AT = "2026-06-24";

export const SOURCES: SourceRecord[] = [
  {
    id: "nhis-long-term-care",
    title: "노인장기요양보험 및 장기요양기관 정보",
    category: "long_term_care",
    sourceName: "국민건강보험공단 노인장기요양보험",
    url: "https://www.longtermcare.or.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "장기요양인정 신청, 등급, 급여, 장기요양기관 정보 확인 경로 안내"
  },
  {
    id: "gov24-service",
    title: "정부서비스·민원·혜택 통합 탐색",
    category: "welfare",
    sourceName: "정부24",
    url: "https://www.gov.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "노인·가족 관련 민원, 복지서비스, 신청 경로 확인"
  },
  {
    id: "bokjiro-service",
    title: "복지서비스 및 맞춤형 복지 정보",
    category: "welfare",
    sourceName: "복지로",
    url: "https://www.bokjiro.go.kr/ssis-tbu/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "복지서비스 검색, 생애주기·가구상황별 복지정보 확인"
  },
  {
    id: "mohw-policy",
    title: "보건복지 정책 및 제도 안내",
    category: "medical",
    sourceName: "보건복지부",
    url: "https://www.mohw.go.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "노인복지, 의료, 돌봄, 응급의료, 정책 원문 확인"
  },
  {
    id: "egen-emergency",
    title: "응급의료기관 및 응급의료 정보",
    category: "medical",
    sourceName: "응급의료포털 E-Gen",
    url: "https://www.e-gen.or.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "응급의료기관 탐색, 응급의료 정보 확인, 급성 증상 시 의료 경로 안내"
  },
  {
    id: "nid-dementia",
    title: "치매 정보 및 치매안심센터 경로",
    category: "dementia",
    sourceName: "중앙치매센터",
    url: "https://www.nid.or.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "public_agency",
    useFor: "치매 의심·진단 후 가족 체크리스트와 지역 치매안심센터 문의 경로 안내"
  },
  {
    id: "nid-callcenter",
    title: "치매상담콜센터",
    category: "dementia",
    sourceName: "중앙치매센터 치매상담콜센터",
    url: "https://www.nid.or.kr/main/main.aspx",
    reviewedAt: REVIEWED_AT,
    confidence: "public_agency",
    useFor: "치매 관련 상담, 가족 문의, 치매안심센터 연결 전 초기 상담 경로 안내"
  },
  {
    id: "local-government",
    title: "지자체별 노인복지·교통·돌봄 서비스",
    category: "local_government",
    sourceName: "거주지 시·군·구청 공식 누리집",
    url: "https://www.gov.kr/portal/orgInfo",
    reviewedAt: REVIEWED_AT,
    confidence: "official_local",
    useFor: "지역별 병원동행, 교통지원, 노인복지관, 돌봄서비스 세부조건 확인"
  },
  {
    id: "local-mobility-support",
    title: "지역별 교통약자·병원동행 지원",
    category: "mobility",
    sourceName: "거주지 시·군·구청 교통·복지 담당 공식 누리집",
    url: "https://www.gov.kr/portal/orgInfo",
    reviewedAt: REVIEWED_AT,
    confidence: "official_local",
    useFor: "교통약자 이동지원, 병원동행, 노인 외출지원 등 지역별 조건 확인"
  },
  {
    id: "ltc-facility-search",
    title: "장기요양기관 및 시설 정보 확인",
    category: "facility",
    sourceName: "국민건강보험공단 노인장기요양보험 장기요양기관 정보",
    url: "https://www.longtermcare.or.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "장기요양기관 정보, 시설 상담 전 공식 확인 경로 안내"
  },
  {
    id: "emergency-119",
    title: "긴급상황 신고",
    category: "emergency",
    sourceName: "119",
    url: "https://www.119.go.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "즉각적 위험, 실종·배회, 급성 증상 등 긴급 안전 상황"
  },
  {
    id: "police-112",
    title: "긴급범죄·실종 신고",
    category: "emergency",
    sourceName: "경찰청 112",
    url: "https://www.police.go.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "실종, 배회, 범죄 위험, 즉각적 안전 확인이 필요한 상황"
  }
];

const CATEGORY_COMPANIONS: Partial<Record<SourceCategory, SourceCategory[]>> = {
  mobility: ["local_government", "medical"],
  facility: ["long_term_care", "local_government", "medical"],
  dementia: ["medical"],
  emergency: ["medical"]
};

export function sourcesFor(categories: SourceCategory[]): SourceRecord[] {
  const selected = new Set(categories);
  for (const category of categories) {
    for (const companion of CATEGORY_COMPANIONS[category] ?? []) {
      selected.add(companion);
    }
  }
  const result = SOURCES.filter(source => selected.has(source.category));
  if (!result.some(source => source.id === "mohw-policy")) {
    result.push(SOURCES.find(source => source.id === "mohw-policy")!);
  }
  return result;
}

export function renderSources(sources: SourceRecord[]): string {
  return sources
    .map(source => `- ${source.sourceName}: ${source.url} (검토일: ${source.reviewedAt})`)
    .join("\n");
}
