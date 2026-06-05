function Header(){

return(
      <header className="inicio-header">
        <span className="logo">LUMA</span>
        <div className="inicio-header-iconos">
          <button className="icono-campana" aria-label="Notificaciones">🔔</button>
          <img
            className="avatar"
            src="/assets/avatar-placeholder.png"
            alt="perfil"
            onClick={() => navigate('/adoptante/perfil')}
          />
        </div>
      </header>

)
}
export default Header
