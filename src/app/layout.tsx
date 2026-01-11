import type { Metadata } from 'next'
import { Outfit, DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider, ThemeScript } from '@/components/theme-provider'

// Optimized font loading with Next.js
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: 'removebackground — Remove Backgrounds Instantly',
  description: 'Remove image backgrounds 100% in your browser. Your images never leave your device. Fast, private, and works offline.',
  keywords: ['background removal', 'remove background', 'transparent background', 'privacy', 'client-side'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${dmSans.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className={dmSans.className}>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
