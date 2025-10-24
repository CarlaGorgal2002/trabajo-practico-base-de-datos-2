import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

export default function DetalleOferta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [oferta, setOferta] = useState(null);
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verMatches, setVerMatches] = useState(false);
  const [editando, setEditando] = useState(false);
  const [formEdicion, setFormEdicion] = useState({
    requisitos: ''
  });

  useEffect(() => {
    cargarOferta();
  }, [id]);

  const cargarOferta = async () => {
    try {
      // Obtener detalle de la oferta
      const { data } = await axios.get(`/ofertas/${id}`);
      setOferta(data);
      setFormEdicion({ requisitos: data.requisitos || '' });
    } catch (error) {
      console.error('Error al cargar oferta:', error);
      alert('No se encontró la oferta');
      navigate('/ofertas');
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicion = () => {
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setFormEdicion({ requisitos: oferta.requisitos || '' });
  };

  const guardarCambios = async () => {
    try {
      await axios.put(`/ofertas/${id}`, {
        requisitos: formEdicion.requisitos
      });
      alert('✅ Skills requeridos actualizados exitosamente');
      setEditando(false);
      cargarOferta(); // Recargar para mostrar los cambios
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.detail || 'No se pudo actualizar'));
    }
  };

  const cargarMatches = async () => {
    try {
      const { data } = await axios.get(`/ofertas/${id}/matches`);
      setCandidatos(data.candidatos || []);
      setVerMatches(true);
    } catch (error) {
      alert('Error al cargar matches');
    }
  };

  const aplicar = async () => {
    if (!user?.email) {
      alert('⚠️ Debes iniciar sesión para aplicar a esta oferta');
      return;
    }

    try {
      await axios.post(`/ofertas/${id}/aplicar`, {
        candidato_email: user.email
      });
      alert('✅ ¡Aplicación enviada exitosamente!');
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.detail || 'No se pudo aplicar'));
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>Cargando...</p>;
  if (!oferta) return null;

  return (
    <div style={{ padding: '2rem' }}>
      <button
        onClick={() => navigate('/ofertas')}
        style={{
          background: 'rgba(100,116,139,0.2)',
          border: 'none',
          color: '#94a3b8',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        ← Volver
      </button>

      <div style={{
        background: '#1e293b',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid #334155'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ margin: '0 0 2rem', marginBottom: '0.5rem' }}>{oferta.titulo}</h1>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>
                🏢 {oferta.empresa_id}
              </p>
            </div>
            <span style={{
              background: oferta.estado === 'Activa' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: oferta.estado === 'Activa' ? '#4ade80' : '#f87171',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {oferta.estado}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#94a3b8' }}>
            <span>📍 {oferta.ubicacion}</span>
            <span>💼 {oferta.modalidad}</span>
            <span>📊 {oferta.seniority_minimo ? `${oferta.seniority_minimo}+` : 'Sin experiencia previa'}</span>
            <span>{oferta.salario ? `💰 $${oferta.salario.toLocaleString()}` : '💰 A convenir'}</span>
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: '2rem' }}>
          <h3>📝 Descripción</h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>{oferta.descripcion}</p>
        </div>

        {/* Skills requeridos */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>🎯 Skills Requeridos</h3>
            {/* Mostrar botón de editar solo si es la empresa dueña o admin */}
            {(user?.rol === 'empresa' && oferta.empresa === user?.email) || user?.rol === 'admin' ? (
              !editando ? (
                <button
                  onClick={iniciarEdicion}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  ✏️ Editar Skills
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={guardarCambios}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    ✓ Guardar
                  </button>
                  <button
                    onClick={cancelarEdicion}
                    style={{
                      background: 'rgba(239,68,68,0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239,68,68,0.3)',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    ✕ Cancelar
                  </button>
                </div>
              )
            ) : null}
          </div>
          
          {editando ? (
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Ingresa las skills separadas por comas (ej: Python, React, Docker)
              </p>
              <textarea
                value={formEdicion.requisitos}
                onChange={(e) => setFormEdicion({ requisitos: e.target.value })}
                placeholder="Python, JavaScript, React, Node.js, Docker"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '2px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {oferta.skills_requeridos && oferta.skills_requeridos.length > 0 ? (
                oferta.skills_requeridos.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      background: 'rgba(59,130,246,0.15)',
                      color: '#60a5fa',
                      padding: '0.5rem 1rem',
                      borderRadius: '999px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p style={{ color: '#94a3b8' }}>No se especificaron skills requeridos</p>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Solo candidatos pueden aplicar */}
          {user?.rol === 'candidato' && (
            <button
              onClick={aplicar}
              style={{
                flex: 1,
                padding: '1rem',
                background: 'linear-gradient(135deg,#38bdf8,#6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              📝 Aplicar a esta oferta
            </button>
          )}
          
          {/* Solo admin y empresa pueden ver matches */}
          {(user?.rol === 'admin' || user?.rol === 'empresa') && (
            <button
              onClick={cargarMatches}
              style={{
                padding: '1rem 1.5rem',
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              🎯 Ver Matches
            </button>
          )}
        </div>
      </div>

      {/* Matches */}
      {verMatches && (
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #334155',
          marginTop: '2rem'
        }}>
          <h2>🎯 Candidatos que Matchean ({candidatos.length})</h2>
          {candidatos.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hay candidatos que matcheen actualmente</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {candidatos.map((c) => (
                <div
                  key={c.email}
                  style={{
                    background: '#0f172a',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem' }}>{c.nombre}</h4>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                      {c.email} • {c.seniority}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      background: c.match_percentage >= 70 ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.15)',
                      color: c.match_percentage >= 70 ? '#4ade80' : '#fbbf24',
                      padding: '0.5rem 1rem',
                      borderRadius: '999px',
                      fontSize: '1.1rem',
                      fontWeight: '700'
                    }}>
                      {c.match_percentage}% Match
                    </div>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                      {c.match_skills}/{oferta.skills_requeridos.length} skills
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}