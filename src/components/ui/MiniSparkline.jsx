export default function MiniSparkline({ data = [], tone = 'success' }) {
  const width = 72
  const height = 34
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width
      const y = height - ((value - min) / range) * (height - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg className={`mini-sparkline mini-sparkline--${tone}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} />
    </svg>
  )
}
