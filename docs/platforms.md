# YouTube, TikTok, Instagram, and Twitch video MCP tools

Use a source-specific example with Reclip's hosted MCP endpoint at `https://www.reclip.io/api/mcp`. The ten combinations below use six existing product tools. Reclip still exposes 30 product tools and 28 public resource operations through MCP.

| Source     | API guide                                                                           | MCP product tool            | Example slug                 |
| ---------- | ----------------------------------------------------------------------------------- | --------------------------- | ---------------------------- |
| YouTube    | [Video Downloader](https://www.reclip.io/docs/platforms/youtube-video-downloader)   | `reclip_video_downloader`   | `youtube-video-downloader`   |
| TikTok     | [Video Downloader](https://www.reclip.io/docs/platforms/tiktok-video-downloader)    | `reclip_video_downloader`   | `tiktok-video-downloader`    |
| Instagram  | [Video Downloader](https://www.reclip.io/docs/platforms/instagram-video-downloader) | `reclip_video_downloader`   | `instagram-video-downloader` |
| YouTube    | [Transcript](https://www.reclip.io/docs/tools/youtube-transcript)                   | `reclip_youtube_transcript` | `youtube-transcript`         |
| TikTok     | [Transcript](https://www.reclip.io/docs/tools/tiktok-transcript)                    | `reclip_tiktok_transcript`  | `tiktok-transcript`          |
| YouTube    | [Video Clipping](https://www.reclip.io/docs/platforms/youtube-ai-clipper)           | `reclip_ai_clipper`         | `youtube-ai-clipper`         |
| Twitch VOD | [Video Clipping](https://www.reclip.io/docs/platforms/twitch-vod-clipper)           | `reclip_ai_clipper`         | `twitch-vod-clipper`         |
| YouTube    | [AI B-Roll](https://www.reclip.io/docs/platforms/youtube-ai-broll)                  | `reclip_ai_broll`           | `youtube-ai-broll`           |
| Twitch VOD | [AI B-Roll](https://www.reclip.io/docs/platforms/twitch-vod-ai-broll)               | `reclip_ai_broll`           | `twitch-vod-ai-broll`        |
| YouTube    | [Video Captions](https://www.reclip.io/docs/platforms/youtube-ai-captions)          | `reclip_ai_captions`        | `youtube-ai-captions`        |

The matching [public platform directory](https://www.reclip.io/platforms) and [API documentation overview](https://www.reclip.io/docs/guides/platforms) explain each source's capabilities. Each slug also identifies a public landing page at `https://www.reclip.io/api/tools/<slug>`.

## Prepare an exact platform request

Inspect the connected server with `tools/list` before choosing input fields. Print an illustrative set of calls without connecting or spending credits:

```bash
node examples/platforms.mjs youtube-video-downloader > youtube-mcp-calls.json
```

The output contains three independent JSON-RPC messages under `quote`, `submit`, and `poll`. Send the selected messages in order through a configured MCP client; the output is not an MCP batch request. Keep your workspace API key in the client's private environment or secret store and configure the connection as described in the [README](../README.md).

1. Replace the example `source_url` with an accessible source you own or are authorized to process. Downloader requests also require the matching `platform` value. Clipping, B-roll, captions, and transcript requests do not have a separate `platform` field.
2. Inspect the live schema and adjust supported options and the illustrative `maximum_credits: 100` cap to the user's approved budget. YouTube captions also requires the source duration. Quote the same source and settings that you intend to submit.
3. Call `reclip_quote_job` with the complete REST-shaped request under `arguments.body`:

   ```json
   {
     "name": "reclip_quote_job",
     "arguments": {
       "body": {
         "tool": "youtube_transcript",
         "input": {
           "source_url": "https://www.youtube.com/watch?v=VIDEO_ID_01",
           "include_timestamps": true
         },
         "maximum_credits": 100
       }
     }
   }
   ```

4. Check the quote and the user's budget. Call the existing product tool with `input`, `maximum_credits`, and a unique `idempotency_key` under `arguments`. These product calls do not wrap the input in `body` or require a `tool` property:

   ```json
   {
     "name": "reclip_youtube_transcript",
     "arguments": {
       "input": {
         "source_url": "https://www.youtube.com/watch?v=VIDEO_ID_01",
         "include_timestamps": true
       },
       "maximum_credits": 100,
       "idempotency_key": "REPLACE_WITH_UNIQUE_REQUEST_ID"
     }
   }
   ```

5. Replace the illustrative UUID in `poll.params.arguments.id` with the job ID returned by submission, then call `reclip_get_job`. Continue polling that same job with backoff until `succeeded`, `failed`, or `canceled`. A queued response only confirms admission. Read both `result` and `outputs` for transcript data and output assets. Reuse the same idempotency key for a retry of the same submission; choose a fresh key for a different job.

## Source requirements and outputs

- **YouTube downloader:** accessible supported video and Shorts URLs, with `platform: "youtube"`. Available formats, source restrictions, and the requested download size cap affect admission and processing.
- **TikTok downloader:** supported individual video URLs, with `platform: "tiktok"`. It does not crawl profiles or promise watermark-free output.
- **Instagram downloader:** supported video and Reel URLs, with `platform: "instagram"`. Source access restrictions can prevent a download.
- **YouTube and TikTok transcripts:** retrieve existing caption tracks, with optional timestamps. Missing captions do not trigger speech recognition. For speech-to-text, import an authorized video and submit its compatible workspace asset to `reclip_transcription` in a separate quoted job.
- **YouTube clipping and B-roll:** accept supported YouTube source URLs. The examples specify a source analysis or editing range; adjust it to the source's actual duration.
- **Twitch clipping and B-roll:** accept recorded VOD URLs such as `https://www.twitch.tv/videos/1234567890`, with a numeric `/videos/` ID. Live channel pages, Twitch clip URLs, and general Twitch downloading are outside these direct-source contracts.
- **YouTube captions:** creates a video asset with rendered styled captions. It is distinct from retrieving an existing transcript and does not update captions on a YouTube channel.

Compatible downloaded assets can be used by additional editing tools in separately quoted jobs. An output intended for Shorts, Reels, or TikTok does not imply direct input support for every one of those platforms or automatic publishing.

## Example prompts

> Quote downloading this YouTube video with Reclip: [YouTube URL]. Inspect `reclip_video_downloader`, use platform `youtube`, and show the estimate and download size cap. After I approve the credit budget, submit the job and return its completed video asset.

> Use Reclip to create highlights from this recorded Twitch VOD: [Twitch VOD URL]. Inspect `reclip_ai_clipper` and quote my selected range before submitting. After approval, create the clips, poll the same job, and list the output files.

> Retrieve the existing timestamped captions for this TikTok video: [TikTok URL]. Inspect `reclip_tiktok_transcript`, show the quote, and submit only within my approved credit budget. If the source has no caption track, report that result.

All new platform guidance is public beta. Offline validation checks the pinned request contracts and message shapes; it does not certify that a particular third-party video remains accessible.
