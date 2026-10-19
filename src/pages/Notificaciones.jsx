import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import { obtenerNotisPorUsur } from '../repositories/notificacionesRepository'
import '../styles/style.css'
import Footer from '../components/Footer'

import '../styles/notificaciones.css'
import NotiBadge from '../components/NotiBadge'
export default function Notificaciones() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRefugio = location.pathname.startsWith('/refugio')
  const { usuario } = usarAuth()
  const [notis, setNotis] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      if (!usuario?.id) {
        setCargando(false)
        return
      }
      try {
        const { data, error } = await obtenerNotisPorUsur(usuario.id)
            console.log(data)

        if (!activo) return
        setNotis(data || [])
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [usuario])

  const formatearFecha = (fechaStr) => {
    try {
      return new Date(fechaStr).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'long', year: 'numeric' })
    } catch (e) {
      return ''
    }
  }

  return (
    <div className="pagina-notificaciones">
      <header className="inicio-header">
        <Link to="/" className="logo"><img src="/assets/img/logo.png" alt="" /></Link>
        <div className="inicio-header-iconos">
          <button className="icono-campana" aria-label="Notificaciones" onClick={() => navigate(isRefugio ? '/refugio/notificaciones' : '/notificaciones')}>
            <img src="/assets/img/notificaciones.png" alt="" />
          </button>
          <img
            className="avatar"
            src={usuario?.foto_url || '/assets/img/perfil_default.jpg'}
            alt="perfil"
            onClick={() => navigate(isRefugio ? '/refugio/perfil' : '/adoptante/perfil')}
          />
          
        </div>
      </header>

      <main className="notis-seccion">
        <div className="notis">
          <h1>Notificaciones</h1>
        </div>


        <div className="noti-lista">
          {cargando ? (
            <p className="vacio">Cargando notificaciones...</p>
          ) : notis.length === 0 ? (
            <p className="vacio">No hay notificaciones.</p>
          ) : (
            notis.map(n => (
              <article key={n.id} className={`noti-item ${n.leida ? 'leida' : 'noleida'}`}>
                {n.titulo && <h4>{n.titulo}</h4>}
                {n.mensaje && <p>{n.mensaje}</p>}
                <time className="noti-fecha">{formatearFecha(n.fecha)}</time>
              </article>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
