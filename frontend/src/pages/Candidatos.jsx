import { useEffect, useState } from 'react'
import axios from '../api/axios'

function Candidatos() {
  const [candidatos, setCandidatos] = useState([])
  const [filtros, setFiltros] = useState({ skill: '', seniority: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCandidatos()
  }, [])

  const fetchCandidatos = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filtros.skill) params.append('skill', filtros.skill)
      if (filtros.seniority) params.append('seniority', filtros.seniority)
      
      const res = await axios.get(`/candidatos?${params}`)
      setCandidatos(res.data.candidatos || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    fetchCandidatos()
  }

  return (
    <div className="candidatos" style={{ 
      padding: '2rem',
      minHeight: '100vh',
      backgroundColor: '#0a0e27',
      color: '#e0e0e0'
    }}>
      <h1 style={{ 
        marginBottom: '2rem',
        color: '#60a5fa',
        fontSize: '2rem',
        fontWeight: 'bold'
      }}>Gestión de Candidatos</h1>
      
      <div className="filters" style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Filtrar por skill..."
          value={filtros.skill}
          onChange={(e) => setFiltros({ ...filtros, skill: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #374151',
            backgroundColor: '#1f2937',
            color: '#e0e0e0',
            flex: '1',
            minWidth: '200px'
          }}
        />
        <select
          value={filtros.seniority}
          onChange={(e) => setFiltros({ ...filtros, seniority: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #374151',
            backgroundColor: '#1f2937',
            color: '#e0e0e0',
            minWidth: '150px'
          }}
        >
          <option value="">Todos los niveles</option>
          <option value="Junior">Junior</option>
          <option value="Semi-Senior">Semi-Senior</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
        </select>
        <button onClick={handleFilter} style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#3b82f6',
          color: 'white',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>🔍 Filtrar</button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#9ca3af' }}>Cargando...</p>
      ) : candidatos.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9ca3af' }}>No se encontraron candidatos</p>
      ) : (
        <div className="candidatos-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {candidatos.map((candidato) => (
            <div key={candidato.email} className="candidato-card" style={{
              backgroundColor: '#1f2937',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #374151',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <h3 style={{ 
                color: '#60a5fa', 
                margin: 0,
                fontSize: '1.25rem'
              }}>{candidato.nombre}</h3>
              <p className="email" style={{ 
                color: '#9ca3af',
                margin: 0,
                fontSize: '0.875rem'
              }}>{candidato.email}</p>
              <span className="badge" style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                width: 'fit-content'
              }}>{candidato.seniority || 'Sin especificar'}</span>
              
              <div className="skills" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}>
                {Array.isArray(candidato.skills) && candidato.skills.length > 0 ? (
                  candidato.skills.map((skill) => (
                    <span key={skill} className="skill-tag" style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#374151',
                      color: '#e0e0e0',
                      fontSize: '0.75rem'
                    }}>{skill}</span>
                  ))
                ) : (
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Sin skills registradas</span>
                )}
              </div>
              
              <div className="actions" style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: 'auto'
              }}>
                <a href={`/procesos?candidato=${candidato.email}`} style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  flex: 1
                }}>Ver Procesos</a>
                <a href={`/red?candidato=${candidato.email}`} style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  flex: 1
                }}>Ver Red</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Candidatos