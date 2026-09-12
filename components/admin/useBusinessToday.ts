'use client'

import { useEffect, useState } from 'react'
import { isoToday } from '@/lib/dates'

/**
 * Today in the maison's timezone, kept current while the board stays open.
 *
 * A server-rendered date is right for exactly one day: the admin screens are
 * left open on the desk, so by the morning shift the "Today" filter would be
 * sitting on yesterday and matching nothing. `initial` is the value the page
 * rendered with, so the first paint agrees with the server and hydration is
 * quiet; after mount the clock is the browser's.
 */
export function useBusinessToday(initial?: string): string {
  const [today, setToday] = useState(initial ?? isoToday())

  useEffect(() => {
    const sync = () => setToday(prev => {
      const now = isoToday()
      return now === prev ? prev : now
    })
    sync()
    const id = setInterval(sync, 60_000)
    return () => clearInterval(id)
  }, [])

  return today
}
