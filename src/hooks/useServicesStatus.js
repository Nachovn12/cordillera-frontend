import { useCallback, useEffect, useState } from 'react'
import { getServicesStatus } from '../services/servicesApi'

export default function useServicesStatus() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getServicesStatus()
      setData(response)
    } catch (currentError) {
      setData(null)
      setError(currentError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    data,
    loading,
    error,
    refetch: fetchServices,
  }
}
