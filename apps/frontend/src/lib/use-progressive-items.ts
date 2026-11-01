'use client'

import { useEffect, useState } from 'react'

export function useProgressiveItems<T>(items: T[], step = 1, interval = 70) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    if (items.length === 0) return

    const timer = window.setInterval(() => {
      setVisibleCount(current => {
        const next = Math.min(current + step, items.length)
        if (next >= items.length) window.clearInterval(timer)
        return next
      })
    }, interval)

    return () => window.clearInterval(timer)
  }, [items, step, interval])

  return items.slice(0, visibleCount)
}
