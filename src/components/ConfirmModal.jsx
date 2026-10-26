export default function ConfirmModal({
  isOpen,
  title = 'Confirmar acción',
  message = '¿Estás seguro?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 20,
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
          padding: 24,
          border: '1px solid #e5e7eb',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 22, color: '#1f2937' }}>{title}</h3>
        <p style={{ margin: '0 0 20px', color: '#4b5563', lineHeight: 1.5 }}>{message}</p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              borderRadius: 10,
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              border: 'none',
              background: '#d93025',
              color: '#fff',
              borderRadius: 10,
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
