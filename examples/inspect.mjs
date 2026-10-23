const endpoint = new URL(process.env.RECLIP_MCP_URL ?? 'https://www.reclip.io/api/mcp');
if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname))) throw new Error('Use HTTPS or a loopback development server.');
if (endpoint.username || endpoint.password || endpoint.hash || endpoint.search || endpoint.pathname !== '/api/mcp') throw new Error('Use an origin followed by /api/mcp.');
const key = process.env.RECLIP_API_KEY;
if (!key || /\s/u.test(key)) throw new Error('Configure RECLIP_API_KEY in the environment.');
let id = 0;
async function call(method, params) {
  const response = await fetch(endpoint,{method: 'POST',redirect: 'error',headers: {Authorization: `Bearer ${key}`,'Content-Type': 'application/json',Accept: 'application/json, text/event-stream','MCP-Protocol-Version': '2025-11-25'},body: JSON.stringify({jsonrpc: '2.0',id: ++id,method,...(params ? {params} : {})}),signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error(`MCP request failed: HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(`MCP error ${data.error.code}`);
  return data.result;
}
await call('initialize',{protocolVersion: '2025-11-25',capabilities: {},clientInfo: {name: 'reclip-inspect',version: '1.1.0'}});
const result = await call('tools/list');
console.log(JSON.stringify(result,null,2));
