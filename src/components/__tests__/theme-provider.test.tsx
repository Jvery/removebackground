/**
 * ThemeProvider Tests
 *
 * WHY THESE TESTS:
 * - Ensures theme context is provided correctly to children
 * - Validates system preference detection works
 * - Confirms localStorage persistence functions properly
 * - Verifies theme switching applies correct CSS class
 * - Tests error handling when used outside provider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeProvider, useTheme, ThemeScript } from '../theme-provider'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Test component that uses the theme
function TestConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Setup mocks
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.matchMedia = createMatchMediaMock(false) // Default to light system theme
    localStorageMock.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('provides default theme to children', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
  })

  it('respects defaultTheme prop', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
  })

  it('respects forcedTheme prop', () => {
    render(
      <ThemeProvider forcedTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
  })

  it('allows setting theme to dark', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Set Dark'))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'removebackground-theme',
      'dark'
    )
  })

  it('allows setting theme to light', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Set Light'))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
  })

  it('allows setting theme to system', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestConsumer />
      </ThemeProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Set System'))
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
  })

  it('toggles between light and dark', async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('resolved')).toHaveTextContent('light')

    await act(async () => {
      fireEvent.click(screen.getByText('Toggle'))
    })

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')

    await act(async () => {
      fireEvent.click(screen.getByText('Toggle'))
    })

    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
  })

  it('applies dark class to document when dark theme is active', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Set Dark'))
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class when light theme is active', async () => {
    document.documentElement.classList.add('dark')

    render(
      <ThemeProvider defaultTheme="light">
        <TestConsumer />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reads stored theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValueOnce('dark')

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    )

    // Should read from localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith('removebackground-theme')
  })

  it('resolves system theme based on prefers-color-scheme', () => {
    // Mock system dark mode preference
    window.matchMedia = createMatchMediaMock(true)

    render(
      <ThemeProvider defaultTheme="system">
        <TestConsumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
  })
})

describe('useTheme', () => {
  it('throws error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleSpy.mockRestore()
  })
})

describe('ThemeScript', () => {
  it('renders a script element', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    expect(script).toBeTruthy()
  })

  it('contains theme initialization logic', () => {
    const { container } = render(<ThemeScript />)
    const script = container.querySelector('script')
    expect(script?.innerHTML).toContain('localStorage')
    expect(script?.innerHTML).toContain('removebackground-theme')
    expect(script?.innerHTML).toContain('prefers-color-scheme')
  })
})
