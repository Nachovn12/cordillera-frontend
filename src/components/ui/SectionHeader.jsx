export default function SectionHeader({ title, description, action, onActionClick }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && (
        <div className="section-header__action">
          {typeof action === 'string' ? (
            <button type="button" className="link-button" onClick={onActionClick}>
              {action}
            </button>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  )
}
