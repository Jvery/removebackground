import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider, ThemeScript } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
