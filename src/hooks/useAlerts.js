import { useCallback, useEffect, useState } from 'react'
import { getAlertas } from '../services/alertsApi'

export default function useAlerts() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getAlertas()
      setData(response)
    } catch (currentError) {
      setData(null)
      setError(currentError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  return {
    data,
    loading,
    error,
    refetch: fetchAlerts,
  }
}
