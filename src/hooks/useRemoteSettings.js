import { useCallback, useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../services/settingsApi'

export default function useRemoteSettings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await getSettings()
      setData(response)
    } catch (currentError) {
      setData(null)
      setError(currentError)
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (payload) => {
    setSaving(true)
    setError(null)

    try {
      const response = await updateSettings(payload)
      setData(response)
      return response
    } catch (currentError) {
      setError(currentError)
      throw currentError
    } finally {
      setSaving(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    data,
    loading,
    error,
    refetch: fetchSettings,
    save,
    saving,
  }
}
