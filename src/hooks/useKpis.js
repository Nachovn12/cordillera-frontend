import { useCallback, useEffect, useState } from 'react'
import { getKpis } from '../services/kpisApi'

export default function useKpis() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchKpis = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getKpis()
      setData(response)
    } catch (currentError) {
      setData(null)
      setError(currentError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKpis()
  }, [fetchKpis])

  return {
    data,
    loading,
    error,
    refetch: fetchKpis,
  }
}
