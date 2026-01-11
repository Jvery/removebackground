'use client'

/**
 * Theme Provider Component
 *
 * Provides dark/light mode functionality for the application.
 *
 * WHY THIS APPROACH:
 * - Uses CSS class-based theming (Tailwind's darkMode: 'class') for immediate styling
 * - Detects system preference via prefers-color-scheme media query
 * - Persists user choice in localStorage to maintain preference across sessions
 * - Handles SSR/hydration by suppressing warnings and using useEffect for client-side setup
 * - Inline script prevents flash of incorrect theme on page load
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  /** Current theme setting (light, dark, or system) */
  theme: Theme
  /** Resolved theme that's actually applied (light or dark) */
  resolvedTheme: ResolvedTheme
  /** Set the theme */
  setTheme: (theme: Theme) => void
  /** Toggle between light and dark (ignores system) */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'removebackground-theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

/**
 * Get the resolved theme based on setting and system preference
 */
function getResolvedTheme(theme: Theme, systemTheme: ResolvedTheme): ResolvedTheme {
  if (theme === 'system') {
    return systemTheme
  }
  return theme
}

/**
 * Apply theme class to document
 */
function applyTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement
  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * Get initial theme from localStorage
 * Returns null if no theme is stored, so defaultTheme can be used
 */
function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // localStorage might be unavailable (private browsing, etc.)
  }
  return null
}

/**
 * Get system theme preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

interface ThemeProviderProps {
  children: React.ReactNode
  /** Default theme if none is stored */
  defaultTheme?: Theme
  /** Force a specific theme (useful for testing) */
  forcedTheme?: ResolvedTheme
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // On server or initial render, use default
    if (typeof window === 'undefined') {
      return defaultTheme
    }
    return getStoredTheme() || defaultTheme
  })

  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    return getSystemTheme()
  })

  // Resolved theme considering system preference and forced theme
  const resolvedTheme = useMemo(() => {
    if (forcedTheme) {
      return forcedTheme
    }
    return getResolvedTheme(theme, systemTheme)
  }, [theme, systemTheme, forcedTheme])

  // Apply theme to DOM
  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY)

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])


  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // localStorage might be unavailable
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to access theme context
 *
 * @example
 * const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
 *
 * // Set specific theme
 * setTheme('dark')
 *
 * // Toggle between light/dark
 * toggleTheme()
 *
 * // Check current theme
 * if (resolvedTheme === 'dark') { ... }
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Inline script to prevent flash of incorrect theme
 *
 * WHY: React hydration happens after initial paint. Without this script,
 * users might see a flash of light theme before dark mode is applied.
 * This script runs synchronously before paint to apply the correct class.
 *
 * Include this in your layout's <head> or as the first child of <body>
 */
export function ThemeScript() {
  // This script must be inlined to run before React hydration
  const scriptContent = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored || 'system';
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('${MEDIA_QUERY}').matches);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`

  return (
    <script
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  )
}
