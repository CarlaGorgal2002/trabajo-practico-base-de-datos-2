import { useState, useEffect } from 'react';
import axios from '../api/axios';

export default function AdminCursos() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showInscribir, setShowInscribir] = useState(null);
  const [candidatoEmail, setCandidatoEmail] = useState('');
  
  const [nuevoCurso, setNuevoCurso] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'Programación',
    nivel: 'Principiante',
    duracion_horas: 40,
    instructor: '',
    requisitos: '',
    temas: ''
  });

  useEffect(() => {
    cargarCursos();
  }, []);

  const cargarCursos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/cursos');
      setCursos(data.cursos || []);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearCurso = async (e) => {
    e.preventDefault();
    try {
      // Generar código a partir del título (sin espacios, mayúsculas, max 10 chars)
      const codigo = nuevoCurso.titulo
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10) + Math.floor(Math.random() * 100);

      const payload = {
        codigo: codigo,
        nombre: nuevoCurso.titulo,
        descripcion: nuevoCurso.descripcion,
        duracion_horas: parseInt(nuevoCurso.duracion_horas),
        categoria: nuevoCurso.categoria,
        nivel: nuevoCurso.nivel,
        instructor: nuevoCurso.instructor,
        recursos: nuevoCurso.requisitos.split(',').map(r => r.trim()).filter(Boolean),
        skills: nuevoCurso.temas.split(',').map(t => t.trim()).filter(Boolean)
      };

      await axios.post('/cursos', payload);
      alert('✅ Curso creado exitosamente');
      setShowForm(false);
      setNuevoCurso({
        titulo: '',
        descripcion: '',
        categoria: 'Programación',
        nivel: 'Principiante',
        duracion_horas: 40,
        instructor: '',
        requisitos: '',
        temas: ''
      });
      cargarCursos();
    } catch (error) {
      console.error('Error completo:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'No se pudo crear el curso';
      alert('❌ Error: ' + errorMsg);
    }
  };

  const inscribirCandidato = async (cursoId) => {
    if (!candidatoEmail) {
      alert('Por favor ingresa el email del candidato');
      return;
    }

    try {
      await axios.post('/inscripciones', {
        candidato_email: candidatoEmail,
        curso_id: cursoId
      });
      alert('✅ Candidato inscrito exitosamente');
      setShowInscribir(null);
      setCandidatoEmail('');
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.detail || 'No se pudo inscribir'));
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>🎓 Administración de Cursos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {showForm ? '❌ Cancelar' : '➕ Nuevo Curso'}
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <div style={{
          background: '#1e293b',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          border: '1px solid #334155'
        }}>
          <h2 style={{ marginTop: 0 }}>Crear Nuevo Curso</h2>
          <form onSubmit={crearCurso} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                Título del Curso *
              </label>
              <input
                type="text"
                required
                value={nuevoCurso.titulo}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, titulo: e.target.value })}
                placeholder="Python Avanzado: Programación Asíncrona"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                Descripción *
              </label>
              <textarea
                required
                value={nuevoCurso.descripcion}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                placeholder="Aprende a dominar la programación asíncrona en Python..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                  Categoría
                </label>
                <select
                  value={nuevoCurso.categoria}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, categoria: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                >
                  <option value="Programación">Programación</option>
                  <option value="Data Science">Data Science</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Soft Skills">Soft Skills</option>
                  <option value="Idiomas">Idiomas</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                  Nivel
                </label>
                <select
                  value={nuevoCurso.nivel}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nivel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                  Duración (horas)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={nuevoCurso.duracion_horas}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, duracion_horas: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#e2e8f0'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                Instructor *
              </label>
              <input
                type="text"
                required
                value={nuevoCurso.instructor}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, instructor: e.target.value })}
                placeholder="Dr. Alan Turing"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                Requisitos (separados por coma)
              </label>
              <input
                type="text"
                value={nuevoCurso.requisitos}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, requisitos: e.target.value })}
                placeholder="Python básico, programación orientada a objetos"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                Temas (separados por coma) *
              </label>
              <input
                type="text"
                required
                value={nuevoCurso.temas}
                onChange={(e) => setNuevoCurso({ ...nuevoCurso, temas: e.target.value })}
                placeholder="async/await, asyncio, concurrencia, paralelismo"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#e2e8f0'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                marginTop: '1rem'
              }}
            >
              ✅ Crear Curso
            </button>
          </form>
        </div>
      )}

      {/* Lista de cursos */}
      {loading ? (
        <p>Cargando cursos...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {cursos.map((curso) => (
            <div
              key={curso._id}
              style={{
                background: '#1e293b',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem' }}>{curso.nombre}</h3>
                  <p style={{ color: '#94a3b8', margin: '0 0 1rem' }}>{curso.descripcion}</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <span style={{
                      background: 'rgba(99,102,241,0.15)',
                      color: '#818cf8',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}>
                      📚 {curso.categoria}
                    </span>
                    <span style={{
                      background: 'rgba(34,197,94,0.15)',
                      color: '#4ade80',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}>
                      📊 {curso.nivel}
                    </span>
                    <span style={{
                      background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}>
                      ⏱️ {curso.duracion_horas}h
                    </span>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    👨‍🏫 <strong>Instructor:</strong> {curso.instructor}
                  </p>

                  {curso.requisitos && curso.requisitos.length > 0 && (
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                      📋 <strong>Requisitos:</strong> {curso.requisitos.join(', ')}
                    </p>
                  )}

                  {curso.temas && curso.temas.length > 0 && (
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                      🎯 <strong>Temas:</strong> {curso.temas.join(', ')}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setShowInscribir(showInscribir === curso._id ? null : curso._id)}
                  style={{
                    background: 'rgba(59,130,246,0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {showInscribir === curso._id ? '❌ Cancelar' : '➕ Inscribir'}
                </button>
              </div>

              {/* Panel de inscripción */}
              {showInscribir === curso._id && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#0f172a',
                  borderRadius: '8px',
                  border: '1px solid #334155'
                }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                    Email del candidato:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="email"
                      value={candidatoEmail}
                      onChange={(e) => setCandidatoEmail(e.target.value)}
                      placeholder="candidato@email.com"
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                    <button
                      onClick={() => inscribirCandidato(curso._id)}
                      style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✅ Inscribir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {cursos.length === 0 && (
            <div style={{
              background: '#1e293b',
              padding: '3rem',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <p style={{ fontSize: '3rem', margin: '0 0 1rem' }}>📚</p>
              <p style={{ margin: 0 }}>No hay cursos creados. ¡Crea el primero!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
