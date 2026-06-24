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

export interface MobilityContact {
  id: string;
  regions: string[];
  centerName: string;
  url: string;
  phoneNumbers: string[];
  reviewedAt: string;
  note: string;
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

export const MOBILITY_CONTACTS: MobilityContact[] = [
  {
    id: "seoul-accessible-taxi",
    regions: ["서울", "서울특별시"],
    centerName: "서울시설공단 장애인콜택시",
    url: "https://www.sisul.or.kr/open_content/calltaxi/",
    phoneNumbers: ["1588-4388", "02-2024-4200"],
    reviewedAt: REVIEWED_AT,
    note: "서울 장애인콜택시 접수 대표번호"
  },
  {
    id: "busan-duribal",
    regions: ["부산", "부산광역시"],
    centerName: "부산시설공단 두리발",
    url: "https://www.duribal.co.kr/",
    phoneNumbers: ["1555-1114"],
    reviewedAt: REVIEWED_AT,
    note: "부산 교통약자 특별교통수단 콜센터"
  },
  {
    id: "incheon-bandicall",
    regions: ["인천", "인천광역시"],
    centerName: "인천교통약자 이동지원센터 반디콜",
    url: "https://www.intis.or.kr/?mcode=about04",
    phoneNumbers: ["1577-0320", "032-430-7000"],
    reviewedAt: REVIEWED_AT,
    note: "인천 교통약자 이동지원차량 대표번호"
  },
  {
    id: "gyeonggi-sts",
    regions: ["경기", "경기도"],
    centerName: "경기도 교통약자 광역이동지원센터",
    url: "https://ggsts.gg.go.kr/",
    phoneNumbers: ["1666-0420", "1555-0420", "031-857-0420"],
    reviewedAt: REVIEWED_AT,
    note: "경기도 광역이동지원센터 대표번호"
  },
  {
    id: "daegu-nadri",
    regions: ["대구", "대구광역시"],
    centerName: "대구공공시설관리공단 이동지원센터 나드리콜",
    url: "https://nadrihome.dpfc.or.kr/",
    phoneNumbers: ["1577-6776", "053-603-6000"],
    reviewedAt: REVIEWED_AT,
    note: "대구 나드리콜 대표전화"
  },
  {
    id: "daejeon-call",
    regions: ["대전", "대전광역시"],
    centerName: "대전교통약자이동지원센터",
    url: "https://djcall.or.kr/information3.php",
    phoneNumbers: ["1588-1668", "042-612-1010"],
    reviewedAt: REVIEWED_AT,
    note: "대전 차량접수 번호"
  },
  {
    id: "gwangju-saebit",
    regions: ["광주", "광주광역시"],
    centerName: "광주광역시교통약자이동지원센터 새빛콜",
    url: "https://gjtsc.com/",
    phoneNumbers: ["1668-2222"],
    reviewedAt: REVIEWED_AT,
    note: "광주 전화접수 및 이용문의"
  },
  {
    id: "ulsan-bureumi",
    regions: ["울산", "울산광역시"],
    centerName: "울산광역시 장애인콜택시 부르미",
    url: "https://www.usdws.or.kr/business_02.html",
    phoneNumbers: ["052-292-8253"],
    reviewedAt: REVIEWED_AT,
    note: "울산 부르미 문의전화"
  },
  {
    id: "sejong-nuricall",
    regions: ["세종", "세종특별자치시"],
    centerName: "세종누리콜",
    url: "https://nuricall.sctc.kr/",
    phoneNumbers: ["1899-9042"],
    reviewedAt: REVIEWED_AT,
    note: "세종 누리콜 전화접수 및 이용문의"
  },
  {
    id: "gangwon-sts",
    regions: ["강원", "강원도", "강원특별자치도"],
    centerName: "강원특별자치도광역이동지원센터",
    url: "https://call.gwd.go.kr/guide/web",
    phoneNumbers: ["1577-2014"],
    reviewedAt: REVIEWED_AT,
    note: "강원 전화 및 문자 접수 대표번호"
  },
  {
    id: "chungnam-sts",
    regions: ["충남", "충청남도"],
    centerName: "충남광역이동지원센터",
    url: "https://www.16445588.or.kr/",
    phoneNumbers: ["1644-5588"],
    reviewedAt: REVIEWED_AT,
    note: "충남 전화 및 문자 접수 대표번호"
  },
  {
    id: "jeonbuk-sts",
    regions: ["전북", "전라북도", "전북특별자치도"],
    centerName: "전북특별자치도 광역이동지원센터",
    url: "https://0632270002.com/",
    phoneNumbers: ["063-227-0002"],
    reviewedAt: REVIEWED_AT,
    note: "전북 광역이동지원센터 콜센터 전화접수"
  },
  {
    id: "jeonnam-sts",
    regions: ["전남", "전라남도"],
    centerName: "전남광역 이동지원센터",
    url: "https://doumcall.kr/guide/car",
    phoneNumbers: ["1899-1110"],
    reviewedAt: REVIEWED_AT,
    note: "전남 전화 및 문자 접수"
  },
  {
    id: "gyeongbuk-bureum",
    regions: ["경북", "경상북도"],
    centerName: "경북 광역이동지원센터 부름콜",
    url: "http://brmcall.co.kr/info06",
    phoneNumbers: ["1899-7770"],
    reviewedAt: REVIEWED_AT,
    note: "경북 부름콜 대표전화"
  },
  {
    id: "gyeongnam-sts",
    regions: ["경남", "경상남도"],
    centerName: "경상남도광역 이동지원센터",
    url: "http://www.15664488.co.kr/main",
    phoneNumbers: ["1566-4488"],
    reviewedAt: REVIEWED_AT,
    note: "경남 고객문의센터 대표번호"
  },
  {
    id: "jeju-happycall",
    regions: ["제주", "제주도", "제주특별자치도"],
    centerName: "제주특별자치도 교통약자 이동지원센터",
    url: "https://www.jejuhappycall.com/",
    phoneNumbers: ["1899-6884", "010-6641-6884"],
    reviewedAt: REVIEWED_AT,
    note: "제주 콜센터 및 문자접수"
  }
];

const CATEGORY_COMPANIONS: Partial<Record<SourceCategory, SourceCategory[]>> = {
  mobility: ["local_government", "medical"],
  facility: ["long_term_care", "local_government", "medical"],
  dementia: ["medical"],
  emergency: ["medical"]
};

function normalizeRegion(region: string): string {
  return region.replace(/\s+/g, "").toLowerCase();
}

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
  if (sources.length === 0) {
    throw new Error("Official source registry returned no sources for this response.");
  }

  return sources
    .map(source => `- ${source.sourceName}: ${source.url} (검토일: ${source.reviewedAt})`)
    .join("\n");
}

export function mobilityContactsFor(region?: string): MobilityContact[] {
  if (!region || region === "미확인") return [];

  const normalized = normalizeRegion(region);
  return MOBILITY_CONTACTS.filter(contact =>
    contact.regions.some(alias => normalized.includes(normalizeRegion(alias)))
  );
}

export function renderMobilityContacts(contacts: MobilityContact[]): string {
  if (contacts.length === 0) {
    throw new Error("Mobility contact registry returned no contacts for this response.");
  }

  return contacts
    .map(contact => {
      const phones = contact.phoneNumbers.join(", ");
      return `- ${contact.centerName}: ${phones} / ${contact.url} (검토일: ${contact.reviewedAt})`;
    })
    .join("\n");
}
