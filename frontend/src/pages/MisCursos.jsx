import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function MisCursos() {
  const { user } = useAuth();
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState('en-curso'); // 'en-curso' o 'completados'

  useEffect(() => {
    if (user?.email) {
      buscarCursos();
    }
  }, [user]);

  const buscarCursos = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      const { data } = await axios.get(`http://localhost:8080/candidatos/${user.email}/cursos`);
      setInscripciones(data.inscripciones || []);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
      alert('Error: ' + (error.response?.data?.detail || 'No se pudieron cargar los cursos'));
    } finally {
      setLoading(false);
    }
  };

  const actualizarProgreso = async (inscripcionId, nuevoProgreso) => {
    try {
      await axios.put(`http://localhost:8080/inscripciones/${inscripcionId}/progreso?progreso=${nuevoProgreso / 100}`);
      alert('✅ Progreso actualizado!');
      buscarCursos(); // Recargar
      
      // Si se marcó como completado (100%), cambiar a vista de completados
      if (nuevoProgreso === 100) {
        setTimeout(() => setVistaActual('completados'), 1500);
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('❌ Error al actualizar progreso: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  const abandonarCurso = async (inscripcionId, cursoNombre) => {
    if (!confirm(`¿Estás seguro de que querés abandonar el curso "${cursoNombre}"?`)) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8080/inscripciones/${inscripcionId}`);
      alert('✅ Te desinscribiste del curso');
      buscarCursos(); // Recargar
    } catch (error) {
      console.error('Error al abandonar:', error);
      alert('❌ Error al abandonar curso: ' + (error.response?.data?.detail || 'Error desconocido'));
    }
  };

  const rendirExamen = async (inscripcionId, cursoNombre) => {
    try {
      const { data } = await axios.post(`http://localhost:8080/inscripciones/${inscripcionId}/rendir-examen`);
      alert(`📝 ${data.mensaje}\n\n${data.aprobado ? '🎉 ¡Felicitaciones!' : '💪 Seguí intentando!'}`);
      buscarCursos(); // Recargar para mostrar la nota
    } catch (error) {
      console.error('Error al rendir examen:', error);
      alert('❌ Error: ' + (error.response?.data?.detail || 'No se pudo rendir el examen'));
    }
  };

  // Filtrar inscripciones según la vista actual
  const cursosEnCurso = inscripciones.filter(insc => !insc.completado);
  const cursosCompletados = inscripciones.filter(insc => insc.completado);
  const inscripcionesFiltradas = vistaActual === 'en-curso' ? cursosEnCurso : cursosCompletados;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>📖 Mis Cursos</h1>

      {!user?.email ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>
          Por favor, inicia sesión para ver tus cursos
        </p>
      ) : loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>⏳ Cargando...</p>
      ) : (
        <>
          {/* Pestañas */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            borderBottom: '2px solid #334155'
          }}>
            <button
              onClick={() => setVistaActual('en-curso')}
              style={{
                padding: '1rem 2rem',
                background: vistaActual === 'en-curso' ? 'linear-gradient(135deg,#38bdf8,#6366f1)' : 'transparent',
                color: vistaActual === 'en-curso' ? 'white' : '#94a3b8',
                border: 'none',
                borderBottom: vistaActual === 'en-curso' ? '3px solid #38bdf8' : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
            >
              📚 En Curso ({cursosEnCurso.length})
            </button>
            <button
              onClick={() => setVistaActual('completados')}
              style={{
                padding: '1rem 2rem',
                background: vistaActual === 'completados' ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'transparent',
                color: vistaActual === 'completados' ? 'white' : '#94a3b8',
                border: 'none',
                borderBottom: vistaActual === 'completados' ? '3px solid #22c55e' : '3px solid transparent',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.3s'
              }}
            >
              ✅ Completados ({cursosCompletados.length})
            </button>
          </div>

          {inscripciones.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>
              No tenés cursos inscriptos todavía
            </p>
          ) : inscripcionesFiltradas.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>
              {vistaActual === 'en-curso' 
                ? 'No tenés cursos en progreso' 
                : 'Todavía no completaste ningún curso'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {inscripcionesFiltradas.map((insc) => (
                <div
                  key={insc.curso_codigo}
                  style={{
                    background: '#1e293b',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem' }}>
                        {insc.curso?.nombre || insc.curso_codigo}
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                        📚 {insc.curso?.categoria} • {insc.curso?.duracion_horas}hs
                      </p>
                    </div>
                    {insc.completado && (
                      <span style={{
                        background: 'rgba(34,197,94,0.15)',
                        color: '#4ade80',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem'
                      }}>
                        ✅ Completado
                      </span>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                      color: '#94a3b8',
                      fontSize: '0.85rem'
                    }}>
                      <span>Progreso</span>
                      <span>{Math.round(insc.progreso * 100)}%</span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '12px',
                      background: '#0f172a',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${insc.progreso * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg,#38bdf8,#6366f1)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Calificación */}
                  {insc.calificacion !== null && (
                    <p style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      ⭐ Calificación: {insc.calificacion}/100
                    </p>
                  )}

                  {/* Nota del examen */}
                  {insc.nota_examen && (
                    <div style={{
                      background: insc.nota_examen >= 6 
                        ? 'rgba(34,197,94,0.15)' 
                        : 'rgba(239,68,68,0.15)',
                      border: `2px solid ${insc.nota_examen >= 6 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      borderRadius: '12px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#94a3b8',
                          marginBottom: '0.25rem'
                        }}>
                          Nota del Examen:
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: '700',
                          color: insc.nota_examen >= 6 ? '#4ade80' : '#f87171'
                        }}>
                          {insc.nota_examen}/10
                        </div>
                      </div>
                      <div style={{
                        fontSize: '3rem'
                      }}>
                        {insc.nota_examen >= 6 ? '🎉' : '📚'}
                      </div>
                    </div>
                  )}

                  {/* Actualizar progreso */}
                  {!insc.completado && (
                    <>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <button
                          onClick={() => actualizarProgreso(insc._id, 25)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          25%
                        </button>
                        <button
                          onClick={() => actualizarProgreso(insc._id, 50)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          50%
                        </button>
                        <button
                          onClick={() => actualizarProgreso(insc._id, 75)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          75%
                        </button>
                        <button
                          onClick={() => actualizarProgreso(insc._id, 100)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(34,197,94,0.15)',
                            color: '#4ade80',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          ✅ 100%
                        </button>
                      </div>
                      
                      {/* Botón abandonar curso */}
                      <button
                        onClick={() => abandonarCurso(insc._id, insc.curso_nombre)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.background = 'rgba(239,68,68,0.25)';
                          e.target.style.borderColor = 'rgba(239,68,68,0.5)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.background = 'rgba(239,68,68,0.15)';
                          e.target.style.borderColor = 'rgba(239,68,68,0.3)';
                        }}
                      >
                        🚪 Abandonar Curso
                      </button>
                    </>
                  )}

                  {/* Botón Rendir Examen (solo para completados) */}
                  {insc.completado && (
                    <button
                      onClick={() => rendirExamen(insc._id, insc.curso?.nombre)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: insc.nota_examen 
                          ? 'rgba(147,51,234,0.15)' 
                          : 'linear-gradient(135deg,#8b5cf6,#6366f1)',
                        color: insc.nota_examen ? '#a78bfa' : 'white',
                        border: insc.nota_examen ? '1px solid rgba(147,51,234,0.3)' : 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'scale(1.02)';
                        e.target.style.boxShadow = '0 8px 24px rgba(139,92,246,0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>
                        {insc.nota_examen ? '🔄' : '📝'}
                      </span>
                      {insc.nota_examen ? 'Volver a Rendir Examen' : 'Rendir Examen'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}