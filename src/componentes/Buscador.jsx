function Buscador({ placeholder, onBuscar }) {
  const [valor, setValor] = useState('')

  const manejarEnter = (e) => {
    if (e.key === 'Enter') onBuscar(valor)
  }

  return (
    <div className="buscador">
      <img src="../cliente/img/lupa.png"></img>
      <input
        type="text"
        placeholder={placeholder}
        value={valor}
        onChange={e => setValor(e.target.value)}
        onKeyDown={manejarEnter}
      />
    </div>
  )
}
export default Buscador;