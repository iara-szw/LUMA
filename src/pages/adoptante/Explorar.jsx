import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const imagenMuestra = esRefugio 
    ? (animal.logo_url || animal.foto_url || animal.foto_perfil || '/assets/img/perfil_default.jpg')
    : (animal.foto_url || '/assets/img/perfil_default.jpg')
  
  return (
    <article className="tarjeta-mascota" onClick={onClick}>
      {!esRefugio && (
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
      )}
      {animal.urgente && <span className="badge-urgente">Urgente</span>}
      <img src={imagenMuestra} alt={animal.nombre} />
      <h4>{animal.nombre}</h4>
      <span>{esRefugio ? 'Refugio' : animal.edad || 'Sin edad'}</span>
    </article>
  )
}

function Seccion({ titulo, animales, onVerMas, onClickAnimal, esRefugio = false, favoritos, onToggleFavorito }) {
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
            favoritos={favoritos}
            onToggleFavorito={onToggleFavorito}
            onClick={() => onClickAnimal(a)}
          />
        ))}
      </div>
    </section>
  )
}

export default function Explorar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { usuario } = usarAuth()
  const queryBusqueda = searchParams.get('q') || ''
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [datos, setDatos] = useState({ perros: [], gatos: [], refugios: [] })
  const [favoritos, setFavoritos] = useState(new Set())
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false)

  useEffect(() => {
    const obtenerDatos = async () => {
      const [respPerros, respGatos, respRefugios] = await Promise.all([
        obtenerPerros(),
        obtenerGatos(),
        obtenerRefugios(),
      ])

      setDatos({ 
        perros: respPerros?.data || [], 
        gatos: respGatos?.data || [], 
        refugios: respRefugios?.data || [] 
      })
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
  const avatarUsuario = usuario?.foto_url || usuario?.foto_perfil || '/assets/img/perfil_default.jpg'
  
  // Filtrar por búsqueda
  const filtrarPorBusqueda = (items, esRefugio = false) => {
    if (!queryBusqueda) return items
    const query = queryBusqueda.toLowerCase()
    return items.filter(item => {
      const nombre = item.nombre?.toLowerCase() || ''
      const descripcion = item.descripcion?.toLowerCase() || ''
      const ciudad = item.ciudad?.toLowerCase() || ''
      const provincia = item.provincia?.toLowerCase() || ''
      const refugioNombre = item.refugios?.nombre?.toLowerCase() || ''
      
      return (
        nombre.includes(query) || 
        descripcion.includes(query) || 
        ciudad.includes(query) || 
        provincia.includes(query) ||
        refugioNombre.includes(query)
      )
    })
  }

  const perrosFiltrados = filtrarPorBusqueda(datos.perros)
  const gatosFiltrados = filtrarPorBusqueda(datos.gatos)
  const refugiosFiltrados = filtrarPorBusqueda(datos.refugios, true)

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
              src={avatarUsuario}
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
          animales={perrosFiltrados}
          onVerMas={() => setFiltroActivo('perros')}
          onClickAnimal={a => navigate(`/mascota/${a.id}`)}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      )}

      {mostrarGatos && (
        <Seccion
          titulo="Gatos"
          animales={gatosFiltrados}
          onVerMas={() => setFiltroActivo('gatos')}
          onClickAnimal={a => navigate(`/mascota/${a.id}`)}
          favoritos={favoritos}
          onToggleFavorito={toggleFavorito}
        />
      )}

      {mostrarRefugios && (
        <Seccion
          titulo="Refugios"
          animales={refugiosFiltrados}
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
