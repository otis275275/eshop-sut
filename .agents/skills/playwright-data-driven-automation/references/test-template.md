# Standard Data-Driven Playwright Template

## 1. External Data File (`automation/data/<feature>.json`)

```json
{
  "feature": "FR-XX: Feature Name",
  "baseUrl": "http://localhost:5173",
  "apiUrl": "http://localhost:3000",
  "cases": [
    {
      "id": "TC-FRXX-01",
      "title": "Descriptive test case title",
      "type": "positive",
      "input": {},
      "expectedStatus": 200,
      "expectedText": "Success"
    }
  ]
}
```

## 2. Playwright Test Spec (`automation/tests/<feature>.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, '../data/<feature>.json');
const testData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

test.describe(testData.feature, () => {
  for (const tc of testData.cases) {
    test(`${tc.id}: ${tc.title}`, async ({ page }) => {
      await page.goto('/');
      // Perform user actions using resilient locators (getByRole, getByPlaceholder, etc.)
      // Verify with >= 3 assertion patterns (toHaveURL, toBeVisible, toHaveText, toHaveAttribute, etc.)
    });
  }
});
```
