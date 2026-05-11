import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProveedorAuth, usarAuth } from './contexto/ContextoAuth'
import IniciarSesion from './paginas/auth/InicioSesion'
import Registro from './paginas/auth/Registro'

function RutasProtegidas() {
  const { usuario, cargando, esAdoptante, esRefugio } = usarAuth()

  if (cargando) return <div>Cargando...</div>

  if (!usuario) return <Navigate to="/login" replace />

  if (esAdoptante) return <Navigate to="/inicio" replace />
  if (esRefugio)   return <Navigate to="/dashboard" replace />

  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Routes>
          <Route path="/login"    element={<IniciarSesion />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas protegidas — las vas agregando acá */}
          <Route path="/inicio"    element={<RutasProtegidas />} />
          <Route path="/dashboard" element={<RutasProtegidas />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ProveedorAuth>
    </BrowserRouter>
  )
}