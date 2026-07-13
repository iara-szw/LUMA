import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usarAuth } from '../../hooks/UsarAuth'
import { actualizarRefugio, obtenerRefugio } from '../../repositories/perfilRefugioRepository'
import { subirAvatar } from '../../repositories/storageRepository'
import '../../styles/editarUsuario.css'

export default function EditarRefugio() {
  const navigate = useNavigate();
  const { refrescarUsuario, usuario } = usarAuth();
  const [loading, setLoading] = useState(false);
  const [refugio, setRefugio] = useState(null);

  const [logoArchivo, setLogoArchivo] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);

  const [portadaArchivo, setPortadaArchivo] = useState(null);
  const [previewPortada, setPreviewPortada] = useState(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [voluntarios, setVoluntarios]=useState('')
  const [instagram, setInstagram] = useState('');

  const obtenerDatos = async () => {
    setLoading(true);
    try {
      const [refugioRes] = await Promise.all([
        obtenerRefugio(usuario.id),
      ]);
      setRefugio(refugioRes?.data || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usuario?.id) {
      obtenerDatos();
    }
  }, [usuario?.id]);

  // ✅ Sincronizar estados cuando se cargue el refugio
  useEffect(() => {
    if (refugio) {
      setNombre(refugio.nombre || '');
      setDescripcion(refugio.descripcion || '');
      setTelefono(refugio.telefono || '');
      setDireccion(refugio.direccion || '');
      setCiudad(refugio.ciudad || '');
      setProvincia(refugio.provincia || '');
      setVoluntarios(refugio.cantidad_voluntarios || '')
      setInstagram(refugio.instagram || '');
      setPreviewLogo(refugio.logo_url || null);
      setPreviewPortada(refugio.portada_url || refugio.foto_portada_url || null);
    }
  }, [refugio]);

  async function guardarCambios(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = null;
      let portadaUrl = null;

      if (logoArchivo) {
        const { url, error } = await subirAvatar(usuario.id, logoArchivo);
        if (error) {
          alert('No se pudo subir el logo. Intenta de nuevo.');
          setLoading(false);
          return;
        }
        logoUrl = url;
      }

      if (portadaArchivo) {
        const { url, error } = await subirAvatar(usuario.id, portadaArchivo);
        if (error) {
          alert('No se pudo subir la foto de portada. Intenta de nuevo.');
          setLoading(false);
          return;
        }
        portadaUrl = url;
      }

      const payload = { nombre, descripcion, telefono, direccion, ciudad, provincia,voluntarios, instagram };
      if (logoUrl) payload.logo_url = logoUrl;
      if (portadaUrl) payload.portada_url = portadaUrl;

      const { error } = await actualizarRefugio(usuario.id, payload);

      if (error) {
        alert(error.message || 'Error al actualizar perfil');
      } else {
        await refrescarUsuario();
        navigate('/refugio/perfil');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pagina-editar">
      <header className="perfil-header">
        <button onClick={() => navigate(-1)}>← Editar perfil</button>
      </header>

      <form onSubmit={guardarCambios}>
        {/* Logo */}
        <div className="foto-campo">
          <label>Logo</label>
          <div className="foto-preview" onClick={() => document.getElementById('logo-input').click()}>
            {previewLogo ? (
              <img src={previewLogo} alt="preview" />
            ) : (
              <div className="placeholder">Agregar logo</div>
            )}
          </div>
          <input id="logo-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setLogoArchivo(f);
            setPreviewLogo(URL.createObjectURL(f));
          }} />
        </div>

        {/* Portada */}
        <div className="foto-campo">
          <label>Foto de portada</label>
          <div className="foto-preview" onClick={() => document.getElementById('portada-input').click()}>
            {previewPortada ? (
              <img src={previewPortada} alt="preview" />
            ) : (
              <div className="placeholder">Agregar portada</div>
            )}
          </div>
          <input id="portada-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setPortadaArchivo(f);
            setPreviewPortada(URL.createObjectURL(f));
          }} />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="text" value={usuario?.email || ''} disabled />
        </div>

        {/* Campos de texto */}
        <div>
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div>
          <label htmlFor="descripcion">Descripción</label>
          <textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>

        <div>
          <label htmlFor="telefono">Teléfono</label>
          <input id="telefono" type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
        </div>

        <div>
          <label htmlFor="direccion">Dirección</label>
          <input id="direccion" type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        </div>

        <div>
          <label htmlFor="ciudad">Ciudad</label>
          <input id="ciudad" type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </div>

        <div>
          <label htmlFor="provincia">Provincia</label>
          <input id="provincia" type="text" value={provincia} onChange={(e) => setProvincia(e.target.value)} />
        </div>

        <div>
          <label htmlFor="instagram">Instagram</label>
          <input id="instagram" type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </div>
        <div>
          <label htmlFor="voluntarios">Cant.Voluntarios</label>
          <input id="voluntarios" type="number" value={voluntarios} onChange={(e) => setVoluntarios(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
