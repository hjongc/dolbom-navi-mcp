# PlayMCP In KC Setup

## Current Decision

Use the Git source build path first.

Reason:

- It is the shortest path once this repository has a working MCP server and Dockerfile.
- PlayMCP in KC can build directly from a Git URL.
- It avoids a separate container registry setup for the first submission.

Use the container image path only if Git source build fails or if image-level control becomes necessary.

## Official Flow

1. Build and test the MCP server locally.
2. Add a Dockerfile at the repository root, or provide the Dockerfile path during registration.
3. Push the source to a Git repository.
4. Open PlayMCP in KC: <https://playmcp.kakaocloud.io/>
5. Log in with the same Kakao account used for PlayMCP.
6. Click `+ 새 MCP 서버 등록`.
7. Choose `Git 소스 빌드`.
8. Enter server metadata and Git build settings.
9. Wait until status changes from `Starting` to `Active`.
10. Open the server detail page and copy the `Endpoint URL`.
11. Register that Endpoint URL in the PlayMCP developer console.
12. Save as temporary registration first and test in PlayMCP.
13. After testing, request review.
14. After approval, change visibility from `나에게만 공개` to `전체 공개`.
15. Submit through the AGENTIC PLAYER 10 preliminary participation form.

## Official Constraints From The Guide

- PlayMCP in KC is the Kakao Cloud-provided MCP server deployment service for this contest.
- MCP server issuance through PlayMCP in KC is available only during the preliminary submission period: June 15, 2026 to July 14, 2026.
- The Endpoint URL issued by PlayMCP in KC must be used to register the MCP in PlayMCP for contest participation.
- The free PlayMCP in KC server support is temporary. After the contest, Kakao may end free support after a separately announced maintenance period.
- Servers may be reclaimed if they are used for purposes other than contest participation or if they are not submitted to the preliminary round.
- Only PlayMCP members can use PlayMCP in KC.
- Each account can register up to 2 MCP servers.
- Kakao does not provide individual support for general MCP development issues beyond PlayMCP in KC service errors.
- Contest or PlayMCP in KC usage questions should go through Kakao Customer Center.

## Git Source Build Inputs

Use these values for the first PlayMCP in KC registration attempt.

| Field | Value |
| --- | --- |
| MCP server name | dolbom-navi |
| Description | 부모님·조부모님 돌봄 상황에서 필요한 복지·의료·교통 등 공공 지원 정보를 공식 출처 기반으로 쉽게 찾아보고, 다음 행동까지 정리해주는 MCP입니다. |
| Git URL | https://github.com/hjongc/dolbom-navi-mcp |
| Branch / ref | main |
| Dockerfile path | Dockerfile |
| PAT | Empty if the repository is public |

After the Endpoint URL is issued, set `MCP_ALLOWED_HOSTS` to the issued endpoint hostname if PlayMCP in KC exposes environment-variable configuration. Include only hostnames, separated by commas, without `https://` or path. Keep `127.0.0.1,localhost` for local verification.

Repository status: public GitHub repository created and pushed.

## Container Image Inputs

Use only if choosing image registration.

| Field | Value |
| --- | --- |
| MCP server name | dolbom-navi |
| Description | Family senior-support navigation MCP for welfare, care, medical, mobility, facility, and local-service guidance. |
| Registry host | ghcr.io or docker.io |
| Registry user | Required only for private registry |
| Registry password | Required only for private registry |
| image_name | TBD |
| image_tag | latest or a fixed version tag |

Important: the image must be built for `linux/amd64`.

For Apple Silicon:

```bash
docker build --platform linux/amd64 -t <image>:<tag> .
```

## Blocking Items

- PlayMCP in KC Endpoint issuance is no longer blocked.
  - Server ID: `618`
  - Status: `Active`
  - Endpoint: `https://dolbom-navi.playmcp-endpoint.kakaocloud.io/mcp`
- MCP Inspector CLI and remote MCP checks passed. Browser UI review can still be used as a final manual sanity check before PlayMCP review.

## Next Work

1. Register the issued Endpoint URL in the PlayMCP developer console.
2. Save it as a temporary/private registration first.
3. Run PlayMCP temporary-registration tests and, optionally, Inspector browser UI.
4. Request final PlayMCP review.
5. After approval, change visibility from `나에게만 공개` to `전체 공개`.
6. Submit through the AGENTIC PLAYER 10 preliminary participation form.

## PlayMCP Server Development Requirements

- Use Streamable HTTP transport. Local STDIO-only MCP servers are not enough for PlayMCP.
- Remote MCP endpoint must be publicly reachable.
- The server should be stateless if possible.
- MCP version support must fall within `2025-03-26` to `2025-11-25`.
- Validate with MCP Inspector before registration.
- Use an actively maintained MCP SDK.
- Do not use `kakao` in the MCP server name or tool names.
- Keep tool count between 3 and 10 for this submission.
- Include required tool metadata and annotations.
- Keep responses compact and cleaned for user-facing LLM use.
- Avoid advertising behavior in tool outputs.

## Review Timing

The contest guide says server review usually takes 1-2 business days and can take up to 7 business days. The contest page separately warns that review requests by July 7, 2026 are expected to complete by July 10, while later requests may be hard to finish before the July 14 preliminary deadline.
