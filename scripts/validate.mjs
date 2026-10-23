import {readFileSync} from 'node:fs';
const read = path => JSON.parse(readFileSync(new URL(`../references/${path}`,import.meta.url),'utf8'));
const catalog = read('tool-catalog.json');
const mcp = read('mcp-tools.json');
const ops = read('operations.json');
if ([mcp,ops].some(s => JSON.stringify(s.source) !== JSON.stringify(catalog.source))) throw new Error('Mixed contract snapshots.');
for (const tool of catalog.source.tool_codes) {
  if (!catalog.tools.some(t => t.id === tool)) throw new Error(`Missing API tool ${tool}`);
  const entry = mcp.tools.find(t => t.name === `reclip_${tool}`);
  if (!entry?.inputSchema.required.includes('maximum_credits') || !entry?.inputSchema.required.includes('idempotency_key')) throw new Error(`Missing bounded MCP submission ${tool}`);
}
for (const op of ops.operations) if (!mcp.tools.some(t => t.name === `reclip_${op.operation_id}`)) throw new Error(`Missing resource operation ${op.operation_id}`);
if (new Set(mcp.tools.map(t => t.name)).size !== mcp.tools.length) throw new Error('Duplicate MCP tool name.');
console.log(`Validated ${catalog.tools.length} product tools and ${ops.operations.length} MCP resource operations.`);
