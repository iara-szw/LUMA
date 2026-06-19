import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProveedorAuth } from './contexts/ContextoAuth.jsx'
import { usarAuth } from './hooks/UsarAuth.jsx'
import Loader from './components/Loader.jsx'
import Home from './pages/Home'
import Perfil from './pages/adoptante/Perfil.jsx'
import IniciarSesion from './pages/auth/InicioSesion'
import EditarPerfil from './pages/adoptante/editarUsuario.jsx'
import Registro from './pages/auth/Registro'
import Dashboard from './pages/refugio/Dashboard.jsx'
import PerfilRefugio from './pages/refugio/Perfil.jsx'
import CargarMascota from './pages/refugio/CargarMascota.jsx'

function RutaProtegida({ children, rol }) {
  const { usuario, cargando, esAdoptante, esRefugio } = usarAuth()

  if (cargando) return <Loader />
  if (!usuario) return <Navigate to="/login" replace />
  if (rol === 'adoptante' && !esAdoptante) return <Navigate to="/login" replace />
  if (rol === 'refugio' && !esRefugio) return <Navigate to="/login" replace />

  return children
}

// Redirige al usuario según su rol después del login
function RutaInicio() {
  const { usuario, cargando, esRefugio } = usarAuth()

  if (cargando) return <Loader />
  if (usuario && esRefugio) return <Navigate to="/refugio/dashboard" replace />

  return <Home />
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Routes>
          {/* Inicio: muestra Home o redirige a dashboard si es refugio */}
          <Route path="/" element={<RutaInicio />} />

          <Route path="/login" element={<IniciarSesion />} />
          <Route path="/registro" element={<Registro />} />

          {/* Dashboard del refugio */}
          <Route
            path="/refugio/dashboard"
            element={
              <RutaProtegida rol="refugio">
                <Dashboard />
              </RutaProtegida>
            }
          />

          {/* Perfil del refugio */}
          <Route
            path="/refugio/perfil"
            element={
              <RutaProtegida rol="refugio">
                <PerfilRefugio />
              </RutaProtegida>
            }
          />
        <Route
            path="/refugio/dashboard"
            element={
              <RutaProtegida rol="refugio">
                <Dashboard />
              </RutaProtegida>
            }
          />
          <Route
            path="/refugio/cargarMascota"
            element={
              <RutaProtegida rol="refugio">
                <CargarMascota />
              </RutaProtegida>
            }
          />
          {/* Rutas del adoptante */}
          <Route
            path="/adoptante/perfil"
            element={
              <RutaProtegida rol="adoptante">
                <Perfil />
              </RutaProtegida>
            }
          />
          <Route
            path="/adoptante/editarUsuario"
            element={
              <RutaProtegida rol="adoptante">
                <EditarPerfil />
              </RutaProtegida>
            }
          />

          <Route path="/inicio" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProveedorAuth>
    </BrowserRouter>
  )
}