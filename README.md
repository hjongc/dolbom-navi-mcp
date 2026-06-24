# Dolbom Navi MCP

`Dolbom Navi(돌봄내비)` is a PlayMCP-compatible remote MCP server for Korean family senior-support navigation.

It helps families route elderly-care questions across welfare, medical support, mobility, long-term care, dementia support, facilities, and local administration using official-source guidance.

## PlayMCP Fit

- Streamable HTTP transport: `POST /mcp`
- Stateless server
- Tool count: 6
- No `kakao` string in server or tool names
- Official-source registry exposed as a resource
- Dockerfile included for PlayMCP in KC Git source build

## Run Locally

```bash
npm install
npm run build
npm start
```

Health check:

```bash
curl http://127.0.0.1:3000/healthz
```

MCP endpoint:

```text
http://127.0.0.1:3000/mcp
```

## Smoke Test

Start the server in one terminal:

```bash
npm start
```

Run the Streamable HTTP smoke test in another terminal:

```bash
npm run smoke
```

## Inspector

```bash
npm run inspect
```

## Deploy With PlayMCP In KC

Use the Git source build path:

- Git URL: this repository URL after pushing
- Branch/ref: `main`
- Dockerfile path: `Dockerfile`
- PAT: empty if the repository is public

After PlayMCP in KC returns an Endpoint URL, register it in the PlayMCP developer console and test as a temporary registration before requesting review.

## Official Source Categories

The server uses curated official/public-agency source records:

- 국민건강보험공단 노인장기요양보험
- 정부24
- 복지로
- 보건복지부
- 중앙치매센터
- 중앙치매센터 치매상담콜센터
- 거주지 시·군·구청 공식 누리집
- 119

The server does not diagnose dementia, determine long-term care grade eligibility, guarantee benefits, rank facilities from unverified reviews, or collect resident registration numbers, exact addresses, phone numbers, payment details, or medical records.
