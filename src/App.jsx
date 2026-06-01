import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProveedorAuth } from './contexto/ContextoAuth.jsx'
import {usarAuth} from './contexto/UsarAuth.jsx'
import Home from './paginas/Home'
import Perfil from './paginas/adoptante/Perfil.jsx'
import IniciarSesion from './paginas/auth/InicioSesion'
import EditarPerfil from './paginas/adoptante/editarUsuario.jsx'
import Registro from './paginas/auth/Registro'

function RutaProtegida({ children }) {
  const { usuario, cargando } = usarAuth()

  if (cargando) return <div className="pantalla-carga">Cargando...</div>
  if (!usuario) return <Navigate to="/login" replace />

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
              <RutaProtegida>
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
    <RutaProtegida>
      <Perfil></Perfil>
    </RutaProtegida>
  }
/>
<Route
  path="/adoptante/editarUsuario"
  element={
    <RutaProtegida>
      <EditarPerfil></EditarPerfil>
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
