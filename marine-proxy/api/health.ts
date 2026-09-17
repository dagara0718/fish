import type { IncomingMessage, ServerResponse } from 'node:http'
import { respond } from './_adapter.js'

export const config = { runtime: 'nodejs' }

export default function handler(req: IncomingMessage, res: ServerResponse): Promise<void> { return respond(req, res) }
