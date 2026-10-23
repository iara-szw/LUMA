import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { usarAuth } from '../../hooks/UsarAuth'
import Footer from '../../components/Footer'
import FooterRefugio from '../../components/FooterRefugio'
import { Supabase } from '../../services/supabase'
import '../../styles/mapa.css'

// Buenos Aires por defecto; se reemplaza al tocar "Mi ubicación"
const CENTRO_DEFAULT = [-34.6037, -58.3816]

// Pin propio con la paleta LUMA (evita el problema de íconos rotos de Leaflet con Vite/webpack)
const iconoRefugio = L.divIcon({
    className: 'mapa-pin',
    html: '<span><img src="/assets/img/refugio_mapa.png" alt="refugio" /></span>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
})

function VolarA({ destino }) {
    const map = useMap()
    useEffect(() => {
        if (destino) map.flyTo(destino, 14)
    }, [destino, map])
    return null
}

export default function Mapa() {
    const navigate = useNavigate()
    const { esRefugio } = usarAuth()

    const [refugios, setRefugios] = useState([])
    const [cargando, setCargando] = useState(true)
    const [miUbicacion, setMiUbicacion] = useState(null)
    const [destino, setDestino] = useState(null)
    const [aviso, setAviso] = useState(null)

    useEffect(() => {
        let activo = true

        const cargar = async () => {
            const { data, error } = await Supabase
                .from('refugios')
                .select('id, nombre, logo_url, direccion, latitud, longitud')
                .not('latitud', 'is', null)
                .not('longitud', 'is', null)

            if (!activo) return
            if (error) setAviso('No se pudieron cargar los refugios.')
            else setRefugios(data || [])
            setCargando(false)
        }

        cargar()
        return () => { activo = false }
    }, [])

    const ubicarme = () => {
        if (!navigator.geolocation) {
            return setAviso('Tu navegador no permite obtener la ubicación.')
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const punto = [coords.latitude, coords.longitude]
                setMiUbicacion(punto)
                setDestino(punto)
                setAviso(null)
            },
            () => setAviso('No pudimos obtener tu ubicación. Revisá los permisos del navegador.'),
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    return (
        <div className="mapa-pagina">
            <header className="mapa-header">
                <h2 className="mapa-titulo">Refugios cerca tuyo</h2>
                <p className="mapa-subtitulo">
                    {cargando ? 'Cargando...' : `${refugios.length} ${refugios.length === 1 ? 'refugio' : 'refugios'} en el mapa`}
                </p>
            </header>

            <div className="mapa-contenedor">
                <MapContainer center={CENTRO_DEFAULT} zoom={12} className="mapa-leaflet" scrollWheelZoom>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <VolarA destino={destino} />

                    {miUbicacion && (
                        <CircleMarker
                            center={miUbicacion}
                            radius={9}
                            pathOptions={{ color: '#fff', weight: 3, fillColor: '#4a90e2', fillOpacity: 1 }}
                        />
                    )}

                    {refugios.map(r => (
                        <Marker
                            key={r.id}
                            position={[Number(r.latitud), Number(r.longitud)]} // 👈 Agregá Number()
                            icon={iconoRefugio}
                        >
                            <Popup>
                                <div className="mapa-popup">
                                    <img src={r.logo_url || '/assets/img/perfil_default.jpg'} alt="" />
                                    <div>
                                        <h4>{r.nombre}</h4>
                                        {r.direccion && <p>{r.direccion}</p>}
                                    </div>
                                    <button type="button" onClick={() => navigate(`/refugio/${r.id}`)}>
                                        Ver refugio
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {aviso && <div className="mapa-aviso">{aviso}</div>}

                {!cargando && refugios.length === 0 && !aviso && (
                    <div className="mapa-aviso">Todavía no hay refugios cargados en el mapa.</div>
                )}

                <button type="button" className="mapa-btn-ubicacion" onClick={ubicarme} aria-label="Mi ubicación">
                    <img src="/assets/img/ubicacion.png" alt="Ubicación" />
                </button>
            </div>

            {esRefugio ? <FooterRefugio /> : <Footer />}
        </div>
    )
}
