import '../css/footer.css'
import { Link, useLocation } from 'react-router-dom'

export default function Footer() {
  const { pathname } = useLocation()

  return (
    <nav className="footer">
      <Link to="/" className={`footer-item ${pathname === '/' ? 'activo' : ''}`}>
        <img src="../../../cliente/public/assets/img/home.png"  alt="Inicio" className="footer-icono" />
        <span>Inicio</span>
      </Link>

      <Link to="/adoptante/buscar" className={`footer-item ${pathname.includes('buscar') ? 'activo' : ''}`}>
        <img src="../../../cliente/public/assets/img/lupa.png" alt="Buscar" className="footer-icono" />
        <span>Buscar</span>
      </Link>

      <Link to="/adoptante/mapa" className={`footer-item footer-central ${pathname.includes('mapa') ? 'activo' : ''}`}>
        <img src="../../../cliente/public/assets/img/mapa.png" alt="Mapa" className="footer-icono" />
      </Link>

      <Link to="/adoptante/eventos" className={`footer-item ${pathname.includes('eventos') ? 'activo' : ''}`}>
        <img src="../../../cliente/public/assets/img/calendario.png"  alt="Eventos" className="footer-icono" />
        <span>Eventos</span>
      </Link>

      <Link to="/adoptante/perfil" className={`footer-item ${pathname.includes('perfil') ? 'activo' : ''}`}>
        <img src="../../../cliente/public/assets/img/perfil.png"  alt="Perfil" className="footer-icono" />
        <span>Perfil</span>
      </Link>
    </nav>
  )
}
