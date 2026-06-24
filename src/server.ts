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
        "Dolbom Navi(돌봄내비) analyzes a Korean elder-care family situation and routes it across welfare, medical, care, mobility, facility, dementia, and long-term-care support areas using official-source guidance.",
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
      annotations: readOnlyAnnotations("Analyze family elder-care situation")
    },
    async input => textResult(analyzeFamilyCareSituation(input))
  );

  server.registerTool(
    "route_support_options",
    {
      title: "Route Senior Support Options",
      description:
        "Dolbom Navi(돌봄내비) maps a senior-support concern to likely official support paths such as welfare, medical, mobility, long-term care, dementia support, facilities, or local administration.",
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
      annotations: readOnlyAnnotations("Route support options")
    },
    async input => textResult(routeSupportOptions(input))
  );

  server.registerTool(
    "explain_long_term_care_path",
    {
      title: "Explain Long Term Care Path",
      description:
        "Dolbom Navi(돌봄내비) explains the Korean long-term care navigation path in plain language and lists family preparation steps without deciding eligibility or grade approval.",
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
      annotations: readOnlyAnnotations("Explain long-term care path")
    },
    async input => textResult(explainLongTermCarePath(input))
  );

  server.registerTool(
    "build_dementia_care_checklist",
    {
      title: "Build Dementia Care Checklist",
      description:
        "Dolbom Navi(돌봄내비) builds a non-diagnostic dementia and cognitive-care checklist for families, including observation notes, safety flags, and official support paths.",
      inputSchema: {
        dementiaStatus: z.enum(["suspected", "diagnosed", "unknown", "severe_symptoms"]).optional(),
        region: z.string().optional(),
        situation: z.string().optional()
      },
      annotations: readOnlyAnnotations("Build dementia care checklist")
    },
    async input => textResult(buildDementiaCareChecklist(input))
  );

  server.registerTool(
    "compare_care_or_support_options",
    {
      title: "Compare Care Or Support Options",
      description:
        "Dolbom Navi(돌봄내비) creates a source-conscious comparison checklist and phone script for care facilities, mobility support, local services, or other senior-support options without ranking unverified providers.",
      inputSchema: {
        region: z.string().optional(),
        desiredType: z.string().optional(),
        careNeeds: z.string().optional(),
        familyPriorities: z.string().optional()
      },
      annotations: readOnlyAnnotations("Compare care or support options")
    },
    async input => textResult(compareCareOrSupportOptions(input))
  );

  server.registerTool(
    "make_family_share_summary",
    {
      title: "Make Family Share Summary",
      description:
        "Dolbom Navi(돌봄내비) turns a senior-support situation and checklist into a concise Korean family-chat summary for coordination, while avoiding sensitive identifiers.",
      inputSchema: {
        situation: z.string().min(2),
        recommendedPath: z.string().optional(),
        checklist: z.array(z.string()).optional()
      },
      annotations: readOnlyAnnotations("Make family share summary")
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
  const app = createMcpExpressApp({ host: "0.0.0.0" });

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
