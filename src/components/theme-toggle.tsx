'use client'

/**
 * Theme Toggle Component
 *
 * An accessible toggle button for switching between light and dark modes.
 *
 * WHY THIS DESIGN:
 * - Uses semantic button element for keyboard accessibility
 * - Animated sun/moon icons provide clear visual feedback
 * - ARIA labels communicate state to screen readers
 * - Smooth CSS transitions at 60fps for premium feel
 * - Respects system preferences when in 'system' mode
 */

import { useTheme } from './theme-provider'

interface ThemeToggleProps {
  /** Additional CSS classes */
  className?: string
  /** Size of the toggle button in pixels */
  size?: number
}

export function ThemeToggle({ className = '', size = 20 }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        rounded-lg p-2
        text-muted-foreground hover:text-foreground
        hover:bg-muted
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        transition-colors duration-200
        ${className}
      `}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Container for icon animation */}
      <span className="relative" style={{ width: size, height: size }}>
        {/* Sun icon - visible in dark mode (to switch to light) */}
        <svg
          className={`
            absolute inset-0 transition-all duration-300 ease-in-out
            ${isDark
              ? 'rotate-0 scale-100 opacity-100'
              : 'rotate-90 scale-0 opacity-0'
            }
          `}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Sun circle */}
          <circle cx="12" cy="12" r="4" />
          {/* Sun rays */}
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>

        {/* Moon icon - visible in light mode (to switch to dark) */}
        <svg
          className={`
            absolute inset-0 transition-all duration-300 ease-in-out
            ${isDark
              ? '-rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100'
            }
          `}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Moon shape */}
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </span>

      {/* Screen reader text */}
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </button>
  )
}

/**
 * Theme Toggle with Label
 *
 * A more explicit version with visible text label
 */
export function ThemeToggleWithLabel({ className = '' }: { className?: string }) {
  const { resolvedTheme, theme, setTheme } = useTheme()

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-muted-foreground">Theme:</span>
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        <ThemeOptionButton
          active={theme === 'light'}
          onClick={() => setTheme('light')}
          label="Light"
        />
        <ThemeOptionButton
          active={theme === 'system'}
          onClick={() => setTheme('system')}
          label="System"
        />
        <ThemeOptionButton
          active={theme === 'dark'}
          onClick={() => setTheme('dark')}
          label="Dark"
        />
      </div>
      <span className="text-xs text-muted-foreground/70">
        ({resolvedTheme})
      </span>
    </div>
  )
}

function ThemeOptionButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1 text-xs font-medium rounded-md transition-all duration-200
        ${active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
        }
      `}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
