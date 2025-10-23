import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MisSkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [nuevaSkill, setNuevaSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [seniorityActual, setSeniorityActual] = useState('');
  const [editandoSeniority, setEditandoSeniority] = useState(false);

  useEffect(() => {
    cargarSkills();
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const response = await axios.get(`/candidatos/${user.email}/perfil`);
      setPerfil(response.data);
      setSeniorityActual(response.data.seniority || '');
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };

  const cargarSkills = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/candidatos/${user.email}/skills`);
      setSkills(response.data.skills || []);
    } catch (error) {
      console.error('Error al cargar skills:', error);
      mostrarMensaje('Error al cargar tus skills', 'error');
    } finally {
      setLoading(false);
    }
  };

  const actualizarSeniority = async () => {
    if (!seniorityActual) {
      mostrarMensaje('Por favor selecciona un nivel de seniority', 'error');
      return;
    }

    try {
      await axios.put(`/candidatos/${user.email}/seniority`, { seniority: seniorityActual });
      mostrarMensaje(`✅ Nivel de seniority actualizado a "${seniorityActual}"`, 'success');
      setEditandoSeniority(false);
      cargarPerfil();
    } catch (error) {
      console.error('Error al actualizar seniority:', error);
      mostrarMensaje(error.response?.data?.detail || 'Error al actualizar seniority', 'error');
    }
  };

  const agregarSkill = async (e) => {
    e.preventDefault();
    
    if (!nuevaSkill.trim()) {
      mostrarMensaje('Por favor ingresa una skill válida', 'error');
      return;
    }

    // Normalizar formato (Title Case)
    const skillNormalizada = nuevaSkill
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    if (skills.includes(skillNormalizada)) {
      mostrarMensaje('Esta skill ya está en tu perfil', 'error');
      return;
    }

    try {
      await axios.post(
        `/candidatos/${user.email}/skills`,
        { skill: skillNormalizada }
      );
      
      setSkills([...skills, skillNormalizada].sort());
      setNuevaSkill('');
      mostrarMensaje(`✅ Skill "${skillNormalizada}" agregada exitosamente`, 'success');
    } catch (error) {
      console.error('Error al agregar skill:', error);
      mostrarMensaje(error.response?.data?.detail || 'Error al agregar la skill', 'error');
    }
  };

  const eliminarSkill = async (skill) => {
    if (!confirm(`¿Seguro que quieres eliminar "${skill}" de tu perfil?`)) {
      return;
    }

    try {
      await axios.delete(`/candidatos/${user.email}/skills/${encodeURIComponent(skill)}`);
      
      setSkills(skills.filter(s => s !== skill));
      mostrarMensaje(`🗑️ Skill "${skill}" eliminada`, 'success');
    } catch (error) {
      console.error('Error al eliminar skill:', error);
      mostrarMensaje(error.response?.data?.detail || 'Error al eliminar la skill', 'error');
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };

  const skillsPopulares = [
    'Python', 'JavaScript', 'Java', 'React', 'Node.js', 
    'SQL', 'MongoDB', 'Docker', 'Git', 'AWS',
    'Angular', 'Vue.js', 'TypeScript', 'C#', 'PHP',
    'Kubernetes', 'Linux', 'Agile', 'Scrum', 'CI/CD'
  ];

  const skillsSugeridas = skillsPopulares.filter(s => !skills.includes(s));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700',
          marginBottom: '0.5rem', 
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          💼 Mis Skills
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto' }}>
          Gestiona las habilidades técnicas de tu perfil. Estas skills son relevadas en el matching con ofertas laborales.
        </p>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div style={{
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          background: mensaje.tipo === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: mensaje.tipo === 'success' ? '#4ade80' : '#f87171',
          border: `2px solid ${mensaje.tipo === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          fontSize: '0.95rem',
          fontWeight: '500'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Sección de Seniority */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
        backdropFilter: 'blur(10px)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600',
            margin: 0,
            color: '#60a5fa',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📊 Nivel de Seniority
          </h2>
          {!editandoSeniority && (
            <button
              onClick={() => setEditandoSeniority(true)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#2563eb'}
              onMouseOut={(e) => e.target.style.background = '#3b82f6'}
            >
              ✏️ Editar
            </button>
          )}
        </div>

        {editandoSeniority ? (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={seniorityActual}
              onChange={(e) => setSeniorityActual(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(30, 41, 59, 0.6)',
                color: '#e2e8f0',
                fontSize: '1rem',
                flex: '1',
                minWidth: '200px',
                cursor: 'pointer'
              }}
            >
              <option value="">Selecciona un nivel...</option>
              <option value="Junior">Junior</option>
              <option value="Semi-Senior">Semi-Senior</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
            </select>
            <button
              onClick={actualizarSeniority}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: '#10b981',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#059669'}
              onMouseOut={(e) => e.target.style.background = '#10b981'}
            >
              ✅ Guardar
            </button>
            <button
              onClick={() => {
                setEditandoSeniority(false);
                setSeniorityActual(perfil?.seniority || '');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#e2e8f0'}
              onMouseOut={(e) => e.target.style.color = '#94a3b8'}
            >
              ❌ Cancelar
            </button>
          </div>
        ) : (
          <div style={{ 
            padding: '1rem 1.5rem',
            borderRadius: '10px',
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <span style={{ 
              fontSize: '1.25rem',
              color: perfil?.seniority ? '#60a5fa' : '#94a3b8',
              fontWeight: '600'
            }}>
              {perfil?.seniority || 'No especificado - Haz clic en "Editar" para configurar tu nivel'}
            </span>
          </div>
        )}
      </div>

      {/* Formulario para agregar skill */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))',
        backdropFilter: 'blur(10px)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ 
          fontSize: '1.4rem', 
          marginBottom: '1.5rem', 
          color: '#e2e8f0',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ➕ Agregar Nueva Skill
        </h2>
        <form onSubmit={agregarSkill} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={nuevaSkill}
            onChange={(e) => setNuevaSkill(e.target.value)}
            placeholder="Ej: Python, React, Docker..."
            style={{
              flex: 1,
              padding: '1rem 1.25rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '2px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              fontSize: '1rem',
              color: '#e2e8f0',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.background = 'rgba(15, 23, 42, 0.8)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)';
              e.target.style.background = 'rgba(15, 23, 42, 0.6)';
            }}
          />
          <button
            type="submit"
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            Agregar
          </button>
        </form>
      </div>

      {/* Skills actuales */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))',
        backdropFilter: 'blur(10px)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ 
          fontSize: '1.4rem', 
          marginBottom: '1.5rem', 
          color: '#e2e8f0',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🎯 Tus Skills ({skills.length})
        </h2>
        
        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem', fontSize: '1.1rem' }}>
            🔄 Cargando skills...
          </p>
        ) : skills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</p>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Aún no has agregado ninguna skill.</p>
            <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Comienza agregando tus habilidades técnicas para mejorar tu matching con ofertas.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {skills.map((skill) => (
              <div
                key={skill}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.25rem',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))',
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '999px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#60a5fa',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span>{skill}</span>
                <button
                  onClick={() => eliminarSkill(skill)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.15)';
                    e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                  title={`Eliminar ${skill}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills sugeridas */}
      {skillsSugeridas.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(148, 163, 184, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h2 style={{ 
            fontSize: '1.4rem', 
            marginBottom: '1rem', 
            color: '#e2e8f0',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            💡 Skills Populares
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Haz clic en cualquier skill para agregarla a tu perfil:
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            {skillsSugeridas.slice(0, 15).map((skill) => (
              <button
                key={skill}
                onClick={() => {
                  setNuevaSkill(skill);
                  // Trigger agregar automáticamente
                  axios.post(
                    `http://localhost:8080/candidatos/${user.email}/skills`,
                    { skill }
                  ).then(() => {
                    setSkills([...skills, skill].sort());
                    mostrarMensaje(`✅ Skill "${skill}" agregada`, 'success');
                  }).catch((error) => {
                    mostrarMensaje(error.response?.data?.detail || 'Error al agregar skill', 'error');
                  });
                }}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(71, 85, 105, 0.3)',
                  border: '2px solid rgba(148, 163, 184, 0.3)',
                  borderRadius: '999px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.color = '#60a5fa';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(71, 85, 105, 0.3)';
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                  e.target.style.color = '#cbd5e1';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(251, 191, 36, 0.1)',
        border: '2px solid rgba(251, 191, 36, 0.3)',
        borderRadius: '12px',
        fontSize: '0.95rem',
        color: '#fbbf24'
      }}>
        <strong>💡 Consejo:</strong> Mantén tus skills actualizadas. El sistema de matching utiliza 
        esta información para conectarte con las ofertas más relevantes para tu perfil.
      </div>
    </div>
  );
}
