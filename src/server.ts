import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";
import * as z from "zod/v4";
import {
  analyzeFamilyCareSituation,
  buildDementiaCareChecklist,
  checkUrgentCareNeed,
  compareCareOrSupportOptions,
  explainCareServiceTypes,
  explainLongTermCarePath,
  findLocalSupportContacts,
  makeFamilyShareSummary,
  prepareInstitutionCallScript,
  routeSupportOptions
} from "./domain.js";
import { SOURCES } from "./sources.js";

const SERVICE_NAME = "Dolbom Navi(돌봄내비)";
const VERSION = "0.1.0";

type ToolAnnotations = {
  title: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  openWorldHint: boolean;
  idempotentHint: boolean;
};

const situationSchema = z.string().min(2).describe("가족이 겪는 돌봄 상황을 자연어로 적어주세요. 이름, 주민번호, 전화번호 같은 민감정보는 넣지 않습니다.");
const regionSchema = z.string().optional().describe("알고 있다면 어르신의 거주지 시·군·구 또는 돌봄이 실제로 이뤄지는 지역을 적어주세요.");
const ageRangeSchema = z.string().optional().describe("정확한 생년월일이 아니라 70대, 80대처럼 대략적인 연령대를 적어주세요.");
const dementiaStatusSchema = z
  .enum(["suspected", "diagnosed", "unknown", "severe_symptoms"])
  .optional()
  .describe("치매 관련 상태입니다. suspected=의심됨, diagnosed=진단받음, severe_symptoms=배회·실종 등 즉시 안전 확인 필요, unknown=미확인.");
const longTermCareGradeStatusSchema = z
  .enum(["none", "applied", "has_grade", "unknown"])
  .optional()
  .describe("장기요양등급 상태입니다. none=없음, applied=신청 중, has_grade=등급 있음, unknown=미확인.");
const mobilityStatusSchema = z.string().optional().describe("거동, 병원 이동, 외출, 휠체어, 동행 필요 여부처럼 이동 관련 상황을 적어주세요.");
const livingSituationSchema = z.string().optional().describe("독거, 가족 동거, 주간 보호 이용 여부 등 현재 생활·돌봄 환경을 적어주세요.");
const supportAreaSchema = z
  .enum(["welfare", "medical", "care", "mobility", "facility", "administration", "unknown"])
  .optional()
  .describe("우선 확인하고 싶은 영역입니다. welfare=복지, medical=의료, care=장기요양·돌봄, mobility=이동·교통, facility=시설, administration=행정, unknown=미확인.");
const institutionTypeSchema = z
  .enum(["nhis", "dementia_center", "local_government", "medical_provider", "mobility_center", "care_facility", "unknown"])
  .optional()
  .describe("전화하려는 기관 유형입니다. nhis=장기요양보험, dementia_center=치매안심센터, local_government=주민센터·시군구청, medical_provider=의료기관, mobility_center=교통약자 이동지원센터, care_facility=요양시설·돌봄기관, unknown=미정.");
const serviceTypeSchema = z
  .enum(["nursing_home", "care_hospital", "day_night_care", "home_visit_care", "short_term_care", "mobility_support", "hospital_companion", "unknown"])
  .optional()
  .describe("비교하거나 설명할 서비스 유형입니다. nursing_home=요양원, care_hospital=요양병원, day_night_care=주야간보호, home_visit_care=방문요양, short_term_care=단기보호, mobility_support=교통약자 이동지원, hospital_companion=병원동행, unknown=미정.");

function readOnlyAnnotations(title: string): ToolAnnotations {
  return {
    title,
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
    idempotentHint: true
  };
}

function textResult(text: string) {
  return {
    content: [{ type: "text" as const, text }]
  };
}

