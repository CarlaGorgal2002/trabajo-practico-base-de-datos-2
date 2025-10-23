import { useState } from 'react'
import axios from 'axios'

function Matching() {
  const [form, setForm] = useState({ puesto: '', skills: '' })
  const [resultados, setResultados] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        puesto: form.puesto,
        skills: form.skills.split(',').map(s => s.trim())
      }

      const res = await axios.post('http://localhost:8080/matching', payload)
      setResultados(res.data)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al realizar matching')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="matching">
      <h1 style={{ marginBottom: '2rem' }}>🎯 Matching de Candidatos</h1>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Puesto</label>
          <input
            type="text"
            required
            value={form.puesto}
            onChange={(e) => setForm({ ...form, puesto: e.target.value })}
            placeholder="Backend Developer"
          />
        </div>

        <div className="form-group">
          <label>Skills Requeridos (separados por coma)</label>
          <input
            type="text"
            required
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="python, algorithms, debugging"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Buscando...' : '🔍 Buscar Candidatos'}
        </button>
      </form>

      {resultados && (
        <div className="resultados">
          <h2>Resultados: {resultados.candidatos_encontrados} candidatos</h2>
          <p className="subtitle">Puesto: <strong>{resultados.puesto}</strong></p>
          
          <div className="candidatos-grid">
            {resultados.candidatos.map((candidato) => (
              <div key={candidato.email} className="candidato-card match">
                <h3>{candidato.nombre}</h3>
                <p className="email">{candidato.email}</p>
                <span className="badge">{candidato.seniority}</span>
                
                <div className="match-info">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${candidato.match_percentage}%` }}
                    ></div>
                  </div>
                  <p>{candidato.match_percentage.toFixed(0)}% match ({candidato.match_skills} skills)</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Matching