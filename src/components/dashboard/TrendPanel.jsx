export default function TrendPanel({ title, description, data, type = 'bar', series, badge = '+12.8%' }) {
  const yAxisLabels = ['1.4M', '1.2M', '1.0M', '800K', '600K', '400K', '200K', '0']
  const chartSeries =
    series ||
    (type === 'line'
      ? [{ name: title, tone: 'teal', values: data.map((item) => item.value) }]
      : [])
  const lineValues = chartSeries.flatMap((item) => item.values)
  const valuesForScale = lineValues.length ? lineValues : data.map((item) => item.value)
  const max = Math.max(...(valuesForScale.length ? valuesForScale : [1]), 1)
  const min = Math.min(...(lineValues.length ? lineValues : [0]))
  const barMax = Math.max(1400000, max)
  const hasLineData = type === 'line' && data.length > 0 && chartSeries.some((item) => item.values.length > 0)

  const getPoints = (values) =>
    values
      .map((value, index) => {
        const x = 7 + (index / Math.max(values.length - 1, 1)) * 86
        const y = 86 - ((value - min) / Math.max(max - min, 1)) * 68
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

  const metaY = max > 0 ? 86 - ((100 - min) / Math.max(max - min, 1)) * 68 : 40

  return (
    <article className={`trend-panel trend-panel--${type}`}>
      <div className="trend-panel__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {badge && <strong>{badge}</strong>}
      </div>

      {type === 'line' ? (
        <div className="line-chart" style={{ '--label-count': Math.max(data.length, 1) }}>
          {hasLineData ? (
            <>
              {chartSeries.length > 1 && (
                <div className="line-chart__legend">
                  {chartSeries.map((item) => (
                    <span className={`line-chart__legend-item line-chart__legend-item--${item.tone}`} key={item.name}>
                      {item.name}
                    </span>
                  ))}
                  <span className="line-chart__legend-item line-chart__legend-item--meta">
                    Meta (100%)
                  </span>
                </div>
              )}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="7" y1={y} x2="93" y2={y} stroke="#f1f5f9" strokeWidth="0.5" />
                ))}
                <line
                  className="line-chart__meta"
                  x1="7" y1={metaY.toFixed(1)}
                  x2="93" y2={metaY.toFixed(1)}
                />
                {chartSeries.map((item) => (
                  <g key={item.name}>
                    <polyline className={`line-chart__line line-chart__line--${item.tone}`} points={getPoints(item.values)} />
                    {item.values.map((val, index) => {
                      const x = 7 + (index / Math.max(item.values.length - 1, 1)) * 86
                      const y = 86 - ((val - min) / Math.max(max - min, 1)) * 68
                      return (
                        <circle
                          className="line-chart__point"
                          cx={x.toFixed(1)}
                          cy={y.toFixed(1)}
                          fill="#fff"
                          key={`${item.name}-${index}`}
                          r="1.5"
                          stroke="#0d9488"
                          strokeWidth="0.8"
                        />
                      )
                    })}
                  </g>
                ))}
              </svg>
              <div className="line-chart__labels">
                {data.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state empty-state--chart">
              <strong>Histórico pendiente de integración</strong>
              <p>El endpoint actual no entrega evolución histórica para este panel.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bar-chart">
          {data.length > 0 ? (
            <>
              <div className="bar-chart__axis" aria-hidden="true">
                {yAxisLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="bar-chart__plot">
                {data.map((item) => (
                  <div className="bar-chart__item" key={item.label}>
                    <span style={{ '--bar-height': `${Math.min((item.value / barMax) * 100, 100)}%` }} />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state empty-state--chart">
              <strong>Histórico pendiente de integración</strong>
              <p>El endpoint actual no entrega serie histórica de ventas.</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
