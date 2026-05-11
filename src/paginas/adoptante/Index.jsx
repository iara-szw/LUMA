
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../servicios/supabase'

import NavBarAdoptante from '../../componentes/navegacion/NavBarAdoptante'
import BannerTestMatch from '../../componentes/inicio/BannerTestMatch'
import Buscador from '../../componentes/comunes/Buscador'
import TarjetaMascota from '../../componentes/mascotas/TarjetaMascota'
import TarjetaEvento from '../../componentes/eventos/TarjetaEvento'
import Header from '../adoptante/Header'
import CargandoSpinner from '../../componentes/comunes/CargandoSpinner'

export default function Inicio() {
  const navigate = useNavigate()
  const [usuario, setUsuario] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const obtenerDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      const { data: mascotasData } = await supabase
        .from('mascotas')
        .select('id, nombre, foto_url, urgente, edad')
        .eq('estado', 'activa')
        .order('creado_en', { ascending: false })
        .limit(10)

      const { data: eventosData } = await supabase
        .from('eventos')
        .select('id, nombre, lugar, fecha, hora')
        .order('fecha', { ascending: true })
        .limit(5)

      setUsuario(perfil)
      setMascotas(mascotasData || [])
      setEventos(eventosData || [])
      setCargando(false)
    }

    obtenerDatos()
  }, [])

  if (cargando) return <CargandoSpinner />

  return (
    <div className="pagina-inicio">
        <Header></Header>

      {/* SALUDO */}
      <h2 className="saludo">
        Hola, {usuario?.nombre?.split(' ')[0]} 🐾
      </h2>

      {/* BUSCADOR — componente: src/componentes/comunes/Buscador.jsx */}
      <Buscador
        placeholder="Buscar por nombre o refugio..."
        onBuscar={(query) => navigate(`/adoptante/buscar?q=${query}`)}
      />

      {/* BANNER TEST DE MATCH — componente: src/componentes/inicio/BannerTestMatch.jsx */}
      <BannerTestMatch onPresionar={() => navigate('/adoptante/test-match')} />

      {/* SECCIÓN EXPLORAR */}
      <section className="seccion">
        <h3 className="seccion-titulo">Explorar</h3>
        <div className="scroll-horizontal">
          {mascotas.map(m => (
            // componente: src/componentes/mascotas/TarjetaMascota.jsx
            <TarjetaMascota
              key={m.id}
              id={m.id}
              nombre={m.nombre}
              foto={m.foto_url}
              urgente={m.urgente}
              edad={m.edad}
              onClick={() => navigate(`/adoptante/mascota/${m.id}`)}
            />
          ))}
        </div>
      </section>

      {/* SECCIÓN EVENTOS */}
      <section className="seccion">
        <h3 className="seccion-titulo">Mis eventos</h3>
        <div className="lista-eventos">
          {eventos.map(e => (
            // componente: src/componentes/eventos/TarjetaEvento.jsx
            <TarjetaEvento
              key={e.id}
              nombre={e.nombre}
              lugar={e.lugar}
              fecha={e.fecha}
              hora={e.hora}
            />
          ))}
        </div>
        <button
          className="btn-ver-todos"
          onClick={() => navigate('/adoptante/eventos')}
        >
          Ver todos
        </button>
      </section>

      {/* NAV BAR — componente: src/componentes/navegacion/NavBarAdoptante.jsx */}
      <NavBarAdoptante activo="inicio" />
    </div>
  )
}