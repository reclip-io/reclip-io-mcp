import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

import { platformCalls, platformExamples } from "../examples/platforms.mjs";

const snapshot = JSON.parse(
  readFileSync(
    new URL("../references/mcp-tools.json", import.meta.url),
    "utf8",
  ),
);
const fixture = JSON.parse(
  readFileSync(new URL("../examples/platforms.json", import.meta.url), "utf8"),
);
const expected = {
  "youtube:video_downloader": "youtube-video-downloader",
  "tiktok:video_downloader": "tiktok-video-downloader",
  "instagram:video_downloader": "instagram-video-downloader",
  "youtube:youtube_transcript": "youtube-transcript",
  "tiktok:tiktok_transcript": "tiktok-transcript",
  "youtube:ai_clipper": "youtube-ai-clipper",
  "twitch:ai_clipper": "twitch-vod-clipper",
  "youtube:ai_broll": "youtube-ai-broll",
  "twitch:ai_broll": "twitch-vod-ai-broll",
  "youtube:ai_captions": "youtube-ai-captions",
};

test("covers exactly the ten supported platform/tool pairs under the pinned contract", () => {
  assert.equal(fixture.contract_sha256, snapshot.source.contract_sha256);
  assert.equal(platformExamples.length, 10);
  assert.deepEqual(
    Object.fromEntries(
      platformExamples.map((entry) => [
        `${entry.platform}:${entry.request.tool}`,
        entry.slug,
      ]),
    ),
    expected,
  );
});

for (const example of platformExamples) {
  test(`${example.slug} maps the same input to the existing quote, product, and polling tools`, () => {
    const calls = platformCalls(example.slug);
    assert.deepEqual(calls.quote.params.arguments, { body: example.request });
    assert.equal(calls.submit.params.name, `reclip_${example.request.tool}`);
    assert.deepEqual(
      calls.submit.params.arguments.input,
      example.request.input,
    );
    assert.equal(
      calls.submit.params.arguments.maximum_credits,
      example.request.maximum_credits,
    );
    assert.equal(
      calls.submit.params.arguments.idempotency_key,
      "REPLACE_WITH_UNIQUE_REQUEST_ID",
    );
    assert.equal(Object.hasOwn(calls.submit.params.arguments, "body"), false);
    assert.equal(Object.hasOwn(calls.submit.params.arguments, "tool"), false);
    assert.equal(Object.hasOwn(example.request.input, "asset_id"), false);
    for (const call of Object.values(calls)) {
      assert.equal(call.method, "tools/call");
      const binding = snapshot.tools.find(
        (tool) => tool.name === call.params.name,
      );
      assert.ok(binding, call.params.name);
      for (const key of binding.inputSchema.required ?? [])
        assert.ok(
          Object.hasOwn(call.params.arguments, key),
          `${call.params.name}.${key}`,
        );
      for (const key of Object.keys(call.params.arguments))
        assert.ok(
          Object.hasOwn(binding.inputSchema.properties, key),
          `${call.params.name}.${key}`,
        );
    }
    const source = new URL(example.request.input.source_url);
    assert.equal(source.protocol, "https:");
    if (example.platform === "youtube")
      assert.ok(
        ["www.youtube.com", "youtube.com", "youtu.be"].includes(
          source.hostname,
        ),
      );
    if (example.platform === "tiktok")
      assert.equal(source.hostname, "www.tiktok.com");
    if (example.platform === "instagram")
      assert.equal(source.hostname, "www.instagram.com");
    if (example.platform === "twitch") {
      assert.equal(source.hostname, "www.twitch.tv");
      assert.match(source.pathname, /^\/videos\/\d+$/);
    }
    if (example.request.tool === "video_downloader")
      assert.equal(example.request.input.platform, example.platform);
    else assert.equal(Object.hasOwn(example.request.input, "platform"), false);
    assert.ok(example.landing_url.endsWith(`/api/tools/${example.slug}`));
    assert.ok(example.docs_url.includes(`/docs/`));
  });
}

test("rejects unsupported platform templates and protects later calls from mutated output", () => {
  for (const slug of [
    "twitch-video-downloader",
    "instagram-transcript",
    "tiktok-ai-clipper",
  ])
    assert.throws(
      () => platformCalls(slug),
      /Unsupported platform API example/,
    );
  const calls = platformCalls("youtube-video-downloader");
  calls.submit.params.arguments.input.platform = "instagram";
  assert.equal(
    platformCalls("youtube-video-downloader").submit.params.arguments.input
      .platform,
    "youtube",
  );
});

test("the CLI lists and prints templates offline and fails for unsupported pairs", () => {
  const cli = new URL("../examples/platforms.mjs", import.meta.url);
  const run = (argument) =>
    spawnSync(process.execPath, [cli.pathname, argument], {
      encoding: "utf8",
      env: { PATH: process.env.PATH },
    });
  const list = run("--list");
  assert.equal(list.status, 0);
  assert.equal(list.stdout.trim().split("\n").length, 10);
  const printed = run("youtube-video-downloader");
  assert.equal(printed.status, 0);
  assert.equal(
    JSON.parse(printed.stdout).submit.params.name,
    "reclip_video_downloader",
  );
  assert.equal(run("twitch-video-downloader").status, 1);
});
