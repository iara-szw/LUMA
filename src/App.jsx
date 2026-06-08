import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProveedorAuth } from './contexts/ContextoAuth.jsx'
import {usarAuth} from './hooks/UsarAuth.jsx'
import Loader from './components/Loader.jsx'
import Home from './pages/Home'
import Perfil from './pages/adoptante/Perfil.jsx'
import IniciarSesion from './pages/auth/InicioSesion'
import EditarPerfil from './pages/adoptante/editarUsuario.jsx'
import Registro from './pages/auth/Registro'

function RutaProtegida({ children, rol }) {
  const { usuario, cargando, esAdoptante, esRefugio } = usarAuth()

  if (cargando) return <Loader />
  if (!usuario) return <Navigate to="/login" replace />
  if (rol === 'adoptante' && !esAdoptante) return <Navigate to="/login" replace />
  if (rol === 'refugio' && !esRefugio) return <Navigate to="/login" replace />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<IniciarSesion />} />
          <Route path="/registro" element={<Registro />} />

          <Route
            path="/dashboard"
            element={
              <RutaProtegida rol="refugio">
                <div className="pagina-dashboard">
                  <h1>Panel del refugio</h1>
                  <p>Bienvenido al dashboard.</p>
                  <a href="/">Volver al inicio</a>
                </div>
              </RutaProtegida>
            }
          />
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
