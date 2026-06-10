import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { BenefitCategory } from '../types'

export function useBenefits() {
  const [benefits, setBenefits] = useState<BenefitCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getBenefits()
      setBenefits(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load benefits')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { benefits, loading, error, refresh }
}
