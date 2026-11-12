import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { parseDailyRates } from '../src/rates/parse.ts'

// The real file CNB served on 12 Nov 2026, parsed as the Worker would.
// Serving it instead of the live CNB data keeps the test deterministic.
// https://playwright.dev/docs/mock#mock-api-requests
const daily = readFileSync(
  new URL('../src/rates/__fixtures__/daily-2026-11-12.txt', import.meta.url),
  'utf8',
)

test('lists the CNB rates and converts CZK as the user types', async ({
  page,
}) => {
  await page.route('**/api/rates', (route) =>
    route.fulfill({ json: parseDailyRates(daily) }),
  )
  await page.goto('/')

  await expect(page.getByText('CNB rates of 12 November 2026')).toBeVisible()

  // JPY is quoted per 100 units, the case that is easy to get wrong.
  const table = page.getByRole('table', { name: 'Exchange rates' })
  // One row per currency plus the header row; the file adds a date line.
  const fileLines = daily.trim().split('\n').length
  await expect(table.getByRole('row')).toHaveCount(fileLines - 1)
  await expect(table.getByRole('row', { name: /JPY/ })).toContainText('100 JPY')

  const amount = page.getByLabel('Amount in CZK')
  await amount.pressSequentially('1000,5')
  await expect(amount).toHaveValue('1 000.5')

  await page.getByLabel('Currency').selectOption('JPY')

  // 1000.50 CZK * 100 / 13.783 = 7259.07 JPY, shown without decimals.
  const result = page.getByRole('status')
  await expect(result).toContainText('JPY 7 259')
  await expect(result).toContainText('100 JPY = 13.783 CZK')
})
