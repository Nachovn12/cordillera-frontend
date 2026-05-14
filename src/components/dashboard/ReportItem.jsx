import FormatBadge from '../ui/FormatBadge'
import AppIcon from '../ui/AppIcon'
import StatusBadge from '../ui/StatusBadge'

const rowIcons = {
  'Reporte ventas mensual': { icon: 'sales', tone: 'teal' },
  'Inventario crítico': { icon: 'inventory', tone: 'warning' },
  'Rentabilidad operacional': { icon: 'finance', tone: 'teal' },
  'Reporte ejecutivo retail': { icon: 'dashboard', tone: 'info' },
}

export default function ReportItem({ report, table = false }) {
  if (table) {
    const formats = report[2].split(' ')
    const meta = rowIcons[report[0]] || { icon: 'document', tone: 'teal' }

    return (
      <tr>
        <td>
          <div className="table-title">
            <span className={`table-title__icon table-title__icon--${meta.tone}`}>
              <AppIcon name={meta.icon} size={18} strokeWidth={2} />
            </span>
            <span>
              <strong>{report[0]}</strong>
            </span>
          </div>
        </td>
        <td className="table-desc">{report[1]}</td>
        <td>
          <div className="format-group">
            {formats.map((format) => (
              <FormatBadge format={format} key={format} />
            ))}
          </div>
        </td>
        <td>{report[3]}</td>
        <td>
          <StatusBadge status={report[4] === 'Completado' ? 'success' : 'pending'} label={report[4]} />
        </td>
        <td>
          <div className="row-actions">
            <button className="icon-button" type="button" aria-label="Ver reporte">
              <AppIcon name="play" size={16} strokeWidth={2} />
            </button>
            <button className="icon-button" type="button" aria-label="Descargar">
              <AppIcon name="download" size={16} strokeWidth={2} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <article className="report-item">
      <FormatBadge format={report.format} />
      <div>
        <h3>{report.title}</h3>
        <p>{report.category}</p>
      </div>
      <time>{report.time}</time>
      <button className="icon-button" type="button" aria-label="Descargar reporte">
        <AppIcon name="download" size={18} strokeWidth={2} />
      </button>
    </article>
  )
}
