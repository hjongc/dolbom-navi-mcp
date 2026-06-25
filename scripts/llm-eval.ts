import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
};

type EvalCase = {
  prompt: string;
  expectedTools: string[];
  requiredTerms?: string[];
};

const apiKey = process.env.OPENROUTER_API_KEY;
const model = process.env.OPENROUTER_MODEL || "openai/gpt-4.1-mini";
const mcpEndpoint = process.env.MCP_ENDPOINT || "https://dolbom-navi.playmcp-endpoint.kakaocloud.io/mcp";

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is required. Export it only in your shell; do not commit it.");
}

const evalCases: EvalCase[] = [
  {
    prompt: "할머니 치매 의심과 장기요양, 어디부터 시작하죠",
    expectedTools: ["analyze_family_care_situation", "build_dementia_care_checklist", "explain_long_term_care_path"],
    requiredTerms: ["치매안심센터", "장기요양"]
  },
  {
    prompt: "아버지 병원 이동·동행 지원은 어디에 문의하나요",
    expectedTools: ["route_support_options", "analyze_family_care_situation"],
    requiredTerms: ["시·군·구청", "교통"]
  },
  {
    prompt: "요양원 비용·야간대응 상담 질문을 정리해줘",
    expectedTools: ["compare_care_or_support_options"],
    requiredTerms: ["야간", "비용"]
  },
  {
    prompt: "할아버지가 밤에 배회해서 실종될까 걱정돼요",
    expectedTools: ["build_dementia_care_checklist", "analyze_family_care_situation"],
    requiredTerms: ["112", "119"]
  },
  {
    prompt: "장기요양등급 신청 절차를 가족 단톡방에 보낼 말로 정리해줘",
    expectedTools: ["make_family_share_summary", "explain_long_term_care_path"],
    requiredTerms: ["가족", "장기요양"]
  },
  {
    prompt: "서울 관악구에서 병원 이동 지원을 알아봐줘",
    expectedTools: ["route_support_options", "analyze_family_care_situation"],
    requiredTerms: ["서울", "1588-4388"]
  }
];

function summarize(text: string | null | undefined): string {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 520);
}

function parseArguments(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

function qualityChecks(text: string, requiredTerms: string[] = []): Record<string, boolean> {
  return {
    official: /공식|출처|기관|정부24|장기요양|치매안심센터|시·군·구|주민센터/.test(text),
    caveat: /진단|확정|승인|판단하지|의료진|공식 기관|순위|대신/.test(text),
    nextAction: /문의|확인|준비|정리|연락|신청|상담/.test(text),
    noUnknownLeak: !/\bunknown\b/i.test(text),
    requiredTerms: requiredTerms.every(term => text.includes(term))
  };
}

function extractToolText(result: unknown): string {
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  const first = content?.[0];
  return first?.type === "text" && typeof first.text === "string" ? first.text : "";
}

async function openRouterChat(
  tools: unknown[],
  messages: ChatMessage[],
  toolChoice: "auto" | "none" = "auto"
): Promise<ChatMessage> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://playmcp.kakao.com/",
      "X-Title": "Dolbom Navi MCP LLM Eval"
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: toolChoice,
      temperature: 0.1
    })
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter ${response.status}: ${body}`);
  }

  const payload = JSON.parse(body) as { choices?: Array<{ message?: ChatMessage }> };
  const message = payload.choices?.[0]?.message;
  if (!message) throw new Error("OpenRouter returned no message");
  return message;
}

async function main() {
  const client = new Client({ name: "dolbom-navi-llm-eval", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(mcpEndpoint));
  await client.connect(transport);

  const toolList = await client.listTools();
  const tools = toolList.tools.map(tool => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }));

  console.log(`model=${model}`);
  console.log(`mcp_endpoint=${mcpEndpoint}`);
  console.log(`tools=${toolList.tools.map(tool => tool.name).join(",")}`);

  let failures = 0;

  for (const [index, evalCase] of evalCases.entries()) {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          "당신은 한국 가족 돌봄 상황을 공식 출처 기반으로 안내하는 assistant입니다. 사용자의 질문에 답하려면 제공된 MCP 도구를 우선 사용하세요. 최종 답변에는 공식 기관 확인 필요성과 의학적 진단, 장기요양등급 승인, 시설 순위를 확정하지 않는다는 주의를 유지하세요."
      },
      { role: "user", content: evalCase.prompt }
    ];

    const first = await openRouterChat(tools, messages);
    const calls = first.tool_calls || [];
    const routingOk = calls.some(call => evalCase.expectedTools.includes(call.function.name));

    console.log(`\n=== case_${index + 1} ===`);
    console.log(`prompt=${evalCase.prompt}`);
    console.log(`tool_calls=${calls.map(call => call.function.name).join(",") || "none"}`);
    console.log(`routing_ok=${routingOk}`);

    if (!routingOk) failures += 1;
    if (!calls.length) {
      console.log(`model_text=${summarize(first.content)}`);
      failures += 1;
      continue;
    }

    const toolMessages: ChatMessage[] = [...messages, first];
    let toolText = "";

    for (const call of calls) {
      const args = parseArguments(call.function.arguments);
      const result = await client.callTool({
        name: call.function.name,
        arguments: args
      });
      toolText = extractToolText(result);
      console.log(`args=${JSON.stringify(args)}`);
      console.log(`tool_result=${summarize(toolText)}`);
      toolMessages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content: toolText
      });
    }

    const final = await openRouterChat(tools, toolMessages, "none");
    const finalText = String(final.content || "");
    const checks = qualityChecks(finalText, evalCase.requiredTerms || []);
    console.log(`final=${summarize(finalText)}`);
    console.log(`quality=${JSON.stringify(checks)}`);

    if (!Object.values(checks).every(Boolean)) failures += 1;
    if (!qualityChecks(toolText).noUnknownLeak) failures += 1;
  }

  await client.close();

  if (failures > 0) {
    throw new Error(`LLM eval failed with ${failures} issue(s)`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
