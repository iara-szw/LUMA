import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import { obtenerNotisPorUsur, marcarNotiLeida, marcarTodasComoLeidas } from '../repositories/notificacionesRepository'
import '../styles/style.css'
import Footer from '../components/Footer'

import '../styles/notificaciones.css'
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
        if (error) console.error(error)

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

  const nombreEmisor = (e) => {
    if (!e) return null
    const refugio = Array.isArray(e.refugios) ? e.refugios[0] : e.refugios
    return refugio?.nombre || [e.nombre, e.apellido].filter(Boolean).join(' ')
  }

  const abrirNoti = async (n) => {
    if (!n.leida) {
      setNotis(prev => prev.map(x => x.id === n.id ? { ...x, leida: true } : x))
      await marcarNotiLeida(n.id)
      window.dispatchEvent(new Event('luma:noti-actualizada'))
    }

    if (n.link) {
      navigate(n.link)
      return
    }

    if (!n.conversacion_id) return

    navigate(isRefugio
      ? `/refugio/chats/${n.conversacion_id}`
      : `/adoptante/chats/${n.conversacion_id}`)
  }

  const marcarTodasLeidas = async () => {
    if (!usuario?.id) return

    const { error } = await marcarTodasComoLeidas(usuario.id)
    if (!error) {
      setNotis(prev => prev.map(n => ({ ...n, leida: true })))
      window.dispatchEvent(new Event('luma:noti-actualizada'))
    } else {
      console.error('Error al marcar notificaciones como leídas:', error)
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
        <div className="notis" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1>Notificaciones</h1>
          {notis.some(n => !n.leida) && (
            <button
              className="btn-formulario ghost"
              type="button"
              onClick={marcarTodasLeidas}
              style={{ padding: '8px 12px', fontSize: 14 }}
            >
              Marcar leídas
            </button>
          )}
        </div>

        <div className="noti-lista">
          {cargando ? (
            <p className="vacio">Cargando notificaciones...</p>
          ) : notis.length === 0 ? (
            <p className="vacio">No hay notificaciones.</p>
          ) : (
            notis.map(n => {
              const remitente = nombreEmisor(n.emisor)
              const clickeable = !!(n.link || n.conversacion_id)
              return (
                <article
                  key={n.id}
                  className={`noti-item ${n.leida ? 'leida' : 'noleida'} ${clickeable ? 'clickeable' : ''}`}
                  onClick={() => abrirNoti(n)}
                  role={clickeable ? 'button' : undefined}
                  tabIndex={clickeable ? 0 : undefined}
                  onKeyDown={e => { if (clickeable && e.key === 'Enter') abrirNoti(n) }}
                >
                  {n.titulo && <h4>{n.titulo}</h4>}
                  {remitente && <span className="noti-remitente">De: {remitente}</span>}
                  {n.mensaje && <p>{n.mensaje}</p>}
                  <time className="noti-fecha">{formatearFecha(n.fecha)}</time>
                </article>
              )
            })
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}