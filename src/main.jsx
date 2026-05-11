import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './paginas/adoptante/Index.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
