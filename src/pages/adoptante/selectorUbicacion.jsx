import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const iconoPin = L.divIcon({
  className: 'mapa-pin',
  html: '<span>🐾</span>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

const CENTRO_DEFAULT = [-34.6037, -58.3816]

function ClickParaElegir({ onElegir }) {
  useMapEvents({ click: (e) => onElegir(e.latlng.lat, e.latlng.lng) })
  return null
}

function Volar({ punto }) {
  const map = useMap()
  useEffect(() => {
    if (punto) map.flyTo(punto, 16)
  }, [punto, map])
  return null
}

/**
 * Uso (en el editar perfil del refugio):
 * <SelectorUbicacion
 *   valor={{ latitud, longitud }}
 *   direccionInicial={direccion}
 *   onChange={({ latitud, longitud, direccion }) => { ... }}
 * />
 */
export default function SelectorUbicacion({ valor, direccionInicial = '', onChange }) {
  const [direccion, setDireccion] = useState(direccionInicial)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState(null)
  const [foco, setFoco] = useState(null)

  const tienePunto = valor?.latitud != null && valor?.longitud != null
  const centro = tienePunto ? [valor.latitud, valor.longitud] : CENTRO_DEFAULT

  const buscar = async () => {
    if (!direccion.trim()) return
    setBuscando(true)
    setError(null)
    try {
      // Nominatim (OpenStreetMap): gratis, ~1 consulta por segundo. Acá limitado a Argentina.
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(direccion)}`
      const res = await fetch(url)
      const json = await res.json()
      if (!json.length) {
        setError('No encontramos esa dirección. Probá con calle, número y ciudad, o marcá el punto en el mapa.')
        return
      }
      const lat = parseFloat(json[0].lat)
      const lng = parseFloat(json[0].lon)
      onChange({ latitud: lat, longitud: lng, direccion })
      setFoco([lat, lng])
    } catch {
      setError('No se pudo buscar la dirección. Intentá de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="selector-ubicacion">
      <div className="selector-ubicacion-busqueda">
        <input
          type="text"
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); buscar() } }}
          placeholder="Calle, número y ciudad"
        />
        <button type="button" onClick={buscar} disabled={buscando}>
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {error && <p className="selector-ubicacion-error">{error}</p>}

      <div className="selector-ubicacion-mapa">
        <MapContainer center={centro} zoom={tienePunto ? 16 : 12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Volar punto={foco} />
          <ClickParaElegir
            onElegir={(lat, lng) => onChange({ latitud: lat, longitud: lng, direccion })}
          />
          {tienePunto && <Marker position={[valor.latitud, valor.longitud]} icon={iconoPin} />}
        </MapContainer>
      </div>

      <p className="selector-ubicacion-ayuda">Buscá la dirección o tocá el mapa para ajustar el pin.</p>
    </div>
  )
}