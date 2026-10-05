import '../styles/footer.css'
import { Link, useLocation } from 'react-router-dom'
import { usarChat } from '../contexts/ContextoChat.jsx'

export default function Footer() {
  const { pathname } = useLocation()
  const { noLeidos } = usarChat()

  return (
    <nav className="footer">
      <Link to="/" className={`footer-item ${pathname === '/' ? 'activo' : ''}`}>
        <img src="/assets/img/home.png"  alt="Inicio" className="footer-icono" />
        <span>Inicio</span>
      </Link>

      <Link to="/adoptante/buscar" className={`footer-item ${pathname.includes('buscar') ? 'activo' : ''}`}>
        <img src="/assets/img/lupa.png" alt="Buscar" className="footer-icono" />
        <span>Buscar</span>
      </Link>

      <Link to="/adoptante/mapa" className={`footer-item footer-central ${pathname.includes('mapa') ? 'activo' : ''}`}>
        <img src="/assets/img/mapa.png" alt="Mapa" className="footer-icono" />
      </Link>

      <Link to="/adoptante/chats" className={`footer-item ${pathname.includes('chats') ? 'activo' : ''}`}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/assets/img/chat.png" alt="Chats" className="footer-icono" />
          {noLeidos > 0 && (
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
        <span>Chats</span>
      </Link>
      
      <Link to="/adoptante/perfil" className={`footer-item ${pathname.includes('perfil') ? 'activo' : ''}`}>
        <img src="/assets/img/perfil.png"  alt="Perfil" className="footer-icono" />
        <span>Perfil</span>
      </Link>
    </nav>
  )
}
