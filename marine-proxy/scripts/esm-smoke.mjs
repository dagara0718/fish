// Regression guard for VERCEL_ESM_MODULE_RESOLUTION (v1.6.2): Vitest's own module resolution is
// more lenient than Vercel's real Node.js ESM runtime and silently tolerated the extensionless
// relative imports that broke in production (ERR_MODULE_NOT_FOUND). This script compiles the actual
// entrypoints with the TypeScript compiler API (no bundling — the same non-bundled shape Vercel's
// Node.js Functions ship) and then imports the compiled output through Node's real ESM loader, so an
// extensionless or out-of-root-directory import specifier fails here exactly as it would in
// production, instead of only surfacing after a live deploy.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = mkdtempSync(path.join(tmpdir(), 'marine-proxy-smoke-'))
const entrypoints = ['api/health.ts', 'api/marine-current.ts']
const files = [...entrypoints, 'api/_adapter.ts', 'src/index.ts', 'shared/marine-response.ts'].map(f => path.join(root, f))

const program = ts.createProgram(files, {
  module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022, outDir, rootDir: root, types: ['node'],
})
// Type errors (e.g. this minimal invocation not matching the full tsconfig used by `npm run
// typecheck`) are not this script's concern — only whether the emitted JS's import specifiers
// resolve under Node's real ESM loader, checked below. Emit still happens even when diagnostics
// exist, since `noEmitOnError` is not set.
program.emit()
writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ type: 'module' }))

let failed = false
for (const entry of entrypoints) {
  const jsPath = path.join(outDir, entry.replace(/\.ts$/, '.js'))
  try {
    await import(pathToFileURL(jsPath).href)
    console.log(`${entry}: OK`)
  } catch (error) {
    failed = true
    console.error(`${entry}: FAIL`, error.message)
  }
}
rmSync(outDir, { recursive: true, force: true })
if (failed) process.exit(1)
