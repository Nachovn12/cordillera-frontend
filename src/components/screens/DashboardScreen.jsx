import ExecutiveDashboard from '../dashboard/ExecutiveDashboard'
import useDashboardStats from '../../hooks/useDashboardStats'
import { useEffect, useRef } from 'react'

export default function DashboardScreen({ refreshToken = 0, onBffStatusChange }) {
  const { data, error, loading, refetch } = useDashboardStats()
  const didMount = useRef(false)

  useEffect(() => {
    if (loading) {
      onBffStatusChange?.({ status: 'info', label: 'Consultando' })
      return
    }

    if (error) {
      onBffStatusChange?.({ status: 'danger', label: 'Error' })
      return
    }

    if (data?.bffStatus) {
      onBffStatusChange?.(data.bffStatus)
    }
  }, [data, error, loading, onBffStatusChange])

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }

    refetch()
  }, [refreshToken, refetch])

  return (
    <main className="screen screen--dashboard">
      <ExecutiveDashboard data={data} error={error} loading={loading} onRetry={refetch} />
    </main>
  )
}
