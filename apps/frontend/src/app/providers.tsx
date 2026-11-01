'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthInitializer } from '@/components/AuthInitializer'
import { Toaster } from 'react-hot-toast'
import PreferencesProvider from '@/components/PreferencesProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 минута
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <PreferencesProvider />
        {children}
      </AuthInitializer>
      <Toaster position="bottom-right" toastOptions={{ duration: 3500 }} />
    </QueryClientProvider>
  )
}
