import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function CrearCandidato() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    seniority: 'Junior',
    skills: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        nombre: form.nombre,
        email: form.email,
        seniority: form.seniority,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        cursos: []
      }

      await axios.post('http://localhost:8080/candidatos', payload)
      alert('✅ Candidato creado exitosamente')
      navigate('/candidatos')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear candidato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="crear-candidato" style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Crear Nuevo Candidato</h1>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Grace Hopper"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="grace@talentum.plus"
          />
        </div>

        <div className="form-group">
          <label>Seniority</label>
          <select
            value={form.seniority}
            onChange={(e) => setForm({ ...form, seniority: e.target.value })}
          >
            <option value="Junior">Junior</option>
            <option value="Semi-Senior">Semi-Senior</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
          </select>
        </div>

        <div className="form-group">
          <label>Skills (separados por coma)</label>
          <input
            type="text"
            required
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="python, algorithms, debugging"
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creando...' : '✅ Crear Candidato'}
        </button>
      </form>
    </div>
  )
}

export default CrearCandidato