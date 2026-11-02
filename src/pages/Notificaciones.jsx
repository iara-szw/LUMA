import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { usarAuth } from '../hooks/UsarAuth'
import { obtenerNotisPorUsur, marcarNotiLeida, marcarTodasComoLeidas, borrarNotificacion } from '../repositories/notificacionesRepository'
import '../styles/style.css'
import Footer from '../components/Footer'
import ConfirmModal from '../components/ConfirmModal'
import FooterRefugio from '../components/FooterRefugio'
import '../styles/notificaciones.css'
export default function Notificaciones() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRefugio = location.pathname.startsWith('/refugio')
  const [notis, setNotis] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modalConfirmacion, setModalConfirmacion] = useState({ isOpen: false, id: null })
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const { usuario, esRefugio } = usarAuth() 

  const getFechaMs = (fecha) => {
    if (!fecha) return 0

    let d = new Date(fecha)
    if (Number.isNaN(d.getTime()) && typeof fecha === 'string') {
      d = new Date(fecha.replace(' ', 'T'))
    }

    return Number.isNaN(d.getTime()) ? 0 : d.getTime()
  }

  const notisOrdenadas = [...notis].sort((a, b) => getFechaMs(b.fecha) - getFechaMs(a.fecha))
  const notisVisibles = mostrarTodas ? notisOrdenadas : notisOrdenadas.slice(0, 3)
  const hayMas = notisOrdenadas.length > 3

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
        const ordenadas = [...(data || [])].sort((a, b) => getFechaMs(b.fecha) - getFechaMs(a.fecha))
        setNotis(ordenadas)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => { activo = false }
  }, [usuario])

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return ''

    let fecha = new Date(fechaStr)

    if (Number.isNaN(fecha.getTime()) && typeof fechaStr === 'string') {
      fecha = new Date(fechaStr.replace(' ', 'T'))
    }

    if (Number.isNaN(fecha.getTime())) return ''

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(fecha)
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

  const handleBorrarNotificacion = async (id) => {
    if (!usuario?.id) return

    const { error } = await borrarNotificacion(id)
    if (!error) {
      setNotis(prev => prev.filter(n => n.id !== id))
      window.dispatchEvent(new Event('luma:noti-actualizada'))
    } else {
      console.error('Error al eliminar la notificación:', error)
    }
  }

  const handleBorrarTodasNotificaciones = async () => {
    if (!usuario?.id || notisOrdenadas.length === 0) return

    const { error } = await Promise.all(
      notisOrdenadas.map(n => borrarNotificacion(n.id))
    ).then(() => ({ error: null })).catch(err => ({ error: err }))

    if (!error) {
      setNotis([])
      setMostrarTodas(false)
      window.dispatchEvent(new Event('luma:noti-actualizada'))
    } else {
      console.error('Error al eliminar todas las notificaciones:', error)
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            {notis.length > 0 && (
              <button
                className="btn-formulario ghost"
                type="button"
                onClick={handleBorrarTodasNotificaciones}
                style={{ padding: '8px 12px', fontSize: 14 }}
              >
                Eliminar todas
              </button>
            )}
          </div>
        </div>

        <div className="noti-lista">
          {cargando ? (
            <p className="vacio">Cargando notificaciones...</p>
          ) : notisOrdenadas.length === 0 ? (
            <p className="vacio">No hay notificaciones.</p>
          ) : (
            <>
              {notisVisibles.map(n => {
                const remitente = nombreEmisor(n.emisor)
                const clickeable = !!(n.link || n.conversacion_id)
                const esAdopcion = /adopci[oó]n/i.test(`${n.titulo || ''} ${n.mensaje || ''}`)
                const etiqueta = esAdopcion ? 'Adopción' : 'Nuevo mensaje'
                return (
                  <article
                    key={n.id}
                    className={`noti-item ${n.leida ? 'leida' : 'noleida'} ${clickeable ? 'clickeable' : ''}`}
                    onClick={() => abrirNoti(n)}
                    role={clickeable ? 'button' : undefined}
                    tabIndex={clickeable ? 0 : undefined}
                    onKeyDown={e => { if (clickeable && e.key === 'Enter') abrirNoti(n) }}
                  >
                    <div className="noti-header-row">
                      <span className={`noti-etiqueta ${esAdopcion ? 'noti-etiqueta--adopcion' : 'noti-etiqueta--mensaje'}`}>
                        {etiqueta}
                      </span>
                    </div>
                    {n.titulo && <h4>{n.titulo}</h4>}
                    {remitente && <span className="noti-remitente">De: {remitente}</span>}
                    {n.mensaje && <p>{n.mensaje}</p>}
                    <time className="noti-fecha">{formatearFecha(n.fecha)}</time>
                    <button className="btn-borrar" onClick={(e) => { e.stopPropagation(); setModalConfirmacion({ isOpen: true, id: n.id }) }}>
Borrar                  </button>
                  </article>
                )
              })}

              {hayMas && (
                <button
                  type="button"
                  className="btn-ver-todos"
                  onClick={() => setMostrarTodas(v => !v)}
                  style={{ alignSelf: 'center', marginTop: 10 }}
                >
                  {mostrarTodas ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </>
          )}
        </div>
      </main>
         {esRefugio ? <FooterRefugio /> : <Footer />}
   

      <ConfirmModal
        isOpen={modalConfirmacion.isOpen}
        title="Eliminar notificación"
        message="¿Estás seguro que querés eliminar esta notificación?"
        confirmText="Eliminar"
        onConfirm={() => handleBorrarNotificacion(modalConfirmacion.id)}
        onCancel={() => setModalConfirmacion({ isOpen: false, id: null })}
      />
    </div>
  )
}