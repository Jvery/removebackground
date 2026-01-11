import { test, expect } from '@playwright/test'

test.describe('removebackground', () => {
  test('should display the main page', async ({ page }) => {
    await page.goto('/')
    
    // Check that the title is present
    await expect(page.locator('h1')).toContainText('removebackground')
    
    // Check that the privacy message is visible
    await expect(page.getByText('Your images never leave your device')).toBeVisible()
  })

  test('should show upload zone', async ({ page }) => {
    await page.goto('/')
    
    // Check that the upload prompt is visible
    await expect(page.getByText(/drop an image/i)).toBeVisible()
  })
})
