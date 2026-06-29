import Chart from 'react-apexcharts'

export default function TrendPanel({ title, description, data, type = 'bar', series, badge }) {
  const chartSeries =
    series ||
    (type === 'line'
      ? [{ name: title, tone: 'teal', values: data.map((item) => item.value) }]
      : [])
  const lineValues = chartSeries.flatMap((item) => item.values)
  const valuesForScale = lineValues.length ? lineValues : data.map((item) => item.value)
  const max = Math.max(...(valuesForScale.length ? valuesForScale : [1]), 1)
  const barMax = getNiceMax(max)
  const yAxisLabels = getYAxisLabels(barMax)
  const hasLineData = type === 'line' && data.length > 0 && chartSeries.some((item) => item.values.length > 0)
  const latestValue = data.at(-1)?.value ?? 0
  const firstValue = data.at(0)?.value ?? latestValue
  const delta = firstValue > 0 ? ((latestValue - firstValue) / firstValue) * 100 : 0
  const average = data.length > 0 ? data.reduce((sum, item) => sum + item.value, 0) / data.length : 0
  const averagePosition = Math.min(Math.max((average / barMax) * 100, 0), 100)

  const displayBadge = badge || (hasLineData ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : null)

  return (
    <article className={`trend-panel trend-panel--${type}`}>
      <div className="trend-panel__header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {displayBadge && (
          <strong className={delta >= 0 ? 'is-positive' : 'is-negative'}>
            {displayBadge}
          </strong>
        )}
      </div>

      {type === 'line' ? (
        <div className="bar-chart bar-chart--executive">
          {hasLineData ? (
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
              <div className="mt-4" style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                <Chart
                  options={{
                    chart: {
                      type: 'area',
                      height: '100%',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      toolbar: { show: false },
                      zoom: { enabled: false },
                    },
                    colors: chartSeries.map(item => item.tone === 'orange' ? '#f97316' : item.tone === 'blue' ? '#2563eb' : '#0d9488'),
                    fill: {
                      type: 'gradient',
                      gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.45,
                        opacityTo: 0.05,
                        stops: [0, 100]
                      }
                    },
                    dataLabels: { enabled: false },
                    stroke: {
                      curve: 'smooth',
                      width: 3
                    },
                    grid: {
                      show: true,
                      borderColor: '#f1f5f9',
                      strokeDashArray: 4,
                      xaxis: { lines: { show: false } },
                      yaxis: { lines: { show: true } },
                    },
                    xaxis: {
                      categories: data.map(item => item.label),
                      labels: {
                        style: { colors: '#64748b', fontSize: '12px', fontWeight: 500 }
                      },
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                      tooltip: { enabled: false }
                    },
                    yaxis: {
                      labels: {
                        formatter: (val) => formatCompactCurrency(val),
                        style: { colors: '#64748b', fontSize: '11px', fontWeight: 500 },
                      }
                    },
                    tooltip: {
                      y: { formatter: (val) => formatCompactCurrency(val) },
                      theme: 'light'
                    },
                    legend: { show: false }
                  }}
                  series={chartSeries.map(item => ({
                    name: item.name,
                    data: item.values
                  }))}
                  type="area"
                  height="220"
                />
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
