/**
 * ThemeToggle Tests
 *
 * WHY THESE TESTS:
 * - Ensures accessibility requirements are met (ARIA labels, keyboard navigation)
 * - Verifies visual state changes correctly (icons, styling)
 * - Confirms toggle functionality works with theme context
 * - Tests the extended ThemeToggleWithLabel component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ThemeToggle, ThemeToggleWithLabel } from '../theme-toggle'
import { ThemeProvider } from '../theme-provider'

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

// Wrapper component
function TestWrapper({ children, defaultTheme = 'light' as const }: { children: React.ReactNode, defaultTheme?: 'light' | 'dark' | 'system' }) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      {children}
    </ThemeProvider>
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.matchMedia = createMatchMediaMock(false)
    localStorageMock.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a button', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has accessible label in light mode', () => {
    render(
      <TestWrapper defaultTheme="light">
        <ThemeToggle />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')
  })

  it('has accessible label in dark mode', () => {
    render(
      <TestWrapper defaultTheme="dark">
        <ThemeToggle />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  it('toggles theme when clicked', async () => {
    render(
      <TestWrapper defaultTheme="light">
        <ThemeToggle />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode')

    await act(async () => {
      fireEvent.click(button)
    })

    expect(button).toHaveAttribute('aria-label', 'Switch to light mode')
  })

  it('accepts custom className', () => {
    render(
      <TestWrapper>
        <ThemeToggle className="custom-class" />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('contains both sun and moon icons', () => {
    render(
      <TestWrapper>
        <ThemeToggle />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    const svgs = button.querySelectorAll('svg')
    expect(svgs.length).toBe(2) // Sun and Moon icons
  })

  it('is keyboard accessible', async () => {
    render(
      <TestWrapper defaultTheme="light">
        <ThemeToggle />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    button.focus()
    expect(document.activeElement).toBe(button)

    // Simulate Enter key press
    await act(async () => {
      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyUp(button, { key: 'Enter' })
    })
  })

  it('shows title tooltip', () => {
    render(
      <TestWrapper defaultTheme="light">
        <ThemeToggle />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Switch to dark mode')
  })

  it('respects size prop', () => {
    render(
      <TestWrapper>
        <ThemeToggle size={24} />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    const span = button.querySelector('span')
    expect(span).toHaveStyle({ width: '24px', height: '24px' })
  })
})

describe('ThemeToggleWithLabel', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.matchMedia = createMatchMediaMock(false)
    localStorageMock.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders three theme options', () => {
    render(
      <TestWrapper>
        <ThemeToggleWithLabel />
      </TestWrapper>
    )

    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
  })

  it('shows theme label', () => {
    render(
      <TestWrapper>
        <ThemeToggleWithLabel />
      </TestWrapper>
    )

    expect(screen.getByText('Theme:')).toBeInTheDocument()
  })

  it('shows resolved theme in parentheses', () => {
    render(
      <TestWrapper defaultTheme="light">
        <ThemeToggleWithLabel />
      </TestWrapper>
    )

    expect(screen.getByText('(light)')).toBeInTheDocument()
  })

  it('allows selecting light theme', async () => {
    render(
      <TestWrapper defaultTheme="dark">
        <ThemeToggleWithLabel />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Light'))
    })

    expect(screen.getByText('(light)')).toBeInTheDocument()
  })

  it('allows selecting dark theme', async () => {
    render(
      <TestWrapper defaultTheme="light">
        <ThemeToggleWithLabel />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Dark'))
    })

    expect(screen.getByText('(dark)')).toBeInTheDocument()
  })

  it('allows selecting system theme', async () => {
    render(
      <TestWrapper defaultTheme="light">
        <ThemeToggleWithLabel />
      </TestWrapper>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('System'))
    })

    // System should resolve to light (based on our mock)
    expect(screen.getByText('(light)')).toBeInTheDocument()
  })

  it('indicates active option with aria-pressed', () => {
    render(
      <TestWrapper defaultTheme="dark">
        <ThemeToggleWithLabel />
      </TestWrapper>
    )

    expect(screen.getByText('Dark')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Light')).toHaveAttribute('aria-pressed', 'false')
  })

  it('accepts custom className', () => {
    const { container } = render(
      <TestWrapper>
        <ThemeToggleWithLabel className="custom-class" />
      </TestWrapper>
    )

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })
})
