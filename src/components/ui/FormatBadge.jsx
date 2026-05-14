export default function FormatBadge({ format }) {
  const normalized = String(format).toLowerCase()

  return <span className={`format-badge format-badge--${normalized}`}>{format}</span>
}
