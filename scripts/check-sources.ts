import { MOBILITY_CONTACTS, SOURCES } from "../src/sources.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

type UrlCheckResult = {
  label: string;
  url: string;
  ok: boolean;
  status?: number;
  method?: "HEAD" | "GET";
  error?: string;
};

const timeoutMs = Number(process.env.SOURCE_CHECK_TIMEOUT_MS || 8000);
const execFileAsync = promisify(execFile);
const allowedHttpUrls = new Set([
  "http://brmcall.co.kr/info06",
  "http://www.15664488.co.kr/main"
]);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function uniqueRecords() {
  const records = [
    ...SOURCES.map(source => ({
      label: `source:${source.id}:${source.sourceName}`,
      url: source.url,
      reviewedAt: source.reviewedAt
    })),
    ...MOBILITY_CONTACTS.map(contact => ({
      label: `mobility:${contact.id}:${contact.centerName}`,
      url: contact.url,
      reviewedAt: contact.reviewedAt
    }))
  ];

  const seen = new Set<string>();
  return records.filter(record => {
    if (seen.has(record.url)) return false;
    seen.add(record.url);
    return true;
  });
}

async function fetchWithTimeout(url: string, method: "HEAD" | "GET") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": "DolbomNaviSourceCheck/0.1"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkUrl(label: string, url: string): Promise<UrlCheckResult> {
  try {
    const head = await fetchWithTimeout(url, "HEAD");
    if (head.ok || (head.status >= 300 && head.status < 400)) {
      return { label, url, ok: true, status: head.status, method: "HEAD" };
    }

    const get = await fetchWithTimeout(url, "GET");
    return {
      label,
      url,
      ok: get.ok || (get.status >= 300 && get.status < 400),
      status: get.status,
      method: "GET"
    };
  } catch (error) {
    const fallback = await checkUrlWithCurl(label, url);
    if (fallback.ok) return fallback;

    return {
      label,
      url,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkUrlWithCurl(label: string, url: string): Promise<UrlCheckResult> {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-L",
      "--max-time",
      String(Math.ceil(timeoutMs / 1000)),
      "-s",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      url
    ]);
    const status = Number(stdout.trim());
    return {
      label,
      url,
      ok: status >= 200 && status < 400,
      status,
      method: "GET"
    };
  } catch (error) {
    return {
      label,
      url,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  const records = uniqueRecords();
  assert(records.length >= SOURCES.length, "Source URL registry unexpectedly lost records");

  for (const source of SOURCES) {
    assert(source.reviewedAt === "2026-06-24", `source ${source.id} has unexpected reviewedAt ${source.reviewedAt}`);
    assert(source.url.startsWith("https://"), `source ${source.id} must use https`);
  }

  for (const contact of MOBILITY_CONTACTS) {
    assert(contact.reviewedAt === "2026-06-24", `mobility contact ${contact.id} has unexpected reviewedAt ${contact.reviewedAt}`);
    assert(contact.phoneNumbers.length > 0, `mobility contact ${contact.id} must include at least one phone number`);
    assert(
      contact.url.startsWith("https://") || allowedHttpUrls.has(contact.url),
      `mobility contact ${contact.id} has non-https URL that is not explicitly allowed`
    );
  }

  const results = await Promise.all(records.map(record => checkUrl(record.label, record.url)));
  for (const result of results) {
    const status = result.status ? ` status=${result.status}` : "";
    const method = result.method ? ` method=${result.method}` : "";
    const error = result.error ? ` error=${result.error}` : "";
    console.log(`${result.ok ? "ok" : "fail"} ${result.label} ${result.url}${method}${status}${error}`);
  }

  const failures = results.filter(result => !result.ok);
  if (failures.length > 0) {
    throw new Error(`Official source URL check failed for ${failures.length} URL(s)`);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
