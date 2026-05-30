import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../servicios/supabase'
import NavBarAdoptante from '../../componentes/navegacion/NavBarAdoptante'
import './Explorar.css'

const datosFalsos = {
  perros: [
    { id: 1, nombre: 'Rocky', tipo: 'Cachorro', edad: '4m', urgente: false, foto_url: 'https://placedog.net/200/200?id=1' },
    { id: 2, nombre: 'Simba', tipo: 'Cachorro', edad: '4m', urgente: true,  foto_url: 'https://placedog.net/200/200?id=2' },
    { id: 3, nombre: 'Toby',  tipo: 'Cachorro', edad: '6m', urgente: false, foto_url: 'https://placedog.net/200/200?id=3' },
  ],
  gatos: [
    { id: 4, nombre: 'Luna',  tipo: 'Gatito', edad: '3m', urgente: true,  foto_url: 'https://placekitten.com/200/200' },
    { id: 5, nombre: 'Michi', tipo: 'Gatito', edad: '6m', urgente: false, foto_url: 'https://placekitten.com/201/200' },
    { id: 6, nombre: 'Nala',  tipo: 'Gatito', edad: '1a', urgente: false, foto_url: 'https://placekitten.com/202/200' },
  ],
  refugios: [
    { id: 7, nombre: 'Patitas Alegres', tipo: 'Refugio', edad: '', urgente: false, foto_url: 'https://placedog.net/200/200?id=5' },
    { id: 8, nombre: 'Amigos Peludos',  tipo: 'Refugio', edad: '', urgente: false, foto_url: 'https://placedog.net/200/200?id=6' },
    { id: 9, nombre: 'Refugio Sur',     tipo: 'Refugio', edad: '', urgente: false, foto_url: 'https://placedog.net/200/200?id=7' },
  ],
}

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
  const [datos, setDatos] = useState(datosFalsos)
  const [busqueda, setBusqueda] = useState('')

  // TODO: descomentar cuando Supabase esté configurado
  // useEffect(() => {
  //   const obtenerDatos = async () => {
  //     const { data: perros } = await supabase
  //       .from('mascotas').select('id, nombre, tipo, edad, foto_url, urgente')
  //       .eq('especie', 'perro').eq('estado', 'activa')
  //     const { data: gatos } = await supabase
  //       .from('mascotas').select('id, nombre, tipo, edad, foto_url, urgente')
  //       .eq('especie', 'gato').eq('estado', 'activa')
  //     const { data: refugios } = await supabase
  //       .from('refugios').select('id, nombre, foto_url')
  //     setDatos({ perros: perros || [], gatos: gatos || [], refugios: refugios || [] })
  //   }
  //   obtenerDatos()
  // }, [])

  const mostrarPerros   = filtroActivo === 'todos' || filtroActivo === 'perros'
  const mostrarGatos    = filtroActivo === 'todos' || filtroActivo === 'gatos'
  const mostrarRefugios = filtroActivo === 'todos' || filtroActivo === 'refugios'

  return (
    <div className="exp-pagina">

      {/* HEADER */}
      <header className="exp-header">
        <h1 className="exp-logo">LUM<span>A</span></h1>
        <div className="exp-header-icons">
          <span className="exp-campana">🔔</span>
          <div className="exp-avatar" />
        </div>
      </header>

      {/* BUSCADOR */}
      <div className="exp-buscador">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Buscar por nombre o refugio..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

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

      <NavBarAdoptante activo="buscar" />
    </div>
  )
}