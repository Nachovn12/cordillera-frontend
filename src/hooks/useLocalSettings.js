import { useCallback, useMemo, useState } from 'react'

const STORAGE_KEY = 'cordillera.localSettings'

export const defaultLocalSettings = {
  theme: 'claro',
  density: 'confortable',
  currency: 'CLP',
  language: 'es-CL',
  defaultPeriod: 'Mayo 2026',
  defaultBranch: 'Todas las sucursales',
}

function readStoredSettings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultLocalSettings, ...JSON.parse(stored) } : defaultLocalSettings
  } catch {
    return defaultLocalSettings
  }
}

export default function useLocalSettings() {
  const [settings, setSettings] = useState(readStoredSettings)

  const persist = useCallback((nextSettings) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))
  }, [])

  const updateSetting = useCallback((key, value) => {
    setSettings((current) => {
      const nextSettings = { ...current, [key]: value }
      persist(nextSettings)
      return nextSettings
    })
  }, [persist])

  const resetSettings = useCallback(() => {
    setSettings(defaultLocalSettings)
    persist(defaultLocalSettings)
  }, [persist])

  return useMemo(() => ({
    settings,
    updateSetting,
    resetSettings,
  }), [resetSettings, settings, updateSetting])
}
