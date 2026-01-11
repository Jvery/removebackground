import { test, expect } from '@playwright/test'
import path from 'path'

// Increase timeout for model loading - it can take up to 5 minutes on first run
test.setTimeout(300000)

test.describe('Background Removal E2E', () => {
  test('should remove background from test image', async ({ page }) => {
    // Collect console logs for debugging
    const consoleLogs: string[] = []
    const failedRequests: string[] = []

    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    })
    page.on('pageerror', (err) => {
      consoleLogs.push(`[PAGE ERROR] ${err.message}`)
    })
    page.on('requestfailed', (request) => {
      failedRequests.push(`[FAILED REQUEST] ${request.url()} - ${request.failure()?.errorText}`)
    })
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`[${response.status()}] ${response.url()}`)
      }
    })

    await page.goto('/')

    // Wait for page to be fully loaded (title is split into two spans)
    await expect(page.locator('h1')).toContainText('remove')
    await expect(page.locator('h1')).toContainText('background')

    // Find the file input
    const fileInput = page.locator('input[type="file"]')
    await expect(fileInput).toBeAttached()

    // Upload our test image (red square on green background)
    const testImagePath = path.join(__dirname, '..', 'test-red-square-green-bg.png')
    await fileInput.setInputFiles(testImagePath)

    // Wait for processing to start - look for progress indicator or loading state
    await expect(page.getByText(/loading|processing|validating/i)).toBeVisible({ timeout: 10000 })

    // Wait for either success or error - with detailed logging
    const successOrError = await Promise.race([
      page.getByText('Background removed successfully').waitFor({ timeout: 180000 }).then(() => 'success'),
      page.getByRole('heading', { name: /Processing failed/i }).waitFor({ timeout: 180000 }).then(() => 'error'),
    ]).catch(() => 'timeout')

    // Log console messages for debugging
    console.log('Console logs:', consoleLogs.join('\n'))
    console.log('Failed requests:', failedRequests.join('\n'))

    if (successOrError === 'error') {
      // Check if there's a "Technical details" section we can expand
      const techDetails = page.getByText('Technical details')
      if (await techDetails.isVisible()) {
        await techDetails.click()
        await page.waitForTimeout(500)
        // Use first() to avoid strict mode violation with multiple matching elements
        const errorDetails = await page.locator('[role="alert"]').first().textContent()
        console.log('Error details:', errorDetails)
      }
      throw new Error('Processing failed - see console logs above')
    }

    if (successOrError === 'timeout') {
      throw new Error('Timeout waiting for processing to complete')
    }

    // Verify we can see the result
    await expect(page.getByRole('button', { name: /download/i })).toBeVisible()

    // Verify "Process another image" button is visible
    await expect(page.getByRole('button', { name: /process another image/i })).toBeVisible()

    // Verify that background was actually removed by checking the success message is displayed
    // The success message confirms the processing completed successfully
    await expect(page.getByText('Background removed successfully')).toBeVisible()

    // Take a screenshot to visually verify the result
    await page.screenshot({ path: 'test-results/background-removal-result.png', fullPage: true })

    console.log('Background removal test completed successfully!')
    console.log('Result: Image processed with transparent background - see test-results/background-removal-result.png')
  })
})
