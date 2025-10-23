import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function RedContactos() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'
  
  const [vistaActual, setVistaActual] = useState(isAdmin ? 'buscar-usuarios' : 'mi-red')
  const [red, setRed] = useState([])
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([])
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')
  
  // Para admin: buscar usuario y ver su red
  const [emailBuscado, setEmailBuscado] = useState('')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [redUsuario, setRedUsuario] = useState([])

  useEffect(() => {
    if (user?.email && !isAdmin) {
      cargarMiRed()
      cargarSolicitudesRecibidas()
      cargarSolicitudesEnviadas()
    }
  }, [user, isAdmin])

  const cargarMiRed = async () => {
    if (!user?.email) return
    
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:8080/red/${user.email}`)
      setRed(res.data.red || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarSolicitudesRecibidas = async () => {
    if (!user?.email) return
    
    try {
      const res = await axios.get(`http://localhost:8080/solicitudes/recibidas/${user.email}`)
      setSolicitudesRecibidas(res.data.solicitudes || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const cargarSolicitudesEnviadas = async () => {
    if (!user?.email) return
    
    try {
      const res = await axios.get(`http://localhost:8080/solicitudes/enviadas/${user.email}`)
      setSolicitudesEnviadas(res.data.solicitudes || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const buscarUsuarios = async () => {
    if (!busqueda || busqueda.length < 2) {
      setResultadosBusqueda([])
      return
    }

    try {
      const res = await axios.get(`http://localhost:8080/usuarios/buscar?q=${busqueda}&email_actual=${user.email}`)
      setResultadosBusqueda(res.data.usuarios || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Error al buscar usuarios')
    }
  }

  const enviarSolicitud = async (destinatarioEmail) => {
    try {
      await axios.post('http://localhost:8080/solicitudes', {
        remitente_email: user.email,
        destinatario_email: destinatarioEmail,
        mensaje: mensaje || null
      })
      
      alert('✅ Solicitud enviada exitosamente')
      setMensaje('')
      buscarUsuarios() // Recargar búsqueda
      cargarSolicitudesEnviadas()
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.detail || 'Error al enviar solicitud')
    }
  }

  const aceptarSolicitud = async (solicitudId) => {
    try {
      await axios.put(`http://localhost:8080/solicitudes/${solicitudId}/aceptar`)
      alert('✅ Solicitud aceptada')
      cargarSolicitudesRecibidas()
      cargarMiRed()
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.detail || 'Error al aceptar solicitud')
    }
  }

  const rechazarSolicitud = async (solicitudId) => {
    if (!confirm('¿Estás seguro de que querés rechazar esta solicitud?')) return
    
    try {
      await axios.put(`http://localhost:8080/solicitudes/${solicitudId}/rechazar`)
      alert('Solicitud rechazada')
      cargarSolicitudesRecibidas()
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.detail || 'Error al rechazar solicitud')
    }
  }

  // Funciones para Admin - Ver red de cualquier usuario
  const buscarUsuarioPorEmail = async () => {
    if (!emailBuscado.trim()) {
      alert('Por favor ingresa un email')
      return
    }
    
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:8080/red/${emailBuscado}`)
      setUsuarioSeleccionado(emailBuscado)
      setRedUsuario(res.data.red || [])
      if (res.data.red.length === 0) {
        alert('Este usuario no tiene contactos en su red')
      }
    } catch (error) {
      console.error('Error:', error)
      alert(error.response?.data?.detail || 'Usuario no encontrado')
      setUsuarioSeleccionado(null)
      setRedUsuario([])
    } finally {
      setLoading(false)
    }
  }

  const getRolIcon = (rol) => {
    const iconos = {
      'admin': '👨‍💼',
      'candidato': '👤',
      'empresa': '🏢'
    }
    return iconos[rol] || '👤'
  }

  const getRolColor = (rol) => {
    const colores = {
      'admin': '#8b5cf6',
      'candidato': '#3b82f6',
      'empresa': '#22c55e'
    }
    return colores[rol] || '#94a3b8'
  }

  return (
    <div className="red-contactos">
      <h1 style={{ marginBottom: '2rem' }}>
        {isAdmin ? '� Explorar Redes de Usuarios' : '�🕸️ Red de Contactos'}
      </h1>
      
      {!user?.email ? (
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
          Por favor, inicia sesión para ver tu red de contactos
        </p>
      ) : (
        <>
          {/* VISTA ADMIN: Buscar usuarios y ver sus redes */}
          {isAdmin ? (
            <div className="admin-redes">
              <div className="busqueda-container" style={{
                background: '#1e293b',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #334155',
                marginBottom: '2rem'
              }}>
                <h2 style={{ marginBottom: '1rem', color: '#38bdf8' }}>
                  🔎 Buscar Red de Usuario
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  Ingresa el email de un usuario para ver su red de contactos
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="email"
                      placeholder="ejemplo@email.com"
                      value={emailBuscado}
                      onChange={(e) => setEmailBuscado(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && buscarUsuarioPorEmail()}
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                  <button
                    onClick={buscarUsuarioPorEmail}
                    disabled={loading}
                    style={{
                      padding: '0.875rem 2rem',
                      background: loading ? '#64748b' : '#38bdf8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {loading ? '⏳ Buscando...' : '🔍 Buscar Red'}
                  </button>
                </div>
              </div>

              {usuarioSeleccionado && (
                <div>
                  <h3 style={{ 
                    marginBottom: '1.5rem', 
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ 
                      background: '#8b5cf6', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      📧 {usuarioSeleccionado}
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      • {redUsuario.length} contacto{redUsuario.length !== 1 ? 's' : ''}
                    </span>
                  </h3>

                  {redUsuario.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      background: '#1e293b',
                      borderRadius: '12px',
                      border: '1px solid #334155'
                    }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👥</div>
                      <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>
                        Este usuario no tiene contactos en su red
                      </p>
                    </div>
                  ) : (
                    <div className="conexiones-grid">
                      {redUsuario.map((contacto, index) => (
                        <div key={index} className="user-card" style={{
                          background: '#1e293b',
                          padding: '1.5rem',
                          borderRadius: '12px',
                          border: '1px solid #334155',
                          transition: 'all 0.2s',
                          cursor: 'default'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="user-icon" style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              backgroundColor: getRolColor(contacto.rol),
                              flexShrink: 0
                            }}>
                              {getRolIcon(contacto.rol)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ 
                                fontSize: '1.1rem', 
                                marginBottom: '0.25rem',
                                color: '#e2e8f0',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {contacto.nombre}
                              </h3>
                              <p style={{ 
                                color: '#94a3b8', 
                                fontSize: '0.875rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {contacto.email}
                              </p>
                            </div>
                          </div>
                          <div style={{
                            display: 'inline-block',
                            padding: '0.375rem 0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            color: getRolColor(contacto.rol),
                            fontWeight: '600'
                          }}>
                            {contacto.rol}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tabs de navegación - Solo para usuarios normales */}
              <div className="tabs-container" style={{ marginBottom: '2rem' }}>
                <button 
                  className={`tab-btn ${vistaActual === 'mi-red' ? 'active' : ''}`}
                  onClick={() => setVistaActual('mi-red')}
                >
                  👥 Mi Red ({red.length})
                </button>
                <button 
                  className={`tab-btn ${vistaActual === 'buscar' ? 'active' : ''}`}
                  onClick={() => setVistaActual('buscar')}
                >
                  🔍 Buscar Usuarios
                </button>
                <button 
                  className={`tab-btn ${vistaActual === 'recibidas' ? 'active' : ''}`}
                  onClick={() => setVistaActual('recibidas')}
                >
                  📥 Solicitudes Recibidas ({solicitudesRecibidas.length})
                </button>
                <button 
                  className={`tab-btn ${vistaActual === 'enviadas' ? 'active' : ''}`}
                  onClick={() => setVistaActual('enviadas')}
                >
                  📤 Solicitudes Enviadas ({solicitudesEnviadas.length})
                </button>
              </div>

              {/* Contenido según tab seleccionado */}
          {vistaActual === 'mi-red' && (
            <div className="tab-content">
              {loading ? (
                <p>Cargando red...</p>
              ) : red.length === 0 ? (
                <div className="empty-state">
                  <p style={{ fontSize: '3rem' }}>👥</p>
                  <p>No tenés contactos todavía</p>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Usá la pestaña "Buscar Usuarios" para encontrar personas y conectar
                  </p>
                </div>
              ) : (
                <div className="conexiones-grid">
                  {red.map((contacto, idx) => (
                    <div key={idx} className="user-card">
                      <div className="user-icon" style={{ backgroundColor: getRolColor(contacto.rol) }}>
                        {getRolIcon(contacto.rol)}
                      </div>
                      <div className="user-info">
                        <h3>{contacto.nombre}</h3>
                        <p className="user-email">{contacto.email}</p>
                        <span className="rol-badge" style={{ backgroundColor: getRolColor(contacto.rol) }}>
                          {contacto.rol}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vistaActual === 'buscar' && (
            <div className="tab-content">
              <div className="buscar-container">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarUsuarios()}
                  style={{ flex: 1, marginRight: '1rem' }}
                />
                <button onClick={buscarUsuarios} className="btn-primary">
                  🔍 Buscar
                </button>
              </div>

              {resultadosBusqueda.length > 0 && (
                <div className="conexiones-grid" style={{ marginTop: '2rem' }}>
                  {resultadosBusqueda.map((usuario, idx) => (
                    <div key={idx} className="user-card">
                      <div className="user-icon" style={{ backgroundColor: getRolColor(usuario.rol) }}>
                        {getRolIcon(usuario.rol)}
                      </div>
                      <div className="user-info">
                        <h3>{usuario.nombre}</h3>
                        <p className="user-email">{usuario.email}</p>
                        <span className="rol-badge" style={{ backgroundColor: getRolColor(usuario.rol) }}>
                          {usuario.rol}
                        </span>
                        <button 
                          onClick={() => enviarSolicitud(usuario.email)}
                          className="btn-primary"
                          style={{ marginTop: '1rem', width: '100%' }}
                        >
                          ➕ Conectar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {busqueda && resultadosBusqueda.length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
                  No se encontraron usuarios
                </p>
              )}
            </div>
          )}

          {vistaActual === 'recibidas' && (
            <div className="tab-content">
              {solicitudesRecibidas.length === 0 ? (
                <div className="empty-state">
                  <p style={{ fontSize: '3rem' }}>📥</p>
                  <p>No tenés solicitudes pendientes</p>
                </div>
              ) : (
                <div className="solicitudes-lista">
                  {solicitudesRecibidas.map((solicitud) => (
                    <div key={solicitud._id} className="solicitud-card">
                      <div className="user-icon" style={{ backgroundColor: getRolColor(solicitud.remitente_rol) }}>
                        {getRolIcon(solicitud.remitente_rol)}
                      </div>
                      <div className="solicitud-info">
                        <h3>{solicitud.remitente_nombre}</h3>
                        <p className="user-email">{solicitud.remitente_email}</p>
                        <span className="rol-badge" style={{ backgroundColor: getRolColor(solicitud.remitente_rol) }}>
                          {solicitud.remitente_rol}
                        </span>
                        {solicitud.mensaje && (
                          <p className="mensaje">💬 {solicitud.mensaje}</p>
                        )}
                      </div>
                      <div className="solicitud-acciones">
                        <button 
                          onClick={() => aceptarSolicitud(solicitud._id)}
                          className="btn-aceptar"
                        >
                          ✅ Aceptar
                        </button>
                        <button 
                          onClick={() => rechazarSolicitud(solicitud._id)}
                          className="btn-rechazar"
                        >
                          ❌ Rechazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {vistaActual === 'enviadas' && (
            <div className="tab-content">
              {solicitudesEnviadas.length === 0 ? (
                <div className="empty-state">
                  <p style={{ fontSize: '3rem' }}>📤</p>
                  <p>No tenés solicitudes enviadas pendientes</p>
                </div>
              ) : (
                <div className="solicitudes-lista">
                  {solicitudesEnviadas.map((solicitud) => (
                    <div key={solicitud._id} className="solicitud-card enviada">
                      <div className="user-icon" style={{ backgroundColor: getRolColor(solicitud.destinatario_rol) }}>
                        {getRolIcon(solicitud.destinatario_rol)}
                      </div>
                      <div className="solicitud-info">
                        <h3>{solicitud.destinatario_nombre}</h3>
                        <p className="user-email">{solicitud.destinatario_email}</p>
                        <span className="rol-badge" style={{ backgroundColor: getRolColor(solicitud.destinatario_rol) }}>
                          {solicitud.destinatario_rol}
                        </span>
                        <p className="estado-pendiente">⏳ Pendiente de aprobación</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default RedContactos