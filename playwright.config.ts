import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173/fish/', reuseExistingServer: false, env: { VITE_NAVER_MAP_NCP_KEY_ID: 'public-e2e-mock-id', VITE_FISHING_API_BASE_URL: 'https://proxy.example', VITE_MARINE_API_BASE_URL: 'https://marine.example' } },
  use: { baseURL: 'http://127.0.0.1:5173/fish/', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], reducedMotion: 'reduce' } },
  ],
})
