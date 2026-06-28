import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import { obtenerPerros, obtenerGatos } from '../../repositories/mascotaRepository'
import { obtenerRefugios } from '../../repositories/refugioRepository'
import '../../styles/style.css'

const filtros = [
  { key: 'todos',    label: 'Todos' },
  { key: 'perros',   label: 'Perros 🐶' },
  { key: 'gatos',    label: 'Gatos 😸' },
  { key: 'refugios', label: 'Refugios' },
]

function TarjetaMascota({ animal, onClick }) {
  return (
    <div className="exp-card" onClick={onClick}>
      {animal.urgente && <span className="exp-urgente">URGENTE</span>}
      <button className="exp-fav" onClick={e => e.stopPropagation()}>♡</button>
      <img src={animal.foto_url} alt={animal.nombre} className="exp-card-img" />
      <p className="exp-card-nombre">{animal.nombre}</p>
      <p className="exp-card-info">
        {animal.tipo}{animal.edad ? ` • ${animal.edad}` : ''}
      </p>
    </div>
  )
}

function Seccion({ titulo, animales, onVerMas, onClickAnimal }) {
  if (!animales.length) return null
  return (
    <section className="exp-seccion">
      <div className="exp-seccion-header">
        <h3 className="exp-seccion-titulo">{titulo}</h3>
        <button className="exp-ver-mas" onClick={onVerMas}>Ver más</button>
      </div>
      <div className="exp-scroll">
        {animales.map(a => (
          <TarjetaMascota key={a.id} animal={a} onClick={() => onClickAnimal(a)} />
        ))}
      </div>
    </section>
  )
}

export default function Explorar() {
  const navigate = useNavigate()
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [datos, setDatos] = useState({ perros: [], gatos: [], refugios: [] })
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    const obtenerDatos = async () => {
      const [{ data: perros }, { data: gatos }, { data: refugios }] = await Promise.all([
        obtenerPerros(),
        obtenerGatos(),
        obtenerRefugios(),
      ])
      setDatos({ perros: perros || [], gatos: gatos || [], refugios: refugios || [] })
    }
    obtenerDatos()
  }, [])

  const mostrarPerros   = filtroActivo === 'todos' || filtroActivo === 'perros'
  const mostrarGatos    = filtroActivo === 'todos' || filtroActivo === 'gatos'
  const mostrarRefugios = filtroActivo === 'todos' || filtroActivo === 'refugios'

  return (
    <div className="exp-pagina">
     
      {/* FILTROS */}
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

      {/* SECCIONES */}
      {mostrarPerros && (
        <Seccion
          titulo="Perros"
          animales={datos.perros}
          onVerMas={() => setFiltroActivo('perros')}
          onClickAnimal={a => navigate(`/mascota/${a.id}`)}
        />
      )}
      {mostrarGatos && (
        <Seccion
          titulo="Gatos"
          animales={datos.gatos}
          onVerMas={() => setFiltroActivo('gatos')}
          onClickAnimal={a => navigate(`/mascota/${a.id}`)}
        />
      )}
      {mostrarRefugios && (
        <Seccion
          titulo="Refugios"
          animales={datos.refugios}
          onVerMas={() => setFiltroActivo('refugios')}
          onClickAnimal={a => navigate(`/refugio/${a.id}`)}
        />
      )}

      <Footer />
    </div>
  )
}
