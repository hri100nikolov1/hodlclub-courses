import type { Metadata } from 'next'
import './globals.css'

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
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
