import { useLocation, useNavigate } from 'react-router-dom'

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

  const activo =
    pathname.startsWith('/refugio/dashboard') ? 'dashboard' :
    pathname.startsWith('/refugio/mismascotas') ? 'mismascotas' :
    pathname.startsWith('/refugio/solicitudes') ? 'solicitudes' :
    pathname.startsWith('/refugio/chats') ? 'chats' :
    pathname.startsWith('/refugio/perfil') ? 'perfil' :
    'dashboard'

  return (
    <nav className="bottom-nav-refugio footer-refugio">
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          className={`nav-item-refugio ${activo === item.key ? 'activo' : ''}`}
          onClick={() => navigate(item.ruta)}
        >
          <img
            src={item.icono}
            alt={item.label}
            style={item.key === 'mismascotas' ? { width: '24px', height: '24px', opacity: 0.2, filter: 'invert(100%)' } : undefined}
          />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
