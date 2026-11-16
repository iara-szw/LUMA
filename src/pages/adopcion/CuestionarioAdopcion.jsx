import { useState } from 'react'

const ESTADO_INICIAL = {
  motivacion: '',
  desafio: '',
  vivienda: '',
  propiedad: '',
  horasSola: '',
  acuerdoHogar: '',
  ninos: '',
  otrasMascotas: '',
  gastosVeterinarios: '',
  mudanza: '',
  seguimiento: '',
}

const opcionesVivienda = [
  'Casa con patio cerrado y seguro',
  'Casa sin patio / PH',
  'Departamento con red de protección en balcones/ventanas',
  'Departamento sin red de protección',
]

const opcionesPropiedad = ['Propia', 'Alquilada (Permiso del propietario confirmado)', 'Alquilada (Sin confirmación explícita aún)']
const opcionesHoras = ['Menos de 4 horas', 'Entre 4 y 8 horas', 'Más de 8 horas']
const opcionesAcuerdo = ['Sí, todos están de acuerdo y entusiasmados', 'Hay alguna duda o persona indecisa']
const opcionesNinos = ['Sí (Menores de 5 años)', 'Sí (Entre 6 y 12 años)', 'No hay niños']
const opcionesMascotas = ['Sí, perros', 'Sí, gatos', 'No tengo otras mascotas']
const opcionesGastos = ['Sí, totalmente de acuerdo', 'Tengo dudas sobre los costos']
const opcionesSeguimiento = ['Sí, sin problemas', 'No me interesa / Prefiero privacidad']

export default function CuestionarioAdopcion() {
  const [form, setForm] = useState(ESTADO_INICIAL)
  const [enviado, setEnviado] = useState(false)

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
  }

  const manejarEnvio = (e) => {
    e.preventDefault()
    console.log('Cuestionario de adopción:', form)
    setEnviado(true)
  }

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '1.5rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Cuestionario de Postulación para Adopción</h1>

      <form onSubmit={manejarEnvio}>
        <section style={{ marginBottom: '2rem' }}>
          <h2>1. Motivación y Expectativas</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="motivacion">¿Por qué te interesa adoptar específicamente a esta mascota?</label>
            <textarea
              id="motivacion"
              name="motivacion"
              rows="4"
              value={form.motivacion}
              onChange={e => actualizarCampo('motivacion', e.target.value)}
              style={{ width: '100%', marginTop: '0.5rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="desafio">¿Cuál crees que es el mayor desafío al integrar una nueva mascota a tu hogar?</label>
            <textarea
              id="desafio"
              name="desafio"
              rows="4"
              value={form.desafio}
              onChange={e => actualizarCampo('desafio', e.target.value)}
              style={{ width: '100%', marginTop: '0.5rem', resize: 'vertical' }}
            />
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>2. Estilo de Vida y Espacio</h2>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿Dónde vivís actualmente?</p>
            {opcionesVivienda.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="vivienda"
                  value={opcion}
                  checked={form.vivienda === opcion}
                  onChange={e => actualizarCampo('vivienda', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿La vivienda es propia o alquilada?</p>
            {opcionesPropiedad.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="propiedad"
                  value={opcion}
                  checked={form.propiedad === opcion}
                  onChange={e => actualizarCampo('propiedad', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿Cuántas horas al día la mascota pasará sola en casa?</p>
            {opcionesHoras.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="horasSola"
                  value={opcion}
                  checked={form.horasSola === opcion}
                  onChange={e => actualizarCampo('horasSola', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>3. Convivencia y Núcleo Familiar</h2>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿Todos los miembros de tu hogar están de acuerdo con la adopción?</p>
            {opcionesAcuerdo.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="acuerdoHogar"
                  value={opcion}
                  checked={form.acuerdoHogar === opcion}
                  onChange={e => actualizarCampo('acuerdoHogar', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿Hay niños pequeños conviviendo habitualmente en el hogar?</p>
            {opcionesNinos.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="ninos"
                  value={opcion}
                  checked={form.ninos === opcion}
                  onChange={e => actualizarCampo('ninos', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿Tenés otras mascotas actualmente?</p>
            {opcionesMascotas.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="otrasMascotas"
                  value={opcion}
                  checked={form.otrasMascotas === opcion}
                  onChange={e => actualizarCampo('otrasMascotas', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2>4. Compromiso Económico y Responsabilidad</h2>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿Estás de acuerdo en cubrir los gastos veterinarios periódicos (vacunas, desparasitaciones, alimentación de buena calidad)?</p>
            {opcionesGastos.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="gastosVeterinarios"
                  value={opcion}
                  checked={form.gastosVeterinarios === opcion}
                  onChange={e => actualizarCampo('gastosVeterinarios', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="mudanza">¿Qué harías en caso de mudarte, viajar o sufrir un cambio importante en tu vida?</label>
            <textarea
              id="mudanza"
              name="mudanza"
              rows="4"
              value={form.mudanza}
              onChange={e => actualizarCampo('mudanza', e.target.value)}
              style={{ width: '100%', marginTop: '0.5rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <p>¿Estás dispuesto/a a aceptar un seguimiento post-adopción (visitas o fotos/videos durante los primeros meses)?</p>
            {opcionesSeguimiento.map(opcion => (
              <label key={opcion} style={{ display: 'block', marginBottom: '0.35rem' }}>
                <input
                  type="radio"
                  name="seguimiento"
                  value={opcion}
                  checked={form.seguimiento === opcion}
                  onChange={e => actualizarCampo('seguimiento', e.target.value)}
                />
                {' '}{opcion}
              </label>
            ))}
          </div>
        </section>

        <button
          type="submit"
          style={{
            background: '#2d6cdf',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.8rem 1.2rem',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          Enviar postulación
        </button>

        {enviado && (
          <p style={{ marginTop: '1rem', color: '#1b7f3f', fontWeight: 600 }}>
            Formulario enviado correctamente.
          </p>
        )}
      </form>
    </div>
  )
}
