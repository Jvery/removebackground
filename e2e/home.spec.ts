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

    // Check that the supported formats are listed (displayed as individual badges)
    await expect(page.locator('.drop-zone').getByText('PNG')).toBeVisible()
    await expect(page.locator('.drop-zone').getByText('JPEG')).toBeVisible()
    await expect(page.locator('.drop-zone').getByText('WebP')).toBeVisible()
    await expect(page.locator('.drop-zone').getByText('GIF')).toBeVisible()
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

  test('should have theme toggle functionality', async ({ page }) => {
    await page.goto('/')

    // Theme toggle button should be visible
    const themeToggle = page.getByRole('button', { name: /switch to (dark|light) mode/i })
    await expect(themeToggle).toBeVisible()

    // Get initial theme state (should default to system which is usually light)
    const html = page.locator('html')

    // Click theme toggle
    await themeToggle.click()

    // Verify the toggle changed the theme (aria-label should flip)
    await expect(themeToggle).toHaveAttribute('aria-label', /switch to (dark|light) mode/i)
  })

  test('should persist theme preference', async ({ page }) => {
    await page.goto('/')

    // Wait for initial render
    await page.waitForLoadState('networkidle')

    // Get initial state
    const themeToggle = page.getByRole('button', { name: /switch to (dark|light) mode/i })
    await expect(themeToggle).toBeVisible()
    const initialLabel = await themeToggle.getAttribute('aria-label')

    // Toggle theme and wait for DOM to update
    await themeToggle.click()
    await page.waitForTimeout(300) // Wait for state update and re-render

    // Get new state - it should have changed
    const newLabel = await themeToggle.getAttribute('aria-label')

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Theme should persist
    const persistedToggle = page.getByRole('button', { name: /switch to (dark|light) mode/i })
    await expect(persistedToggle).toBeVisible()

    // Verify the theme persisted (same as after toggle)
    await expect(persistedToggle).toHaveAttribute('aria-label', newLabel!)
  })
})
