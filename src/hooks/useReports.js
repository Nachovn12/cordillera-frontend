import { useCallback, useEffect, useState } from 'react'
import { exportarReporte, generarReporte, getReportes, eliminarReporte } from '../services/reportsApi'

export default function useReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getReportes()
      setData(response)
    } catch (currentError) {
      setData(null)
      setError(currentError)
    } finally {
      setLoading(false)
    }
  }, [])

  const generar = useCallback(async (payload = {}) => {
    setActionLoading(true)
    setActionError(null)

    try {
      const response = await generarReporte(payload)
      await fetchReports()
      return response
    } catch (currentError) {
      setActionError(currentError)
      throw currentError
    } finally {
      setActionLoading(false)
    }
  }, [fetchReports])

  const exportar = useCallback(async (id, formato) => {
    setActionLoading(true)
    setActionError(null)

    try {
      const { blob, fileName } = await exportarReporte(id, formato)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (currentError) {
      setActionError(currentError)
      throw currentError
    } finally {
      setActionLoading(false)
    }
  }, [])

  const eliminar = useCallback(async (id) => {
    setActionLoading(true)
    setActionError(null)

    try {
      const response = await eliminarReporte(id)
      await fetchReports()
      return response
    } catch (currentError) {
      setActionError(currentError)
      throw currentError
    } finally {
      setActionLoading(false)
    }
  }, [fetchReports])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return {
    data,
    loading,
    error,
    refetch: fetchReports,
    generar,
    exportar,
    eliminar,
    actionLoading,
    actionError,
  }
}
