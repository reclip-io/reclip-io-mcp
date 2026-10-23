import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const platformExamples = JSON.parse(
  readFileSync(new URL("./platforms.json", import.meta.url), "utf8"),
).examples;

/** Print-only templates: this module never connects to an endpoint or submits a job. */
export function platformCalls(slug) {
  const example = platformExamples.find((entry) => entry.slug === slug);
  if (!example) throw new Error(`Unsupported platform API example: ${slug}`);
  const request = structuredClone(example.request);
  return {
    quote: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "reclip_quote_job", arguments: { body: request } },
    },
    submit: {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: `reclip_${request.tool}`,
        arguments: {
          input: structuredClone(request.input),
          maximum_credits: request.maximum_credits,
          idempotency_key: "REPLACE_WITH_UNIQUE_REQUEST_ID",
        },
      },
    },
    poll: {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "reclip_get_job",
        arguments: { id: "11111111-1111-4111-8111-111111111111" },
      },
    },
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const slug = process.argv[2];
  if (slug === "--list") {
    console.log(platformExamples.map((entry) => entry.slug).join("\n"));
  } else if (!slug || slug === "--help") {
    console.log(
      "Usage: node examples/platforms.mjs --list | <platform-api-slug>",
    );
    console.log(
      "Prints illustrative MCP quote, submit, and poll messages without making requests.",
    );
  } else {
    try {
      console.log(JSON.stringify(platformCalls(slug), null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
