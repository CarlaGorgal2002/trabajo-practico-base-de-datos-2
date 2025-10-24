import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function MiHistorialLaboral() {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState(null);
  const [editando, setEditando] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const [formData, setFormData] = useState({
    empresa: '',
    puesto: '',
    fecha_inicio: '',
    fecha_fin: '',
    descripcion: '',
    tecnologias: '',
    ubicacion: '',
    actualmente_trabajando: false
  });

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/candidatos/${user.email}/historial-laboral`);
      setHistorial(response.data.historial_laboral || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      mostrarMensaje('Error al cargar tu historial laboral', 'error');
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      empresa: '',
      puesto: '',
      fecha_inicio: '',
      fecha_fin: '',
      descripcion: '',
      tecnologias: '',
      ubicacion: '',
      actualmente_trabajando: false
    });
    setEditando(null);
    setAgregando(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.empresa.trim() || !formData.puesto.trim() || !formData.fecha_inicio) {
      mostrarMensaje('Empresa, puesto y fecha de inicio son obligatorios', 'error');
      return;
    }

    try {
      const experienciaData = {
        ...formData,
        tecnologias: formData.tecnologias
          ? formData.tecnologias.split(',').map(t => t.trim()).filter(t => t)
          : [],
        fecha_fin: formData.actualmente_trabajando ? null : formData.fecha_fin
      };

      if (editando !== null) {
        // Actualizar existente
        await axios.put(
          `/candidatos/${user.email}/historial-laboral/${editando}`,
          experienciaData
        );
        mostrarMensaje('✅ Experiencia actualizada exitosamente', 'success');
      } else {
        // Agregar nueva
        await axios.post(
          `/candidatos/${user.email}/historial-laboral`,
          experienciaData
        );
        mostrarMensaje('✅ Experiencia agregada exitosamente', 'success');
      }

      limpiarFormulario();
      cargarHistorial();
    } catch (error) {
      console.error('Error al guardar experiencia:', error);
      mostrarMensaje(
        error.response?.data?.detail || 'Error al guardar la experiencia',
        'error'
      );
    }
  };

  const handleEditar = (index) => {
    const exp = historial[index];
    setFormData({
      empresa: exp.empresa,
      puesto: exp.puesto,
      fecha_inicio: exp.fecha_inicio,
      fecha_fin: exp.fecha_fin || '',
      descripcion: exp.descripcion || '',
      tecnologias: Array.isArray(exp.tecnologias) ? exp.tecnologias.join(', ') : '',
      ubicacion: exp.ubicacion || '',
      actualmente_trabajando: exp.actualmente_trabajando || false
    });
    setEditando(index);
    setAgregando(false);
  };

  const handleEliminar = async (index) => {
    const exp = historial[index];
    if (!confirm(`¿Seguro que quieres eliminar tu experiencia en ${exp.empresa}?`)) {
      return;
    }

    try {
      await axios.delete(`/candidatos/${user.email}/historial-laboral/${index}`);
      mostrarMensaje('🗑️ Experiencia eliminada', 'success');
      cargarHistorial();
    } catch (error) {
      console.error('Error al eliminar experiencia:', error);
      mostrarMensaje(
        error.response?.data?.detail || 'Error al eliminar la experiencia',
        'error'
      );
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 5000);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Presente';
    const [año, mes] = fecha.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(mes) - 1]} ${año}`;
  };

  const calcularDuracion = (inicio, fin) => {
    const fechaInicio = new Date(inicio);
    const fechaFin = fin ? new Date(fin) : new Date();
    
    const meses = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 
                  + (fechaFin.getMonth() - fechaInicio.getMonth());
    
    if (meses < 12) {
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else {
      const años = Math.floor(meses / 12);
      const mesesRestantes = meses % 12;
      if (mesesRestantes === 0) {
        return `${años} ${años === 1 ? 'año' : 'años'}`;
      }
      return `${años} ${años === 1 ? 'año' : 'años'} ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`;
    }
  };

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
          💼 Mi Historial Laboral
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto' }}>
          Gestiona tu experiencia profesional. Este historial es visible para reclutadores y empresas.
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

      {/* Botón Agregar Nueva Experiencia */}
      {!agregando && editando === null && (
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => {
              limpiarFormulario();
              setAgregando(true);
            }}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ➕ Agregar Nueva Experiencia
          </button>
        </div>
      )}

      {/* Formulario */}
      {(agregando || editando !== null) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
          backdropFilter: 'blur(10px)',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: '600',
            marginBottom: '1.5rem',
            color: '#60a5fa'
          }}>
            {editando !== null ? '✏️ Editar Experiencia' : '➕ Nueva Experiencia'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
              {/* Empresa */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                  Empresa *
                </label>
                <input
                  type="text"
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  required
                  placeholder="Ej: Google, Microsoft"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Puesto */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                  Puesto *
                </label>
                <input
                  type="text"
                  value={formData.puesto}
                  onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                  required
                  placeholder="Ej: Senior Backend Developer"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Fecha Inicio */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                  Fecha de Inicio *
                </label>
                <input
                  type="month"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                  Fecha de Fin
                </label>
                <input
                  type="month"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  disabled={formData.actualmente_trabajando}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: formData.actualmente_trabajando ? 'rgba(15, 23, 42, 0.3)' : 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    cursor: formData.actualmente_trabajando ? 'not-allowed' : 'text'
                  }}
                />
              </div>

              {/* Ubicación */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="Ej: Buenos Aires, Argentina"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Checkbox Actualmente Trabajando */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="actualmente_trabajando"
                  checked={formData.actualmente_trabajando}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    actualmente_trabajando: e.target.checked,
                    fecha_fin: e.target.checked ? '' : formData.fecha_fin
                  })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label 
                  htmlFor="actualmente_trabajando"
                  style={{ color: '#cbd5e1', fontWeight: '500', cursor: 'pointer' }}
                >
                  Actualmente trabajo aquí
                </label>
              </div>
            </div>

            {/* Tecnologías */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                Tecnologías (separadas por coma)
              </label>
              <input
                type="text"
                value={formData.tecnologias}
                onChange={(e) => setFormData({ ...formData, tecnologias: e.target.value })}
                placeholder="Ej: Python, FastAPI, Docker, PostgreSQL"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#e2e8f0',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Descripción */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1', fontWeight: '500' }}>
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={4}
                placeholder="Describe tus responsabilidades y logros principales..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#e2e8f0',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={limpiarFormulario}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'transparent',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {editando !== null ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Experiencias */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p>Cargando historial...</p>
        </div>
      ) : historial.length === 0 && !agregando ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '16px',
          border: '2px dashed rgba(148, 163, 184, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ color: '#cbd5e1', marginBottom: '0.5rem' }}>Sin experiencia laboral</h3>
          <p style={{ color: '#94a3b8' }}>Agrega tu primera experiencia profesional para empezar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {historial.map((exp, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                backdropFilter: 'blur(10px)',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                position: 'relative'
              }}
            >
              {/* Botones de acción */}
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleEditar(index)}
                  disabled={agregando || editando !== null}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    cursor: (agregando || editando !== null) ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: (agregando || editando !== null) ? 0.5 : 1
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleEliminar(index)}
                  disabled={agregando || editando !== null}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    cursor: (agregando || editando !== null) ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    opacity: (agregando || editando !== null) ? 0.5 : 1
                  }}
                >
                  🗑️
                </button>
              </div>

              {/* Contenido */}
              <div style={{ marginRight: '10rem' }}>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600',
                  color: '#e2e8f0',
                  marginBottom: '0.25rem'
                }}>
                  {exp.puesto}
                </h3>
                <p style={{ 
                  fontSize: '1.1rem', 
                  color: '#60a5fa',
                  fontWeight: '500',
                  marginBottom: '0.5rem'
                }}>
                  {exp.empresa}
                </p>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: '#94a3b8',
                  marginBottom: '0.5rem'
                }}>
                  {formatearFecha(exp.fecha_inicio)} - {exp.actualmente_trabajando ? 'Presente' : formatearFecha(exp.fecha_fin)}
                  {' · '}
                  {calcularDuracion(exp.fecha_inicio, exp.fecha_fin)}
                  {exp.ubicacion && ` · ${exp.ubicacion}`}
                </p>

                {exp.descripcion && (
                  <p style={{ 
                    color: '#cbd5e1',
                    marginTop: '1rem',
                    lineHeight: '1.6'
                  }}>
                    {exp.descripcion}
                  </p>
                )}

                {exp.tecnologias && exp.tecnologias.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {exp.tecnologias.map((tech, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
