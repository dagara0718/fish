import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/fish/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/testing/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'worker/**', 'marine-proxy/**'],
    css: true,
    coverage: { reporter: ['text', 'html'] },
  },
})
