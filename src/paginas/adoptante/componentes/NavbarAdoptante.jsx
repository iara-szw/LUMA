import { useNavigate } from 'react-router-dom'
import './style.css'

export default function NavBarAdoptante({ activo }) {
  const navigate = useNavigate()

  const items = [
    { key: 'inicio',   label: 'Inicio',   icono: '🏠', ruta: '/inicio' },
    { key: 'buscar',   label: 'Buscar',   icono: '🔍', ruta: '/explorar' },
    { key: 'mapa',     label: '',         icono: '📍', ruta: '/mapa', centro: true },
    { key: 'eventos',  label: 'Eventos',  icono: '📅', ruta: '/eventos' },
    { key: 'perfil',   label: 'Perfil',   icono: '👤', ruta: '/perfil' },
  ]

  return (
    <nav className="navbar">
      {items.map(item => (
        item.centro
          ? (
            <button
              key={item.key}
              className="navbar-center"
              onClick={() => navigate(item.ruta)}
            >
              <span>{item.icono}</span>
            </button>
          )
          : (
            <button
              key={item.key}
              className={`navbar-item ${activo === item.key ? 'activo' : ''}`}
              onClick={() => navigate(item.ruta)}
            >
              <span className="navbar-icono">{item.icono}</span>
              <span className="navbar-label">{item.label}</span>
            </button>
          )
      ))}
    </nav>
  )
}