function allowedHostsFromEnv(): string[] | undefined {
  const hosts = process.env.MCP_ALLOWED_HOSTS?.split(",").map(host => host.trim()).filter(Boolean);
  return hosts && hosts.length > 0 ? hosts : undefined;
}

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "dolbom-navi",
      version: VERSION
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  server.registerTool(
    "analyze_family_care_situation",
    {
      title: "가족 돌봄 상황 분석",
      description:
        "돌봄내비가 부모님·조부모님 돌봄 상황을 파악해 복지·의료·교통 등 필요한 공공 지원 경로와 다음 확인 사항을 공식 출처 기반으로 정리합니다.",
      inputSchema: {
        situation: situationSchema,
        region: regionSchema,
        ageRange: ageRangeSchema,
        dementiaStatus: dementiaStatusSchema,
        longTermCareGradeStatus: longTermCareGradeStatusSchema,
        mobilityStatus: mobilityStatusSchema,
        livingSituation: livingSituationSchema,
        supportArea: supportAreaSchema
      },
      annotations: readOnlyAnnotations("가족 돌봄 상황 분석")
    },
    async input => textResult(analyzeFamilyCareSituation(input))
  );

  server.registerTool(
    "route_support_options",
    {
      title: "지원 경로 안내",
      description:
        "돌봄내비가 돌봄 고민을 입력받아 복지·의료·교통 등 관련 지원 영역을 분류하고, 문의·신청을 시작할 공식 경로를 안내합니다.",
      inputSchema: {
        situation: situationSchema,
        mainConcern: z.string().optional().describe("사용자가 가장 먼저 해결하고 싶은 고민을 짧게 적어주세요. 예: 병원 이동, 장기요양 신청, 요양시설 상담."),
        region: regionSchema,
        ageRange: ageRangeSchema,
        dementiaStatus: dementiaStatusSchema,
        longTermCareGradeStatus: longTermCareGradeStatusSchema,
        mobilityStatus: mobilityStatusSchema,
        livingSituation: livingSituationSchema,
        supportArea: supportAreaSchema
      },
      annotations: readOnlyAnnotations("지원 경로 안내")
    },
    async input => textResult(routeSupportOptions(input))
  );

  server.registerTool(
    "explain_long_term_care_path",
    {
      title: "장기요양 절차 설명",
      description:
        "돌봄내비가 장기요양 인정 신청부터 등급 판정 이후 준비까지 가족이 알아야 할 흐름을 쉬운 말로 설명합니다.",
      inputSchema: {
        situation: situationSchema,
        region: regionSchema,
        ageRange: ageRangeSchema,
        dementiaStatus: dementiaStatusSchema,
        longTermCareGradeStatus: longTermCareGradeStatusSchema,
        mobilityStatus: mobilityStatusSchema,
        livingSituation: livingSituationSchema,
        supportArea: supportAreaSchema
      },
      annotations: readOnlyAnnotations("장기요양 절차 설명")
    },
    async input => textResult(explainLongTermCarePath(input))
  );

  server.registerTool(
    "build_dementia_care_checklist",
    {
      title: "치매 돌봄 체크리스트",
      description:
        "돌봄내비가 치매 의심·진단 상황에서 가족이 관찰할 변화, 안전 확인 사항, 공식 상담·지원 경로를 체크리스트로 정리합니다.",
      inputSchema: {
        dementiaStatus: dementiaStatusSchema,
        region: regionSchema,
        situation: z.string().optional().describe("기억저하, 배회, 수면 변화, 안전 우려 등 가족이 관찰한 치매·인지 관련 상황을 적어주세요.")
      },
      annotations: readOnlyAnnotations("치매 돌봄 체크리스트")
    },
    async input => textResult(buildDementiaCareChecklist(input))
  );

  server.registerTool(
    "compare_care_or_support_options",
    {
      title: "돌봄 선택지 비교",
      description:
        "돌봄내비가 요양시설, 이동 지원, 지역 서비스 등 여러 선택지를 비교할 때 확인해야 할 질문과 전화 문의 문안을 정리합니다.",
      inputSchema: {
        region: regionSchema,
        desiredType: z.string().optional().describe("비교하려는 선택지 유형입니다. 예: 요양원, 주야간보호, 병원동행, 이동지원, 지역 돌봄서비스."),
        careNeeds: z.string().optional().describe("어르신에게 필요한 지원입니다. 예: 치매와 배회 위험, 야간 대응, 식사·목욕 도움, 병원 이동."),
        familyPriorities: z.string().optional().describe("가족이 중요하게 보는 기준입니다. 예: 비용 투명성, 야간 대응, 거리, 의료 연계, 상담 소통.")
      },
      annotations: readOnlyAnnotations("돌봄 선택지 비교")
    },
    async input => textResult(compareCareOrSupportOptions(input))
  );

  server.registerTool(
    "find_local_support_contacts",
    {
      title: "지역 문의처 찾기",
      description:
        "돌봄내비가 어르신 거주지와 돌봄 상황을 기준으로 주민센터·시군구청·장기요양보험·치매안심센터·교통약자 이동지원 등 공식 문의 경로를 정리합니다.",
      inputSchema: {
        situation: situationSchema,
        region: regionSchema,
        supportArea: supportAreaSchema,
        mobilityStatus: mobilityStatusSchema
      },
      annotations: readOnlyAnnotations("지역 문의처 찾기")
    },
    async input => textResult(findLocalSupportContacts(input))
  );

  server.registerTool(
    "prepare_institution_call_script",
    {
      title: "기관 전화 스크립트",
      description:
        "돌봄내비가 공단·주민센터·치매안심센터·교통지원센터·요양시설에 전화하기 전에 첫 문장, 확인 질문, 메모 항목을 공식 확인 중심으로 준비합니다.",
      inputSchema: {
        situation: situationSchema,
        institutionType: institutionTypeSchema,
        region: regionSchema,
        mainConcern: z.string().optional().describe("전화에서 가장 먼저 확인하려는 고민입니다. 예: 장기요양 신청, 병원 이동, 치매 상담, 요양원 비용.")
      },
      annotations: readOnlyAnnotations("기관 전화 스크립트")
    },
    async input => textResult(prepareInstitutionCallScript(input))
  );

  server.registerTool(
    "check_urgent_care_need",
    {
      title: "긴급도 확인",
      description:
        "돌봄내비가 배회·실종 우려, 낙상, 의식 변화, 호흡곤란, 갑작스러운 인지 변화처럼 먼저 112·119 또는 의료기관 확인이 필요한 신호를 분리합니다.",
      inputSchema: {
        situation: situationSchema,
        dementiaStatus: dementiaStatusSchema,
        recentChange: z.string().optional().describe("최근 갑자기 달라진 증상이나 행동이 있다면 적어주세요. 예: 낙상, 의식 변화, 수면 변화, 복약 실수."),
        safetyConcern: z.string().optional().describe("실종, 배회, 자해, 폭력, 혼자 외출처럼 가족이 걱정하는 안전 문제를 적어주세요.")
      },
      annotations: readOnlyAnnotations("긴급도 확인")
    },
    async input => textResult(checkUrgentCareNeed(input))
  );

  server.registerTool(
    "explain_care_service_types",
    {
      title: "돌봄 서비스 유형 설명",
      description:
        "돌봄내비가 요양원·요양병원·주야간보호·방문요양·단기보호·교통약자 이동지원·병원동행의 차이와 공식 확인 질문을 정리합니다.",
      inputSchema: {
        situation: z.string().optional().describe("어르신의 돌봄 상황을 자연어로 적어주세요. 민감정보는 넣지 않습니다."),
        serviceType: serviceTypeSchema,
        region: regionSchema,
        careNeeds: z.string().optional().describe("필요한 지원입니다. 예: 식사 도움, 배회 대응, 야간 대응, 병원 이동, 재활.")
      },
      annotations: readOnlyAnnotations("돌봄 서비스 유형 설명")
    },
    async input => textResult(explainCareServiceTypes(input))
  );

  server.registerTool(
    "make_family_share_summary",
    {
      title: "가족 공유용 요약",
      description:
        "돌봄내비가 가족 단톡방에 공유하기 좋도록 현재 상황, 확인할 일, 역할 분담 초안을 민감정보 없이 짧게 정리합니다.",
      inputSchema: {
        situation: situationSchema,
        recommendedPath: z.string().optional().describe("이미 정한 우선 문의 경로나 지원 영역이 있다면 적어주세요. 없으면 비워둡니다."),
        checklist: z.array(z.string().describe("가족이 확인하거나 나눠 맡을 일을 한 줄씩 적어주세요.")).optional().describe("가족 단톡방에 넣을 확인 목록입니다.")
      },
      annotations: readOnlyAnnotations("가족 공유용 요약")
    },
    async input => textResult(makeFamilyShareSummary(input))
  );

  server.registerResource(
    "official-source-registry",
    "dolbom-navi://sources/official",
    {
      title: "돌봄내비 공식 출처 목록",
      description: "돌봄내비가 안내에 사용하는 공식·공공기관 출처 목록입니다.",
      mimeType: "application/json"
    },
    async uri => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(SOURCES, null, 2)
        }
      ]
    })
  );

  return server;
}

export function createApp() {
  const allowedHosts = allowedHostsFromEnv();
  const app = createMcpExpressApp(allowedHosts ? { host: "0.0.0.0", allowedHosts } : { host: "0.0.0.0" });

  app.get("/", (_req: Request, res: Response) => {
    res.type("text/plain").send(`${SERVICE_NAME} MCP server is running. Use POST /mcp for Streamable HTTP.`);
  });

  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: "dolbom-navi",
      version: VERSION,
      transport: "streamable-http",
      stateless: true
    });
  });

  app.post("/mcp", async (req: Request, res: Response) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        });
      }
    }
  });

  app.get("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. Use POST /mcp for Streamable HTTP requests."
      },
      id: null
    });
  });

  app.delete("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed for stateless server."
      },
      id: null
    });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 3000);
  const app = createApp();

  app.listen(port, "0.0.0.0", error => {
    if (error) {
      console.error("Failed to start server", error);
      process.exit(1);
    }
    console.log(`${SERVICE_NAME} listening on port ${port}`);
  });
}
