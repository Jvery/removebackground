import { test, expect } from '@playwright/test'

test.describe('removebackground', () => {
  test('should display the main page', async ({ page }) => {
    await page.goto('/')

    // Check that the title is present
    await expect(page.locator('h1')).toContainText('removebackground')

    // Check that the tagline is visible
    await expect(page.getByText('Remove backgrounds instantly')).toBeVisible()

    // Check that the privacy message is visible in footer
    await expect(page.locator('footer').getByText('Your images never leave your device')).toBeVisible()
  })

  test('should show upload zone', async ({ page }) => {
    await page.goto('/')

    // Check that the upload prompt is visible
    await expect(page.getByText(/drop your image here/i)).toBeVisible()

    // Check that the supported formats are listed
    await expect(page.getByText('PNG, JPEG, WebP, or GIF')).toBeVisible()
  })

  test('should have upload functionality', async ({ page }) => {
    await page.goto('/')

    // The drop zone should be focusable and have proper aria label
    const dropZone = page.getByRole('button', { name: /upload image/i })
    await expect(dropZone).toBeVisible()

    // Check for hidden file input
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()
  })

  test('should display footer privacy information', async ({ page }) => {
    await page.goto('/')

    // Check footer privacy info
    await expect(page.getByText('100% client-side processing')).toBeVisible()
    await expect(page.getByText('Works offline after first load')).toBeVisible()
    await expect(page.getByText('No account required')).toBeVisible()
  })
})
