import { useCallback, useEffect, useState } from 'react'
import { getDashboardStats } from '../services/dashboardApi'

export default function useDashboardStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const stats = await getDashboardStats()
      setData(stats)
    } catch (currentError) {
      setData(null)
      setError(currentError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    data,
    loading,
    error,
    refetch: fetchStats,
  }
}
