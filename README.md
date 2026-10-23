# Reclip MCP

Reclip's hosted Streamable HTTP MCP endpoint is `https://www.reclip.io/api/mcp`. It exposes every product tool plus all public API resource operations, using the same workspace API key, scopes, credits, ownership and admission rules as REST. API access supports eligible API-only promotional credits, purchased credits, or a paid plan. The backend deployment must enable `PUBLIC_API_ENABLED` and apply the catalog migration.

The server supports protocol versions `2025-11-25` and `2025-06-18`. It is stateless and returns JSON responses; GET and DELETE return 405. POST requires `Content-Type: application/json` and `Accept: application/json, text/event-stream`. Browser Origin headers must match the endpoint origin. Authentication uses `Authorization: Bearer RECLIP_API_KEY`; configure the actual secret in the client's private environment or secret store.

Run `node examples/inspect.mjs` with `RECLIP_API_KEY` configured to initialize and list tools. `RECLIP_MCP_URL` can select another enabled deployment. This example is read-only.

## Video platform examples

The [platform API guide](docs/platforms.md) covers all **10 supported platform/tool combinations**: YouTube, TikTok, and Instagram video downloading; YouTube and TikTok transcripts; YouTube and recorded Twitch VOD clipping and B-roll; and YouTube video captions. These use existing tool names from the 30-product-tool catalog.

Print matching JSON-RPC tool-call templates locally:

```bash
node examples/platforms.mjs --list
node examples/platforms.mjs youtube-video-downloader
node examples/platforms.mjs twitch-vod-clipper
```

This command only prints quote, submission, and polling messages; it requires no key and makes no network requests. Replace example URLs, credit caps, idempotency keys, and the returned job ID before using them with a connected MCP client. The [JSON fixtures](examples/platforms.json) match the platform landing-page and documentation requests.

B-Roll quotes and regeneration reuse the existing approved tariff shared with the browser and REST API. MCP access does not introduce a separate pricing approval. Clip discovery uses the server's existing Typesafe credential; MCP clients only need their Reclip workspace key.

Product submissions are named `reclip_TOOL`, such as `reclip_ai_video_editor` and `reclip_gemini_watermark_bulk_remover`. Each requires a stable `idempotency_key` and an explicit `maximum_credits`, including zero for Gemini. Discover `inputSchema` before constructing a request. Resource tools use their OpenAPI operation names prefixed with `reclip_`; they accept path fields such as `id` and JSON input under `body`.

Call `reclip_quote_job` with the complete job request under `body`, then submit within the user's authorized budget. Poll with `reclip_get_job`. Inspect both `result` and `outputs`; a queued response is admission, and image review outcomes do not claim watermark removal. Use signed upload URLs with an HTTP client, confirm the uploaded asset, and pass owned asset IDs between tools.

The generated [catalog](references/mcp-tools.json), [tool contracts](references/tool-catalog.json), and [API operations](references/operations.json) contain the source revisions and contract hash. The backend exporter refreshes all companion repositories together. Run `node scripts/validate.mjs` for offline coverage checks. This repository contains client metadata and examples; the server implementation lives in `reclip-io/apps/web/src/lib/public-api/mcp.server.ts`.
