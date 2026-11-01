import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Lab Management System',
  description: 'Система сдачи и проверки лабораторных работ',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className} flex min-h-screen`}>
        <Providers>
          <Navbar />
          <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
