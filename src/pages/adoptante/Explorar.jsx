import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import Buscador from '../../components/Buscador'
import { usarAuth } from '../../hooks/UsarAuth'
import { obtenerPerros, obtenerGatos } from '../../repositories/mascotaRepository'
import { obtenerRefugios } from '../../repositories/refugioRepository'
import { agregarFavorito, eliminarFavorito } from '../../repositories/usuarioRepository'
import { obtenerGuardadosDeUsuario } from '../../repositories/perfilRepository'
import '../../styles/home.css'
import '../../styles/style.css'

const filtros = [
  { key: 'todos', label: 'Todos' },
  { key: 'perros', label: 'Perros' },
  { key: 'gatos', label: 'Gatos' },
  { key: 'refugios', label: 'Refugios' },
]

function TarjetaMascota({ animal, onClick, esRefugio = false, favoritos, onToggleFavorito }) {
  return (
    <article className="tarjeta-mascota" onClick={onClick}>
      <button
        type="button"
        className="tarjeta-favorito"
        aria-label={`${favoritos?.has(animal.id) ? 'Remover' : 'Guardar'} ${animal.nombre}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorito?.(animal.id)
        }}
      >
        <img
          src={favoritos?.has(animal.id) ? '/assets/img/corazon-seleccionado.png' : '/assets/img/corazon.png'}
          alt=""
        />
      </button>
      {animal.urgente && <span className="badge-urgente">Urgente</span>}
      <img src={animal.foto_url || '/assets/img/perfil_default.jpg'} alt={animal.nombre} />
      <h4>{animal.nombre}</h4>
      <span>{esRefugio ? 'Refugio' : animal.edad || 'Sin edad'}</span>
    </article>
  )
}

function Seccion({ titulo, animales, onVerMas, onClickAnimal, esRefugio = false }) {
  if (!animales.length) return null

  return (
    <section className="seccion">
      <div className="exp-seccion-header">
        <h3 className="seccion-titulo">{titulo}</h3>
        <button className="exp-ver-mas" onClick={onVerMas}>Ver más</button>
      </div>
      <div className="scroll-horizontal">
        {animales.map(a => (
          <TarjetaMascota
            key={a.id}
            animal={a}
            esRefugio={esRefugio}
            onClick={() => onClickAnimal(a)}
          />
        ))}
      </div>
    </section>
  )
}

export default function Explorar() {
  const navigate = useNavigate()
  const { usuario } = usarAuth()
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [datos, setDatos] = useState({ perros: [], gatos: [], refugios: [] })
  const [favoritos, setFavoritos] = useState(new Set())
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false)

  useEffect(() => {
    const obtenerDatos = async () => {
      const [{ data: perros }, { data: gatos }, { data: refugios }] = await Promise.all([
        obtenerPerros(),
        obtenerGatos(),
        obtenerRefugios(),
      ])

      setDatos({ perros: perros || [], gatos: gatos || [], refugios: refugios || [] })
    }

    const obtenerFavoritos = async () => {
      if (!usuario) return setFavoritos(new Set())
      const guardadosRes = await obtenerGuardadosDeUsuario(usuario.id)
      const ids = new Set((guardadosRes.data || []).map(item => item.mascotas?.id).filter(Boolean))
      setFavoritos(ids)
    }

    obtenerDatos()
    obtenerFavoritos()
  }, [usuario])

  const nombre = usuario?.nombre?.split(' ')[0]
  const mostrarPerros = filtroActivo === 'todos' || filtroActivo === 'perros'

  const toggleFavorito = async (mascotaId) => {
    if (!usuario) return navigate('/login')
    if (cargandoFavoritos) return
    setCargandoFavoritos(true)
    try {
      if (favoritos.has(mascotaId)) {
        const res = await eliminarFavorito(usuario.id, mascotaId)
        if (!res.error) {
          const next = new Set(favoritos)
          next.delete(mascotaId)
          setFavoritos(next)
        }
      } else {
        const res = await agregarFavorito(usuario.id, mascotaId)
        if (!res.error) {
          const next = new Set(favoritos)
          next.add(mascotaId)
          setFavoritos(next)
        }
      }
    } finally {
      setCargandoFavoritos(false)
    }
  }
  const mostrarGatos = filtroActivo === 'todos' || filtroActivo === 'gatos'
  const mostrarRefugios = filtroActivo === 'todos' || filtroActivo === 'refugios'

  return (
    <div className="pagina-inicio exp-pagina">
      <header className="inicio-header">
        <Link to="/" className="logo"><img src="/assets/img/logo.png" alt="LUMA" /></Link>
        <div className="inicio-header-iconos">
                        <button className="icono-campana" aria-label="Notificaciones"><img src="/assets/img/notificaciones.png" />
</button>

          {usuario ? (
            <img
              className="avatar"
              src={usuario.foto_perfil || '/assets/img/perfil_default.jpg'}
              alt="perfil"
              onClick={() => navigate('/adoptante/perfil')}
            />
          ) : (
            <nav className="nav-auth">
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/registro" className="btn-registro">Registrarse</Link>
            </nav>
          )}
        </div>
      </header>

      <div className="inicioDiv">
        <h2 className="saludo">
          {nombre ? `Hola, ${nombre} 🐾` : 'Explorá mascotas 🐾'}
        </h2>

        <Buscador
          placeholder="Buscar por nombre o refugio..."
          onBuscar={(query) => navigate(`/adoptante/buscar?q=${query}`)}
        />
      </div>

      <div className="exp-filtros">
        {filtros.map(f => (
          <button
            key={f.key}
            className={`exp-filtro ${filtroActivo === f.key ? 'activo' : ''}`}
            onClick={() => setFiltroActivo(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {mostrarPerros && (
        <Seccion
          titulo="Perros"
          animales={datos.perros}
          onVerMas={() => setFiltroActivo('perros')}
          onClickAnimal={a => navigate(`/mascota/${a.id}`)}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      )}

      {mostrarGatos && (
        <Seccion
          titulo="Gatos"
          animales={datos.gatos}
          onVerMas={() => setFiltroActivo('gatos')}
          onClickAnimal={a => navigate(`/mascota/${a.id}`)}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      )}

      {mostrarRefugios && (
        <Seccion
          titulo="Refugios"
          animales={datos.refugios}
          onVerMas={() => setFiltroActivo('refugios')}
          onClickAnimal={a => navigate(`/refugio/${a.id}`)}
          esRefugio
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      )}

      <Footer />
    </div>
  )
}
