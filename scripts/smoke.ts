import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = process.env.MCP_ENDPOINT || "http://127.0.0.1:3000/mcp";
const supportedPlayMcpProtocolVersions = new Set(["2025-03-26", "2025-06-18", "2025-11-25"]);

async function main() {
  const client = new Client({
    name: "dolbom-navi-smoke-client",
    version: "0.1.0"
  });

  const transport = new StreamableHTTPClientTransport(new URL(endpoint));
  await client.connect(transport);

  const protocolVersion = transport.protocolVersion;
  console.log(`protocol=${protocolVersion}`);
  if (!protocolVersion || !supportedPlayMcpProtocolVersions.has(protocolVersion)) {
    throw new Error(`Negotiated protocol version is outside the PlayMCP-supported range: ${protocolVersion ?? "unknown"}`);
  }

  const serverVersion = client.getServerVersion();
  if (!serverVersion?.name || /kakao/i.test(serverVersion.name)) {
    throw new Error(`Server name is missing or contains forbidden kakao string: ${serverVersion?.name ?? "unknown"}`);
  }

  const tools = await client.listTools();
  const names = tools.tools.map(tool => tool.name).sort();
  console.log(`tools=${names.join(",")}`);

  if (names.length < 3 || names.length > 10) {
    throw new Error(`Expected 3-10 tools, got ${names.length}`);
  }

  if (names.some(name => /kakao/i.test(name))) {
    throw new Error("Tool name contains forbidden kakao string");
  }

  if (names.some(name => !/^[A-Za-z0-9_-]{1,128}$/.test(name))) {
    throw new Error("Tool name contains characters outside the PlayMCP allowed set");
  }

  for (const tool of tools.tools) {
    if (!tool.description || tool.description.length > 1024) {
      throw new Error(`Tool ${tool.name} has missing or too long description`);
    }
    if (!/[가-힣]/.test(tool.description) || !tool.description.includes("돌봄내비")) {
      throw new Error(`Tool ${tool.name} description must be natural Korean and include 돌봄내비`);
    }
    const annotations = tool.annotations;
    if (
      !annotations ||
      typeof annotations.title !== "string" ||
      typeof annotations.readOnlyHint !== "boolean" ||
      typeof annotations.destructiveHint !== "boolean" ||
      typeof annotations.openWorldHint !== "boolean" ||
      typeof annotations.idempotentHint !== "boolean"
    ) {
      throw new Error(`Tool ${tool.name} is missing required PlayMCP annotations`);
    }
  }

  const calls = [];
  let result;
  for (let i = 0; i < 10; i++) {
    const startedAt = performance.now();
    result = await client.callTool({
      name: "analyze_family_care_situation",
      arguments: {
        situation: "부모님이 할머니 돌봄 정보를 찾기 힘들어하세요. 복지, 의료, 요양 중 어디서부터 봐야 해요?",
        region: "서울 관악구",
        ageRange: "80대"
      }
    });
    calls.push(performance.now() - startedAt);
  }

  const maxMs = Math.max(...calls);
  const avgMs = calls.reduce((sum, value) => sum + value, 0) / calls.length;
  console.log(`latency_ms avg=${avgMs.toFixed(1)} max=${maxMs.toFixed(1)}`);
  if (maxMs > 3000) {
    throw new Error(`Smoke latency exceeded 3000ms: ${maxMs.toFixed(1)}ms`);
  }

  result ??= await client.callTool({
    name: "analyze_family_care_situation",
    arguments: {
      situation: "부모님이 할머니 돌봄 정보를 찾기 힘들어하세요. 복지, 의료, 요양 중 어디서부터 봐야 해요?",
      region: "서울 관악구",
      ageRange: "80대"
    }
  });

  console.log(JSON.stringify(result, null, 2));
  await client.close();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
