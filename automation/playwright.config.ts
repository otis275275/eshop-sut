import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const STUDENT_ID = process.env.STUDENT_ID || '23120228';
const RUN_TIMESTAMP = new Date().toISOString();

function findBrowserExecutable(prefix: string, relativeExePath: string): string | undefined {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return undefined;
  const msPlaywrightDir = path.join(localAppData, 'ms-playwright');
  if (!fs.existsSync(msPlaywrightDir)) return undefined;

  const dirs = fs
    .readdirSync(msPlaywrightDir)
    .filter((d) => d.startsWith(prefix))
    .sort()
    .reverse();

  for (const dir of dirs) {
    const candidate = path.join(msPlaywrightDir, dir, relativeExePath);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

const chromiumExe = findBrowserExecutable('chromium-', path.join('chrome-win64', 'chrome.exe'));
const webkitExe = findBrowserExecutable('webkit-', 'Playwright.exe');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../report/playwright-report', open: 'never' }],
  ],
  metadata: {
    runBy: `Run by: ${STUDENT_ID}`,
    timestamp: RUN_TIMESTAMP,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: [
    {
      command: 'node server.js',
      cwd: '../backend',
      url: 'http://localhost:3000/api/products',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm.cmd run dev',
      cwd: '../frontend-web',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: 'npm.cmd run dev',
      cwd: '../frontend-admin',
      url: 'http://localhost:5174',
      reuseExistingServer: true,
      timeout: 30000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExe ? { launchOptions: { executablePath: chromiumExe } } : {}),
      },
    },
    {
      name: 'msedge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        ...(webkitExe ? { launchOptions: { executablePath: webkitExe } } : {}),
      },
    },
  ],
});
