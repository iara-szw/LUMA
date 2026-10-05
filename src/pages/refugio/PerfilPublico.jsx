import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../../components/Loader'
import { usarAuth } from '../../hooks/UsarAuth'
import { obtenerOCrearConversacion } from '../../repositories/chatRepository'
import { obtenerMascotasDeRefugio, obtenerRefugio } from '../../repositories/perfilRefugioRepository'
import '../../styles/perfilRefugio.css'

export default function PerfilPublicoRefugio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, esRefugio } = usarAuth()
  const [refugio, setRefugio] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [iniciandoChat, setIniciandoChat] = useState(false)

  useEffect(() => {
    let activo = true

    const cargarDatos = async () => {
      try {
        const [refugioRes, mascotasRes] = await Promise.all([
          obtenerRefugio(id),
          obtenerMascotasDeRefugio(id),
        ])

        if (!activo) return

        setRefugio(refugioRes?.data || null)
        setMascotas(mascotasRes?.data || [])
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarDatos()
    return () => { activo = false }
  }, [id])

  const handleIniciarConversacion = async () => {
    if (!usuario) {
      return navigate('/login')
    }

    if (esRefugio) {
      return
    }

    if (!id || !usuario?.id) return

    setIniciandoChat(true)
    try {
      const { data, error } = await obtenerOCrearConversacion(id, usuario.id)

      if (error) {
        console.error('Error creando/abriendo conversación:', error)
        return
      }

      if (data) navigate(`/adoptante/chats/${data.id}`)
    } finally {
      setIniciandoChat(false)
    }
  }

  const fallbackAvatar = '/assets/img/perfil_default.jpg'

  const resolverFotoUsuario = (usuarioActual) => {
    const fallback = '/assets/img/perfil_default.jpg'
    if (!usuarioActual) return fallback

    const valor = usuarioActual.foto_url
    if (typeof valor !== 'string') return fallback

    const limpio = valor.trim()
    if (!limpio || limpio === 'null' || limpio === 'undefined') return fallback

    return limpio
  }

  const avatarRefugio = resolverFotoUsuario(refugio)

  const handleImageError = (event) => {
    event.currentTarget.src = '/assets/img/perfil_default.jpg'
    event.currentTarget.onerror = null
  }

  if (cargando) return <Loader />

  if (!refugio) {
    return (
      <div className="pagina-perfil-refugio">
        <header className="perfil-refugio-header">
          <button type="button" onClick={() => navigate(-1)}>←</button>
        </header>
        <div className="seccion-refugio" style={{ marginTop: '80px' }}>
          <h3 className="seccion-refugio-titulo">Refugio no encontrado</h3>
          <p className="sobre-nosotros-texto">No pudimos cargar este perfil.</p>
        </div>
      </div>
    )
  }

  const ubicacion = [refugio.ciudad, refugio.provincia].filter(Boolean).join(', ') || refugio.direccion || 'Ubicación no disponible'

  return (
    <div className="pagina-perfil-refugio">
      <header className="perfil-refugio-header">
        <button type="button" onClick={() => navigate(-1)}>←</button>
      </header>

      <div className="perfil-refugio-portada">
        <img
          src={refugio.portada_url || '/assets/img/refugio_default.jpg'}
          alt={refugio.nombre || 'Refugio'}
        />
        <div className="perfil-refugio-avatar">
          <img
            src={avatarRefugio}
            alt={refugio.nombre || 'Logo del refugio'}
            onError={handleImageError}
          />
        </div>
      </div>

      <section className="perfil-refugio-info">
        <h2>{refugio.nombre || 'Refugio'}</h2>
        <p className="perfil-refugio-ubicacion">
          📍 {ubicacion}
        </p>
{!esRefugio && (
  <button
    type="button"
    onClick={handleIniciarConversacion}
    disabled={iniciandoChat}
    style={{
      marginTop: '16px',
      background: 'var(--dash-bg)',
      color: 'var(--arena-hover)',
      borderWidth: 'medium',
      borderStyle: 'none',
      borderColor: 'var(--arena-hover)',
      borderImage: 'none',
      border: '1px solid var(--arena-hover)',
      borderRadius: '20px',
      padding: '10px 18px',
      fontWeight: '600',
      cursor: 'pointer',
    }}
  >
    {iniciandoChat ? 'Abriendo chat...' : 'Iniciar conversación'}
  </button>
)}
      </section>

      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Sobre nosotros</h3>
        <p className="sobre-nosotros-texto">
          {refugio.descripcion || 'Este refugio todavía no agregó una descripción.'}
        </p>
      </section>

      <section className="seccion-refugio">
        <h3 className="seccion-refugio-titulo">Mascotas en adopción</h3>
        {mascotas.length === 0 ? (
          <p className="sobre-nosotros-texto">Todavía no publicaron mascotas disponibles.</p>
        ) : (
          <div className="scroll-horizontal-refugio">
            {mascotas.map(m => (
              <article
                key={m.id}
                className="tarjeta-mascota-refugio"
                onClick={() => navigate(`/mascota/${m.id}`)}
              >
                <img src={m.foto_url || '/assets/img/perfil_default.jpg'} alt={m.nombre} />
                <div style={{ padding: '8px 10px' }}>
                  <strong style={{ display: 'block', fontSize: '13px', color: '#2c2c2a' }}>{m.nombre}</strong>
                  <span style={{ fontSize: '12px', color: '#6b6b68' }}>{m.edad || 'Edad no cargada'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
