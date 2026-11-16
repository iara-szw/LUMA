import { useLocation, useNavigate } from 'react-router-dom'
import { usarChat } from '../contexts/ContextoChat.jsx'

const items = [
  { key: 'dashboard', label: 'Inicio', ruta: '/refugio/dashboard', icono: '/assets/img/home.png' },
  { key: 'mismascotas', label: 'Animales', ruta: '/refugio/mismascotas', icono: '/assets/img/animal.png' },
  { key: 'solicitudes', label: 'Solicitudes', ruta: '/refugio/solicitudes', icono: '/assets/img/solicitudes.png' },
  { key: 'chats', label: 'Chat', ruta: '/refugio/chats', icono: '/assets/img/chat.png' },
  { key: 'perfil', label: 'Perfil', ruta: '/refugio/perfil', icono: '/assets/img/perfil.png' },
]

export default function FooterRefugio() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { noLeidos } = usarChat()

  const activo =
    pathname.startsWith('/refugio/dashboard') ? 'dashboard' :
    pathname.startsWith('/refugio/mismascotas') ? 'mismascotas' :
    pathname.startsWith('/refugio/solicitudes') ? 'solicitudes' :
    pathname.startsWith('/refugio/chats') ? 'chats' :
    pathname.startsWith('/refugio/perfil') ? 'perfil' :
    'dashboard'

  return (
    <nav className="bottom-nav-refugio footer-refugio">
      {items.map(item => {
        const esChat = item.key === 'chats'
        const mostrarBadge = esChat && noLeidos > 0

        return (
          <button
            key={item.key}
            type="button"
            className={`nav-item-refugio ${activo === item.key ? 'activo' : ''}`}
            onClick={() => navigate(item.ruta)}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={item.icono}
                alt={item.label}
                style={item.key === 'mismascotas' ? { width: '24px', height: '24px', opacity: 0.2, filter: 'invert(100%)' } : undefined}
              />
              {mostrarBadge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    background: '#B8956A',
                    color: '#fff',
                    borderRadius: '999px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 5px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  {noLeidos > 9 ? '9+' : noLeidos}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
