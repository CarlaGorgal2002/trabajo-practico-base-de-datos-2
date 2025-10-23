import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Cursos() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    categoria: '',
    nivel: ''
  });

  useEffect(() => {
    cargarCursos();
  }, [filtros]);

  const cargarCursos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.categoria) params.categoria = filtros.categoria;
      if (filtros.nivel) params.nivel = filtros.nivel;

      const { data } = await axios.get('http://localhost:8080/cursos', { params });
      setCursos(data.cursos || []);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const inscribirse = async (cursoCodigo) => {
    if (!user?.email) {
      alert('⚠️ Debes iniciar sesión para inscribirte a un curso');
      return;
    }

    try {
      await axios.post('http://localhost:8080/inscripciones', {
        candidato_email: user.email,
        curso_codigo: cursoCodigo
      });
      alert('✅ Inscripción exitosa!');
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.detail || 'No se pudo inscribir'));
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>📚 Catálogo de Cursos</h1>

      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        background: '#1e293b',
        padding: '1.5rem',
        borderRadius: '12px'
      }}>
        <select
          value={filtros.categoria}
          onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#e2e8f0',
            minWidth: '200px'
          }}
        >
          <option value="">Todas las categorías</option>
          <option value="Backend">Backend</option>
          <option value="Frontend">Frontend</option>
          <option value="DevOps">DevOps</option>
          <option value="Data Science">Data Science</option>
        </select>

        <select
          value={filtros.nivel}
          onChange={(e) => setFiltros({ ...filtros, nivel: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#e2e8f0',
            minWidth: '200px'
          }}
        >
          <option value="">Todos los niveles</option>
          <option value="Principiante">Principiante</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
        </select>
      </div>

      {/* Lista de Cursos */}
      {loading ? (
        <p>Cargando cursos...</p>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {cursos.map((curso) => (
            <div
              key={curso.codigo}
              style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #334155'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '1rem'
              }}>
                <div>
                  <span style={{
                    background: 'rgba(59,130,246,0.15)',
                    color: '#60a5fa',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    marginRight: '0.5rem'
                  }}>
                    {curso.categoria}
                  </span>
                  <span style={{
                    background: 'rgba(34,197,94,0.15)',
                    color: '#4ade80',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem'
                  }}>
                    {curso.nivel}
                  </span>
                </div>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  {curso.duracion_horas}hs
                </span>
              </div>

              <h3 style={{ margin: '0 0 0.5rem' }}>{curso.nombre}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {curso.descripcion}
              </p>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
                👨‍🏫 Instructor: {curso.instructor}
              </p>

              <button
                onClick={() => inscribirse(curso.codigo)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg,#38bdf8,#6366f1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                📝 Inscribirse
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && cursos.length === 0 && (
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '2rem' }}>
          No hay cursos disponibles con estos filtros
        </p>
      )}
    </div>
  );
}