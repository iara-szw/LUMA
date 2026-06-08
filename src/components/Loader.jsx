import React from 'react'
import '../styles/loader.css'

export default function Loader() {
  return (
    <div className="loader-dots" role="status" aria-label="Cargando">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  )
}
