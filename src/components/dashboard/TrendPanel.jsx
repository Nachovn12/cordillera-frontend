export default function TrendPanel({ title, description, data, type = 'bar', series, badge = '+12.8%' }) {
  const chartSeries =
    series ||
    (type === 'line'
      ? [{ name: title, tone: 'teal', values: data.map((item) => item.value) }]
      : [])
  const lineValues = chartSeries.flatMap((item) => item.values)
  const valuesForScale = lineValues.length ? lineValues : data.map((item) => item.value)
  const max = Math.max(...(valuesForScale.length ? valuesForScale : [1]), 1)
  const min = Math.min(...(lineValues.length ? lineValues : [0]))
  const barMax = getNiceMax(max)
  const yAxisLabels = getYAxisLabels(barMax)
  const hasLineData = type === 'line' && data.length > 0 && chartSeries.some((item) => item.values.length > 0)
  const latestValue = data.at(-1)?.value ?? 0
  const firstValue = data.at(0)?.value ?? latestValue
  const delta = firstValue > 0 ? ((latestValue - firstValue) / firstValue) * 100 : 0
  const average = data.length > 0 ? data.reduce((sum, item) => sum + item.value, 0) / data.length : 0
  const averagePosition = Math.min(Math.max((average / barMax) * 100, 0), 100)

  const getPoints = (values) =>
    values
      .map((value, index) => {
        const x = 30 + (index / Math.max(values.length - 1, 1)) * 940
        const y = 170 - ((value - min) / Math.max(max - min, 1)) * 140
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')

  const metaY = max > 0 ? 170 - ((100 - min) / Math.max(max - min, 1)) * 140 : 100

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
              <svg viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
                {[30, 75, 120, 165].map((y) => (
                  <line key={y} x1="30" y1={y} x2="970" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                ))}
                <line
                  className="line-chart__meta"
                  x1="30" y1={metaY.toFixed(1)}
                  x2="970" y2={metaY.toFixed(1)}
                />
                {chartSeries.map((item) => (
                  <g key={item.name}>
                    <polyline className={`line-chart__line line-chart__line--${item.tone}`} points={getPoints(item.values)} />
                    {item.values.map((val, index) => {
                      const x = 30 + (index / Math.max(item.values.length - 1, 1)) * 940
                      const y = 170 - ((val - min) / Math.max(max - min, 1)) * 140
                      return (
                        <circle
                          className="line-chart__point"
                          cx={x.toFixed(1)}
                          cy={y.toFixed(1)}
                          fill="#fff"
                          key={`${item.name}-${index}`}
                          r="5"
                          stroke={item.tone === 'orange' ? '#f97316' : item.tone === 'blue' ? '#2563eb' : '#0d9488'}
                          strokeWidth="2.5"
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
              <strong>Base histórica en construcción</strong>
              <p>El BFF no entregó evolución histórica para este panel.</p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="bar-chart bar-chart--executive"
          style={{
            '--bar-count': Math.max(data.length, 1),
            '--average-position': `${averagePosition}%`,
          }}
        >
          {data.length > 0 ? (
            <>
              <div className="bar-chart__summary">
                <div>
                  <span>Mes actual</span>
                  <strong>{formatCompactCurrency(latestValue)}</strong>
                </div>
                <div>
                  <span>Promedio</span>
                  <strong>{formatCompactCurrency(average)}</strong>
                </div>
                <div>
                  <span>Variación</span>
                  <strong className={delta >= 0 ? 'is-positive' : 'is-negative'}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </strong>
                </div>
              </div>
              <div className="bar-chart__axis" aria-hidden="true">
                {yAxisLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="bar-chart__plot">
                <span className="bar-chart__average-line">
                  <em>Promedio</em>
                </span>
                {data.map((item) => (
                  <div className="bar-chart__item" key={item.label}>
                    <strong>{formatCompactCurrency(item.value)}</strong>
                    <span style={{ '--bar-height': `${Math.min((item.value / barMax) * 100, 100)}%` }} />
                    <small>{item.label}</small>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state empty-state--chart">
              <strong>Base histórica en construcción</strong>
              <p>El BFF no entregó serie histórica de ventas.</p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function getNiceMax(value) {
  const padded = Math.max(value * 1.15, 1)
  const magnitude = 10 ** Math.floor(Math.log10(padded))
  const normalized = padded / magnitude
  const niceNormalized = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10

  return niceNormalized * magnitude
}

function getYAxisLabels(max) {
  return [1, 0.75, 0.5, 0.25, 0].map((factor) => formatAxisValue(max * factor))
}

function formatAxisValue(value) {
  if (value >= 1000000) {
    return `${Number((value / 1000000).toFixed(1))}M`
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`
  }

  return String(Math.round(value))
}

function formatCompactCurrency(value) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return '$0'
  }

  if (numberValue >= 1000000) {
    return `$${Number((numberValue / 1000000).toFixed(1))}M`
  }

  if (numberValue >= 1000) {
    return `$${Math.round(numberValue / 1000)}K`
  }

  return `$${Math.round(numberValue)}`
}
