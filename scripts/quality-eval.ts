import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = process.env.MCP_ENDPOINT;

if (!endpoint) {
  throw new Error(
    "MCP_ENDPOINT is required. Example: MCP_ENDPOINT=https://your-server.playmcp-endpoint.kakaocloud.io/mcp npm run quality:eval"
  );
}

const mcpEndpoint = endpoint;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function hasKorean(text: unknown): boolean {
  return typeof text === "string" && /[가-힣]/.test(text);
}

function toolText(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  const first = content?.[0];
  assert(first?.type === "text" && typeof first.text === "string", "Tool result must contain text content");
  return first.text;
}

function assertNoPlaceholderLeak(text: string, label: string) {
  assert(!/\bunknown\b|\bundefined\b|\bnull\b|\bn\/a\b/i.test(text), `${label} leaks placeholder text`);
}

async function main() {
  const client = new Client({ name: "dolbom-navi-quality-eval", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpEndpoint));
  await client.connect(transport);

  const tools = await client.listTools();
  console.log(`mcp_endpoint=${mcpEndpoint}`);
  console.log(`tools=${tools.tools.map(tool => tool.name).join(",")}`);
  assert(tools.tools.length === 6, `Expected 6 tools, got ${tools.tools.length}`);

  const resources = await client.listResources();
  const officialResource = resources.resources.find(resource => resource.uri === "dolbom-navi://sources/official");
  assert(officialResource, "Official source registry resource must be listed");
  assert(hasKorean(officialResource.title), "Official source registry resource title must be Korean");
  assert(hasKorean(officialResource.description), "Official source registry resource description must be Korean");

  const registry = await client.readResource({ uri: "dolbom-navi://sources/official" });
  const registryContent = registry.contents?.[0];
  const registryText = registryContent && "text" in registryContent ? registryContent.text : undefined;
  assert(typeof registryText === "string", "Official source registry resource must return text");
  const sourceRecords = JSON.parse(registryText) as Array<{ sourceName?: string; url?: string; confidence?: string }>;
  assert(sourceRecords.length >= 10, "Official source registry must include national, local, and public-agency sources");
  for (const expected of ["국민건강보험공단", "정부24", "복지로", "보건복지부", "중앙치매센터", "119", "경찰청 112"]) {
    assert(sourceRecords.some(source => source.sourceName?.includes(expected)), `Official source registry missing ${expected}`);
  }
  assert(sourceRecords.every(source => source.url?.startsWith("http")), "Official source registry source URLs must be absolute HTTP(S) URLs");
  assert(sourceRecords.every(source => source.confidence), "Official source registry sources must include confidence labels");
  console.log(`resources=${resources.resources.map(resource => resource.uri).join(",")}`);

  for (const tool of tools.tools) {
    assert(hasKorean(tool.title), `${tool.name} title must be Korean`);
    assert(hasKorean(tool.description), `${tool.name} description must be Korean`);
    const properties = (tool.inputSchema as { properties?: Record<string, { description?: unknown }> }).properties;
    assert(properties, `${tool.name} must expose input schema properties`);
    for (const [name, schema] of Object.entries(properties)) {
      assert(hasKorean(schema.description), `${tool.name}.${name} must have a Korean description`);
    }
  }

  const cases: Array<{
    name: string;
    tool: string;
    arguments: Record<string, unknown>;
    mustInclude: RegExp[];
    mustNotInclude?: RegExp[];
  }> = [
    {
      name: "korean enum labels and long-term care caveat",
      tool: "analyze_family_care_situation",
      arguments: {
        situation: "할머니 치매 의심과 장기요양, 어디부터 시작하죠",
        dementiaStatus: "suspected",
        longTermCareGradeStatus: "unknown"
      },
      mustInclude: [/치매·인지건강 지원/, /장기요양등급: 미확인/, /확인 필요/, /의학적 진단/, /장기요양등급 승인/],
      mustNotInclude: [/현재 상태: suspected/, /\bunknown\b/i]
    },
    {
      name: "mobility route priority and local contact",
      tool: "route_support_options",
      arguments: {
        situation: "서울 관악구에서 아버지 병원 이동 지원을 알아봐줘",
        mainConcern: "병원 이동 지원",
        region: "서울 관악구",
        supportArea: "mobility"
      },
      mustInclude: [/1\. 이동·교통·병원동행/, /서울시설공단 장애인콜택시/, /1588-4388/],
      mustNotInclude: [/\bunknown\b/i]
    },
    {
      name: "emergency wandering prioritizes safety",
      tool: "build_dementia_care_checklist",
      arguments: {
        situation: "할아버지가 밤에 배회해서 실종될까 걱정돼요",
        dementiaStatus: "severe_symptoms"
      },
      mustInclude: [/먼저 안전 확인/, /112/, /119/, /공식 출처/]
    },
    {
      name: "facility comparison avoids ranking",
      tool: "compare_care_or_support_options",
      arguments: {
        region: "unknown",
        desiredType: "요양원",
        careNeeds: "비용과 야간대응",
        familyPriorities: "unknown"
      },
      mustInclude: [/지역: 미확인/, /특정 기관 순위/, /공식 정보/, /전화 상담 질문/],
      mustNotInclude: [/\bunknown\b/i, /가족 우선순위: unknown/]
    },
    {
      name: "family summary redacts sensitive identifiers",
      tool: "make_family_share_summary",
      arguments: {
        situation: "아버지 병원 이동이 어려움. 연락처 010-1234-5678, 주민번호 440101-1234567",
        checklist: ["거주지 교통지원 확인", "담당자 02-123-4567에 전화"]
      },
      mustInclude: [/\[연락처 생략\]/, /\[민감번호 생략\]/, /공식 기관과 의료진/],
      mustNotInclude: [/010-1234-5678/, /440101-1234567/, /02-123-4567/]
    }
  ];

  for (const evalCase of cases) {
    const result = await client.callTool({ name: evalCase.tool, arguments: evalCase.arguments });
    const text = toolText(result);
    assertNoPlaceholderLeak(text, evalCase.name);
    for (const pattern of evalCase.mustInclude) {
      assert(pattern.test(text), `${evalCase.name} missing ${pattern}`);
    }
    for (const pattern of evalCase.mustNotInclude || []) {
      assert(!pattern.test(text), `${evalCase.name} unexpectedly matched ${pattern}`);
    }
    console.log(`passed=${evalCase.name}`);
  }

  await client.close();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
