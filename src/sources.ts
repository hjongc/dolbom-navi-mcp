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
    id: "emergency-119",
    title: "긴급상황 신고",
    category: "emergency",
    sourceName: "119",
    url: "https://www.119.go.kr/",
    reviewedAt: REVIEWED_AT,
    confidence: "official_national",
    useFor: "즉각적 위험, 실종·배회, 급성 증상 등 긴급 안전 상황"
  }
];

export function sourcesFor(categories: SourceCategory[]): SourceRecord[] {
  const selected = new Set(categories);
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
