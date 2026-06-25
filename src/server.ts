import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";
import * as z from "zod/v4";
import {
  analyzeFamilyCareSituation,
  buildDementiaCareChecklist,
  compareCareOrSupportOptions,
  explainLongTermCarePath,
  makeFamilyShareSummary,
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
      title: "Analyze Family Care Situation",
      description:
        "돌봄내비가 부모님·조부모님 돌봄 상황을 파악해 복지·의료·교통 등 필요한 공공 지원 경로와 다음 확인 사항을 공식 출처 기반으로 정리합니다.",
      inputSchema: {
        situation: z.string().min(2).describe("Natural language description of the family elder-care situation."),
        region: z.string().optional().describe("City, district, or local area if known."),
        ageRange: z.string().optional().describe("Approximate age range, not a resident identifier."),
        dementiaStatus: z.enum(["suspected", "diagnosed", "unknown", "severe_symptoms"]).optional(),
        longTermCareGradeStatus: z.enum(["none", "applied", "has_grade", "unknown"]).optional(),
        mobilityStatus: z.string().optional(),
        livingSituation: z.string().optional(),
        supportArea: z.enum(["welfare", "medical", "care", "mobility", "facility", "administration", "unknown"]).optional()
      },
      annotations: readOnlyAnnotations("가족 돌봄 상황 분석")
    },
    async input => textResult(analyzeFamilyCareSituation(input))
  );

  server.registerTool(
    "route_support_options",
    {
      title: "Route Senior Support Options",
      description:
        "돌봄내비가 돌봄 고민을 입력받아 복지·의료·교통 등 관련 지원 영역을 분류하고, 문의·신청을 시작할 공식 경로를 안내합니다.",
      inputSchema: {
        situation: z.string().min(2),
        mainConcern: z.string().optional(),
        region: z.string().optional(),
        ageRange: z.string().optional(),
        dementiaStatus: z.enum(["suspected", "diagnosed", "unknown", "severe_symptoms"]).optional(),
        longTermCareGradeStatus: z.enum(["none", "applied", "has_grade", "unknown"]).optional(),
        mobilityStatus: z.string().optional(),
        livingSituation: z.string().optional(),
        supportArea: z.enum(["welfare", "medical", "care", "mobility", "facility", "administration", "unknown"]).optional()
      },
      annotations: readOnlyAnnotations("지원 경로 안내")
    },
    async input => textResult(routeSupportOptions(input))
  );

  server.registerTool(
    "explain_long_term_care_path",
    {
      title: "Explain Long Term Care Path",
      description:
        "돌봄내비가 장기요양 인정 신청부터 등급 판정 이후 준비까지 가족이 알아야 할 흐름을 쉬운 말로 설명합니다.",
      inputSchema: {
        situation: z.string().min(2),
        region: z.string().optional(),
        ageRange: z.string().optional(),
        dementiaStatus: z.enum(["suspected", "diagnosed", "unknown", "severe_symptoms"]).optional(),
        longTermCareGradeStatus: z.enum(["none", "applied", "has_grade", "unknown"]).optional(),
        mobilityStatus: z.string().optional(),
        livingSituation: z.string().optional(),
        supportArea: z.enum(["welfare", "medical", "care", "mobility", "facility", "administration", "unknown"]).optional()
      },
      annotations: readOnlyAnnotations("장기요양 절차 설명")
    },
    async input => textResult(explainLongTermCarePath(input))
  );

  server.registerTool(
    "build_dementia_care_checklist",
    {
      title: "Build Dementia Care Checklist",
      description:
        "돌봄내비가 치매 의심·진단 상황에서 가족이 관찰할 변화, 안전 확인 사항, 공식 상담·지원 경로를 체크리스트로 정리합니다.",
      inputSchema: {
        dementiaStatus: z.enum(["suspected", "diagnosed", "unknown", "severe_symptoms"]).optional(),
        region: z.string().optional(),
        situation: z.string().optional()
      },
      annotations: readOnlyAnnotations("치매 돌봄 체크리스트")
    },
    async input => textResult(buildDementiaCareChecklist(input))
  );

  server.registerTool(
    "compare_care_or_support_options",
    {
      title: "Compare Care Or Support Options",
      description:
        "돌봄내비가 요양시설, 이동 지원, 지역 서비스 등 여러 선택지를 비교할 때 확인해야 할 질문과 전화 문의 문안을 정리합니다.",
      inputSchema: {
        region: z.string().optional(),
        desiredType: z.string().optional(),
        careNeeds: z.string().optional(),
        familyPriorities: z.string().optional()
      },
      annotations: readOnlyAnnotations("돌봄 선택지 비교")
    },
    async input => textResult(compareCareOrSupportOptions(input))
  );

  server.registerTool(
    "make_family_share_summary",
    {
      title: "Make Family Share Summary",
      description:
        "돌봄내비가 가족 단톡방에 공유하기 좋도록 현재 상황, 확인할 일, 역할 분담 초안을 민감정보 없이 짧게 정리합니다.",
      inputSchema: {
        situation: z.string().min(2),
        recommendedPath: z.string().optional(),
        checklist: z.array(z.string()).optional()
      },
      annotations: readOnlyAnnotations("가족 공유용 요약")
    },
    async input => textResult(makeFamilyShareSummary(input))
  );

  server.registerResource(
    "official-source-registry",
    "dolbom-navi://sources/official",
    {
      title: "Dolbom Navi Official Source Registry",
      description: "Official and public-agency source registry used by Dolbom Navi(돌봄내비).",
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
