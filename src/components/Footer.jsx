import '../styles/footer.css'
import { Link, useLocation } from 'react-router-dom'

export default function Footer() {
  const { pathname } = useLocation()
  const esRefugio = pathname.startsWith('/refugio')
  const rutaHome = esRefugio ? '/refugio/dashboard' : '/'
  const rutaChat = esRefugio ? '/refugio/chats' : '/adoptante/chats'
  const rutaPerfil = esRefugio ? '/refugio/perfil' : '/adoptante/perfil'

  return (
    <nav className="footer">
      <Link to={rutaHome} className={`footer-item ${pathname === '/' || pathname.startsWith('/refugio/dashboard') ? 'activo' : ''}`}>
        <img src="/assets/img/home.png" alt="Inicio" className="footer-icono" />
        <span>Inicio</span>
      </Link>

      <Link to={esRefugio ? '/refugio/mascotas' : '/adoptante/buscar'} className={`footer-item ${pathname.includes('buscar') || pathname.includes('mascotas') ? 'activo' : ''}`}>
        <img src="/assets/img/lupa.png" alt="Buscar" className="footer-icono" />
        <span>Buscar</span>
      </Link>

      <Link to={esRefugio ? '/refugio/dashboard' : '/adoptante/mapa'} className={`footer-item footer-central ${pathname.includes('mapa') || pathname.startsWith('/refugio/dashboard') ? 'activo' : ''}`}>
        <img src="/assets/img/mapa.png" alt="Mapa" className="footer-icono" />
      </Link>

      <Link to={rutaChat} className={`footer-item ${pathname.includes('chats') ? 'activo' : ''}`}>
        <img src="/assets/img/chat.png" alt="Chat" className="footer-icono" />
        <span>Chat</span>
      </Link>

      <Link to={rutaPerfil} className={`footer-item ${pathname.includes('perfil') ? 'activo' : ''}`}>
        <img src="/assets/img/perfil.png" alt="Perfil" className="footer-icono" />
        <span>Perfil</span>
      </Link>
    </nav>
  )
}
