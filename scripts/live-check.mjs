import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
const scanOnly = process.argv.includes('--scan-only')
let failed = false
function report(label, ok) { console.log(`${label.padEnd(26)} ${ok ? 'OK' : 'REQUIRED / FAILED'}`); if (!ok) failed = true }
function files(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(resolve(dir, entry.name)) : [resolve(dir, entry.name)]) }
const outputs = existsSync('dist') ? files('dist') : []
const prohibited = /KHOA_FISHING_SERVICE_KEY|VITE_(?:KHOA_)?FISHING_SERVICE_KEY|(?:clientSecret|client_secret)\s*[:=]|serviceKey=/i
report('Frontend secret scan', outputs.length > 0 && outputs.every(file => !prohibited.test(readFileSync(file, 'utf8'))))
if (!scanOnly) {
  let local = {}
  if (existsSync('.env.local')) local = Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => { const at = line.indexOf('='); return [line.slice(0, at), line.slice(at + 1).trim()] }))
  report('NAVER Map config', Boolean(process.env.VITE_NAVER_MAP_NCP_KEY_ID || local.VITE_NAVER_MAP_NCP_KEY_ID))
  const base = process.env.VITE_FISHING_API_BASE_URL || local.VITE_FISHING_API_BASE_URL
  report('Fishing proxy URL', Boolean(base))
  try { const response = await fetch(new URL('/health', base), { headers: { Origin: 'https://dagara0718.github.io' }, signal: AbortSignal.timeout(10000) }); report('Fishing proxy health', response.ok && (await response.json()).ready === true) }
  catch { report('Fishing proxy health', false) }
}
process.exitCode = failed ? 1 : 0
