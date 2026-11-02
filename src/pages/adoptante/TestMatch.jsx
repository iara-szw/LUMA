import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../../components/Footer'
import { Supabase } from '../../services/supabase'
import '../../styles/TestMatch.css'

const PREGUNTAS = [
  {
    id: 'vivienda',
    titulo: '¿Dónde vivís?',
    opciones: [
      { valor: 'depto', etiqueta: 'Departamento', detalle: 'Espacio reducido' },
      { valor: 'casa', etiqueta: 'Casa con patio', detalle: 'Espacio para correr' },
    ],
  },
  {
    id: 'energia',
    titulo: '¿Cómo es tu ritmo de vida?',
    opciones: [
      { valor: 'tranquilo', etiqueta: 'Tranquilo', detalle: 'Casa, sillón y mimos' },
      { valor: 'moderado', etiqueta: 'Moderado', detalle: 'Paseos y juegos de a ratos' },
      { valor: 'activo', etiqueta: 'Activo', detalle: 'Salidas y mucho movimiento' },
    ],
  },
  {
    id: 'tamano',
    titulo: '¿Qué tamaño preferís?',
    opciones: [
      { valor: 'pequeño', etiqueta: 'Pequeño' },
      { valor: 'mediano', etiqueta: 'Mediano' },
      { valor: 'grande', etiqueta: 'Grande' },
      { valor: 'cualquiera', etiqueta: 'Me da igual' },
    ],
  },
  {
    id: 'edad',
    titulo: '¿Qué edad buscás?',
    opciones: [
      { valor: 'cachorro', etiqueta: 'Cachorro', detalle: 'Hasta 1 año' },
      { valor: 'adulto', etiqueta: 'Adulto', detalle: 'De 2 a 7 años' },
      { valor: 'senior', etiqueta: 'Senior', detalle: '8 años o más' },
      { valor: 'cualquiera', etiqueta: 'Me da igual' },
    ],
  },
]

const TAMANOS = ['pequeño', 'mediano', 'grande']
const ENERGIA = { tranquilo: 0, moderado: 1, activo: 2 }

// La columna puede llamarse "tamaño" o "tamano": probamos las dos
const tamanoDe = (m) => String(m['tamaño'] ?? m.tamano ?? '').toLowerCase()

function nivelActividad(m) {
  const a = (m.actividad || 'moderada').toLowerCase()
  if (a.includes('baj')) return 0
  if (a.includes('alt')) return 2
  return 1
}

function categoriaEdad(texto) {
  const t = (texto || '').toLowerCase()
  const n = parseFloat(t)
  if (/d[ií]a|semana|mes/.test(t)) return 'cachorro'
  if (/a[ñn]o/.test(t)) {
    if (isNaN(n)) return null
    if (n <= 1) return 'cachorro'
    if (n >= 8) return 'senior'
    return 'adulto'
  }
  return null
}

// Cada pregunta suma hasta 25 puntos, para un total de 100
function calcularPuntaje(m, r) {
  let total = 0
  const ti = TAMANOS.indexOf(tamanoDe(m))

  // Vivienda
  if (r.vivienda === 'casa') total += 25
  else total += ti === 0 ? 25 : ti === 1 ? 15 : ti === 2 ? 0 : 12

  // Energía
  const dif = Math.abs(nivelActividad(m) - ENERGIA[r.energia])
  total += dif === 0 ? 25 : dif === 1 ? 12 : 0

  // Tamaño
  if (r.tamano === 'cualquiera') total += 25
  else if (ti === -1) total += 12
  else {
    const d = Math.abs(ti - TAMANOS.indexOf(r.tamano))
    total += d === 0 ? 25 : d === 1 ? 12 : 0
  }

  // Edad
  if (r.edad === 'cualquiera') total += 25
  else {
    const c = categoriaEdad(m.edad)
    total += c === null ? 12 : c === r.edad ? 25 : 8
  }

  return total
}

