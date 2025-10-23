import { useEffect, useState } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'

function Procesos() {
  const [searchParams] = useSearchParams()
  const candidatoInicial = searchParams.get('candidato') || ''
  
  const [candidatoId, setCandidatoId] = useState(candidatoInicial)
  const [procesos, setProcesos] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [nuevoProc, setNuevoProc] = useState({
    puesto: '',
    estado: 'inicial',
    feedback: ''
  })

  useEffect(() => {
    if (candidatoInicial) {
      fetchProcesos(candidatoInicial)
    }
  }, [candidatoInicial])

  const fetchProcesos = async (id) => {
    if (!id) return
    
    setLoading(true)
    try {
      const res = await axios.get(`http://localhost:8080/procesos/${id}`)
      setProcesos(res.data.procesos || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar procesos')
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    fetchProcesos(candidatoId)
  }

  const handleCrearProceso = async (e) => {
    e.preventDefault()
    
    try {
      await axios.post('http://localhost:8080/procesos', {
        candidato_id: candidatoId,
        puesto: nuevoProc.puesto,
        estado: nuevoProc.estado,
        feedback: nuevoProc.feedback
      })
      
      alert('✅ Proceso creado exitosamente')
      setShowForm(false)
      setNuevoProc({ puesto: '', estado: 'inicial', feedback: '' })
      fetchProcesos(candidatoId)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear proceso')
    }
  }

  const getEstadoColor = (estado) => {
    const colores = {
      'inicial': '#6366f1',
      'entrevista': '#f59e0b',
      'técnica': '#8b5cf6',
      'finalista': '#22c55e',
      'contratado': '#10b981',
      'descartado': '#ef4444'
    }
    return colores[estado] || '#94a3b8'
  }

  return (
    <div className="procesos">
      <h1 style={{ marginBottom: '2rem' }}>📋 Procesos de Selección</h1>
      
      <div className="buscar-candidato">
        <input
          type="text"
          placeholder="Email del candidato..."
          value={candidatoId}
          onChange={(e) => setCandidatoId(e.target.value)}
        />
        <button onClick={handleBuscar} className="btn-primary">
          🔍 Buscar
        </button>
        {candidatoId && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-secondary"
          >
            ➕ Nuevo Proceso
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCrearProceso} className="form proceso-form">
          <h3>Crear Nuevo Proceso</h3>
          
          <div className="form-group">
            <label>Puesto</label>
            <input
              type="text"
              required
              value={nuevoProc.puesto}
              onChange={(e) => setNuevoProc({ ...nuevoProc, puesto: e.target.value })}
              placeholder="Backend Developer"
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select
              value={nuevoProc.estado}
              onChange={(e) => setNuevoProc({ ...nuevoProc, estado: e.target.value })}
            >
              <option value="inicial">Inicial</option>
              <option value="entrevista">Entrevista</option>
              <option value="técnica">Evaluación Técnica</option>
              <option value="finalista">Finalista</option>
              <option value="contratado">Contratado</option>
              <option value="descartado">Descartado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Feedback</label>
            <textarea
              value={nuevoProc.feedback}
              onChange={(e) => setNuevoProc({ ...nuevoProc, feedback: e.target.value })}
              placeholder="Notas sobre el proceso..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">✅ Crear</button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="btn-cancel"
            >
              ❌ Cancelar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Cargando procesos...</p>
      ) : procesos.length === 0 ? (
        <p className="empty-state">
          {candidatoId ? 'No hay procesos registrados para este candidato' : 'Ingresá un email para ver procesos'}
        </p>
      ) : (
        <div className="procesos-lista">
          <h2>Procesos de {candidatoId}</h2>
          <div className="procesos-timeline">
            {procesos.map((proceso) => (
              <div key={proceso.id} className="proceso-item">
                <div 
                  className="proceso-status" 
                  style={{ backgroundColor: getEstadoColor(proceso.estado) }}
                />
                <div className="proceso-content">
                  <h3>{proceso.puesto}</h3>
                  <span 
                    className="badge"
                    style={{ backgroundColor: getEstadoColor(proceso.estado) + '33' }}
                  >
                    {proceso.estado}
                  </span>
                  <p className="fecha">{new Date(proceso.fecha).toLocaleDateString('es-AR')}</p>
                  {proceso.feedback && (
                    <p className="feedback">{proceso.feedback}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Procesos