import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'HODLClub',
  description: 'Платформа за онлайн обучение',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bg" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
