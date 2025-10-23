import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function PublicarOferta() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    titulo: '',
    empresa: user?.rol === 'admin' ? '' : user?.email || '',
    descripcion: '',
    requisitos: '',
    salario: '',
    ubicacion: '',
    modalidad: 'presencial',
    tipo_contrato: 'full-time'
  })
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.titulo || !formData.empresa || !formData.descripcion) {
      alert('Por favor completa los campos obligatorios')
      return
    }
    
    setLoading(true)
    try {
      const ofertaData = {
        ...formData,
        salario: formData.salario ? parseFloat(formData.salario) : null,
        estado: 'abierta',
        fecha_publicacion: new Date().toISOString()
      }
      
      await axios.post('http://localhost:8080/ofertas', ofertaData)
      alert('✅ Oferta publicada exitosamente')
      navigate('/ofertas')
    } catch (error) {
      console.error('Error al publicar oferta:', error)
      alert(error.response?.data?.detail || 'Error al publicar la oferta')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem', color: '#e2e8f0' }}>
          📝 Publicar Nueva Oferta Laboral
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
          Completa los datos de la oferta que deseas publicar
        </p>

        <form onSubmit={handleSubmit} style={{
          background: '#1e293b',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          {/* Título */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#e2e8f0',
              fontWeight: '600'
            }}>
              Título de la Oferta <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ej: Desarrollador Full Stack Senior"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Empresa (solo para admin) */}
          {user?.rol === 'admin' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#e2e8f0',
                fontWeight: '600'
              }}>
                Email de la Empresa <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                placeholder="empresa@example.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          {/* Descripción */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#e2e8f0',
              fontWeight: '600'
            }}>
              Descripción <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Describe las responsabilidades del puesto..."
              required
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Requisitos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#e2e8f0',
              fontWeight: '600'
            }}>
              Requisitos / Skills Requeridos
            </label>
            <p style={{ 
              color: '#94a3b8', 
              fontSize: '0.85rem', 
              marginBottom: '0.5rem' 
            }}>
              💡 Ingresa las tecnologías y habilidades separadas por comas. Ej: Python, React, SQL, Docker
            </p>
            <input
              type="text"
              name="requisitos"
              value={formData.requisitos}
              onChange={handleChange}
              placeholder="Python, FastAPI, React, Docker, PostgreSQL..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '1rem'
              }}
            />
            {formData.requisitos && (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.5rem', 
                marginTop: '0.75rem' 
              }}>
                {formData.requisitos.split(',').map((req, idx) => {
                  const trimmed = req.trim();
                  return trimmed ? (
                    <span 
                      key={idx}
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#60a5fa',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      {trimmed}
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Fila con 2 columnas: Salario y Ubicación */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#e2e8f0',
                fontWeight: '600'
              }}>
                Salario (USD)
              </label>
              <input
                type="number"
                name="salario"
                value={formData.salario}
                onChange={handleChange}
                placeholder="50000"
                min="0"
                step="1000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#e2e8f0',
                fontWeight: '600'
              }}>
                Ubicación
              </label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                placeholder="Buenos Aires, Argentina"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          {/* Fila con 2 columnas: Modalidad y Tipo de Contrato */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#e2e8f0',
                fontWeight: '600'
              }}>
                Modalidad
              </label>
              <select
                name="modalidad"
                value={formData.modalidad}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="presencial">🏢 Presencial</option>
                <option value="remoto">🏠 Remoto</option>
                <option value="hibrido">🔄 Híbrido</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: '#e2e8f0',
                fontWeight: '600'
              }}>
                Tipo de Contrato
              </label>
              <select
                name="tipo_contrato"
                value={formData.tipo_contrato}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                <option value="full-time">⏰ Full Time</option>
                <option value="part-time">🕐 Part Time</option>
                <option value="freelance">💼 Freelance</option>
                <option value="contrato">📄 Contrato</option>
                <option value="pasantia">🎓 Pasantía</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end',
            paddingTop: '1.5rem',
            borderTop: '1px solid #334155'
          }}>
            <button
              type="button"
              onClick={() => navigate('/ofertas')}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#334155',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 2rem',
                background: loading ? '#64748b' : '#38bdf8',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              {loading ? '⏳ Publicando...' : '✅ Publicar Oferta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PublicarOferta
