import FormatBadge from '../ui/FormatBadge'
import AppIcon from '../ui/AppIcon'
import StatusBadge from '../ui/StatusBadge'
import { exportarReporte } from '../../services/reportsApi'

const rowIcons = {
  'Reporte ventas mensual': { icon: 'sales', tone: 'teal' },
  'Inventario crítico': { icon: 'inventory', tone: 'warning' },
  'Rentabilidad operacional': { icon: 'finance', tone: 'teal' },
  'Reporte ejecutivo retail': { icon: 'dashboard', tone: 'info' },
}

export default function ReportItem({ report, table = false }) {
  const handleDownload = async (e) => {
    if (e) e.stopPropagation()
    try {
      let idToDownload = String(report.id || report[0] || '1').replace(/\D/g, '') || '1'
      if (idToDownload === '0') idToDownload = '1'

      const formatString = table ? String(report[2] || 'pdf') : String(report.format || 'pdf')
      const formatToExport = formatString.toLowerCase().includes('excel') || formatString.toLowerCase().includes('xls') ? 'excel' : 'pdf'

      const { blob, fileName } = await exportarReporte(idToDownload, formatToExport)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `reporte-${idToDownload}.${formatToExport === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al descargar reporte:', err)
      alert('Error al descargar el reporte desde Report Service.')
    }
  }

  if (table) {
    const formats = report[2].split(' ')
    const meta = rowIcons[report[0]] || { icon: 'document', tone: 'teal' }

    return (
      <tr>
        <td style={{ verticalAlign: 'middle' }}>
          <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`table-title__icon table-title__icon--${meta.tone}`}>
              <AppIcon name={meta.icon} size={18} strokeWidth={2} />
            </span>
            <span>
              <strong>{report[0]}</strong>
            </span>
          </div>
        </td>
        <td className="table-desc" style={{ verticalAlign: 'middle' }}>{report[1]}</td>
        <td style={{ verticalAlign: 'middle' }}>
          <div className="format-group" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {formats.map((format) => (
              <FormatBadge format={format} key={format} />
            ))}
          </div>
        </td>
        <td style={{ verticalAlign: 'middle' }}>{report[3]}</td>
        <td style={{ verticalAlign: 'middle' }}>
          <StatusBadge status={report[4] === 'Completado' ? 'success' : 'pending'} label={report[4]} />
        </td>
        <td style={{ verticalAlign: 'middle' }}>
          <div className="row-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="icon-button" type="button" aria-label="Ver reporte">
              <AppIcon name="play" size={16} strokeWidth={2} />
            </button>
            <button className="icon-button" type="button" aria-label="Descargar" onClick={handleDownload} title="Descargar reporte">
              <AppIcon name="download" size={16} strokeWidth={2} />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <article className="report-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '12px 18px 12px 14px', width: '100%', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', transition: 'all 0.2s ease', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '100px' }}>
        <FormatBadge format={report.format} />
      </div>

      <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '8px' }}>
        <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 600, fontSize: '0.86rem', lineHeight: '1.2' }}>
          {report.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
              <AppIcon name="document" size={13} />
            </span>
            <span>{report.category}</span>
          </span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
              <AppIcon name="clock" size={13} />
            </span>
            <span>{report.time}</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '4px' }}>
        <button className="icon-button" type="button" aria-label="Descargar reporte" title="Descargar" onClick={handleDownload} style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <AppIcon name="download" size={16} strokeWidth={2} />
        </button>
      </div>
    </article>
  )
}

