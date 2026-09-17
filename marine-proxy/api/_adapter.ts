import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleRequest, type Env } from '../src/index.js'

// Vercel's Node.js Serverless Functions use the classic (req, res) signature; the proxy's own logic
// is written against the standard Fetch API Request/Response (shared shape with the Cloudflare
// Worker's handleRequest) so the two server-side paths stay easy to compare — this file is the only
// place that bridges Node's request/response objects to that shape.
function toWebRequest(req: IncomingMessage): Request {
  const host = req.headers.host ?? 'localhost'
  const url = new URL(req.url ?? '/', `https://${host}`)
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
    else if (Array.isArray(value)) headers.set(key, value.join(', '))
  }
  return new Request(url, { method: req.method, headers })
}

export async function respond(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const env: Env = { KHOA_MARINE_SERVICE_KEY: process.env.KHOA_MARINE_SERVICE_KEY }
  const response = await handleRequest(toWebRequest(req), env)
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(await response.text())
}