export default function TestMatch() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [resultados, setResultados] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [error, setError] = useState('')

  const pregunta = PREGUNTAS[paso]
  const esUltima = paso === PREGUNTAS.length - 1
  const elegida = respuestas[pregunta.id]

  const calcular = async () => {
    setCalculando(true)
    setError('')

    // select('*') evita fallar si alguna columna se llama distinto
    const { data, error: err } = await Supabase
      .from('mascotas')
      .select('*')

    setCalculando(false)

    if (err) {
      console.error('TestMatch - error de Supabase:', err)
      setError(`No pudimos cargar las mascotas: ${err.message}`)
      return
    }

    const ordenadas = (data || [])
      .map(m => ({ ...m, puntaje: calcularPuntaje(m, respuestas) }))
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, 6)

    setResultados(ordenadas)
  }

  const siguiente = () => {
    if (!elegida) return
    if (esUltima) calcular()
    else setPaso(p => p + 1)
  }

  const reiniciar = () => {
    setRespuestas({})
    setResultados(null)
    setError('')
    setPaso(0)
  }

  return (
    <div className="pagina-test">
      <header className="test-header">
        <button
          type="button"
          className="test-volver"
          aria-label="Volver"
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <div>
          <h2>Test de compatibilidad</h2>
          <p>
            {resultados
              ? 'Estas mascotas son las que mejor encajan con vos.'
              : 'Respondé unas preguntas y te mostramos tu match ideal.'}
          </p>
        </div>
      </header>

      {!resultados ? (
        <section className="test-card">
          <div className="test-progreso" aria-label="Progreso del test">
            {PREGUNTAS.map((p, i) => (
              <span key={p.id} className={`test-progreso-paso ${i <= paso ? 'activo' : ''}`} />
            ))}
          </div>

          <p className="test-contador">Pregunta {paso + 1} de {PREGUNTAS.length}</p>
          <h3>{pregunta.titulo}</h3>

          <div className="test-opciones">
            {pregunta.opciones.map(op => (
              <button
                key={op.valor}
                type="button"
                className={`test-opcion ${elegida === op.valor ? 'activa' : ''}`}
                onClick={() => setRespuestas(prev => ({ ...prev, [pregunta.id]: op.valor }))}
              >
                <strong>{op.etiqueta}</strong>
                {op.detalle && <span>{op.detalle}</span>}
              </button>
            ))}
          </div>

          {error && <div className="test-error">{error}</div>}

          <div className="test-acciones">
            <button
              type="button"
              className="test-btn test-btn--secundario"
              disabled={paso === 0}
              onClick={() => setPaso(p => p - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              className="test-btn test-btn--primario"
              disabled={!elegida || calculando}
              onClick={siguiente}
            >
              {calculando ? 'Calculando...' : esUltima ? 'Ver resultados' : 'Siguiente'}
            </button>
          </div>
        </section>
      ) : (
        <section className="test-resultados">
          {resultados.length === 0 ? (
            <p className="test-vacio">Todavía no hay mascotas para comparar.</p>
          ) : (
            resultados.map(m => (
              <article
                key={m.id}
                className="test-resultado"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/adoptante/mascota/${m.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/adoptante/mascota/${m.id}`)
                  }
                }}
              >
                <img src={m.foto_url || '/assets/img/perfil_default.jpg'} alt={m.nombre} />
                <div className="test-resultado-info">
                  <h4>{m.nombre}</h4>
                  <span>{[m.edad, tamanoDe(m)].filter(Boolean).join(' · ')}</span>
                  <div className="test-barra">
                    <div className="test-barra-relleno" style={{ width: `${m.puntaje}%` }} />
                  </div>
                </div>
                <strong className="test-porcentaje">{m.puntaje}%</strong>
              </article>
            ))
          )}

          <button type="button" className="test-btn test-btn--secundario test-reiniciar" onClick={reiniciar}>
            Repetir test
          </button>
        </section>
      )}

      <Footer />
    </div>
  )
}