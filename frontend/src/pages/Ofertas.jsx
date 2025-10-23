import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Ofertas() {
  const { user } = useAuth();
  const isEmpresa = user?.rol === 'empresa' || user?.rol === 'admin';
  const [ofertas, setOfertas] = useState([]);
  const [misOfertas, setMisOfertas] = useState([]);
  const [otrasOfertas, setOtrasOfertas] = useState([]);
  const [vistaActual, setVistaActual] = useState('mis-ofertas'); // Para empresas
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    modalidad: '',
    ubicacion: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    cargarOfertas();
  }, [filtros, user]);

  const cargarOfertas = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtros.modalidad) params.modalidad = filtros.modalidad;
      if (filtros.ubicacion) params.ubicacion = filtros.ubicacion;

      const { data } = await axios.get('http://localhost:8080/ofertas', { params });
      const todasOfertas = data.ofertas || [];
      
      if (isEmpresa && user?.email) {
        // Separar ofertas propias de otras empresas
        const propias = todasOfertas.filter(o => o.empresa === user.email);
        const otras = todasOfertas.filter(o => o.empresa !== user.email);
        setMisOfertas(propias);
        setOtrasOfertas(otras);
      } else {
        // Candidatos ven todas las ofertas
        setOfertas(todasOfertas);
      }
    } catch (error) {
      console.error('Error al cargar ofertas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>💼 Ofertas Laborales</h1>
        
        {/* Botón publicar oferta - Solo para empresas */}
        {isEmpresa && (
          <button
            onClick={() => navigate('/publicar-oferta')}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.target.style.background = '#16a34a'}
            onMouseLeave={(e) => e.target.style.background = '#22c55e'}
          >
            ➕ Publicar Nueva Oferta
          </button>
        )}
      </div>

      {/* Tabs - Solo para empresas */}
      {isEmpresa && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: '1px solid #334155'
        }}>
          <button
            onClick={() => setVistaActual('mis-ofertas')}
            style={{
              padding: '1rem 1.5rem',
              background: vistaActual === 'mis-ofertas' ? '#1e293b' : 'transparent',
              color: vistaActual === 'mis-ofertas' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: vistaActual === 'mis-ofertas' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            📋 Mis Ofertas ({misOfertas.length})
          </button>
          <button
            onClick={() => setVistaActual('mercado')}
            style={{
              padding: '1rem 1.5rem',
              background: vistaActual === 'mercado' ? '#1e293b' : 'transparent',
              color: vistaActual === 'mercado' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: vistaActual === 'mercado' ? '2px solid #38bdf8' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
          >
            🌐 Mercado Laboral ({otrasOfertas.length})
          </button>
        </div>
      )}

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
          value={filtros.modalidad}
          onChange={(e) => setFiltros({ ...filtros, modalidad: e.target.value })}
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#e2e8f0',
            minWidth: '200px'
          }}
        >
          <option value="">Todas las modalidades</option>
          <option value="Remoto">Remoto</option>
          <option value="Híbrido">Híbrido</option>
          <option value="Presencial">Presencial</option>
        </select>

        <input
          type="text"
          placeholder="Ubicación (ej: Argentina)"
          value={filtros.ubicacion}
          onChange={(e) => setFiltros({ ...filtros, ubicacion: e.target.value })}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#e2e8f0'
          }}
        />
      </div>

      {/* Contenido según el rol y vista */}
      {loading ? (
        <p>Cargando ofertas...</p>
      ) : (
        <>
          {/* VISTA PARA EMPRESAS */}
          {isEmpresa ? (
            <>
              {vistaActual === 'mis-ofertas' ? (
                <div>
                  <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>
                    📋 Tus Ofertas Publicadas
                  </h2>
                  {misOfertas.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      background: '#1e293b',
                      borderRadius: '12px',
                      border: '1px solid #334155'
                    }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                      <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        Aún no has publicado ninguna oferta
                      </p>
                      <button
                        onClick={() => navigate('/publicar-oferta')}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}
                      >
                        ➕ Publicar Mi Primera Oferta
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {misOfertas.map((oferta, index) => (
                        <OfertaCard 
                          key={index} 
                          oferta={oferta} 
                          index={index} 
                          navigate={navigate}
                          esPropia={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h2 style={{ marginBottom: '1.5rem', color: '#e2e8f0' }}>
                    🌐 Ofertas de Otras Empresas
                  </h2>
                  <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                    Visualiza qué están publicando otras empresas en el mercado
                  </p>
                  {otrasOfertas.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      background: '#1e293b',
                      borderRadius: '12px',
                      border: '1px solid #334155'
                    }}>
                      <p style={{ color: '#94a3b8' }}>
                        No hay ofertas de otras empresas en este momento
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {otrasOfertas.map((oferta, index) => (
                        <OfertaCard 
                          key={index} 
                          oferta={oferta} 
                          index={index} 
                          navigate={navigate}
                          esPropia={false}
                          soloLectura={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* VISTA PARA CANDIDATOS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {ofertas.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  background: '#1e293b',
                  borderRadius: '12px',
                  border: '1px solid #334155'
                }}>
                  <p style={{ color: '#94a3b8' }}>
                    No se encontraron ofertas con los filtros seleccionados
                  </p>
                </div>
              ) : (
                ofertas.map((oferta, index) => (
                  <OfertaCard 
                    key={index} 
                    oferta={oferta} 
                    index={index} 
                    navigate={navigate}
                    esCandidato={true}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Componente para la tarjeta de oferta
function OfertaCard({ oferta, index, navigate, esPropia, soloLectura, esCandidato }) {
  return (
    <div
      style={{
        background: '#1e293b',
        borderRadius: '16px',
        padding: '1.5rem',
        border: esPropia ? '2px solid #22c55e' : '1px solid #334155',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        position: 'relative'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      onClick={() => navigate(`/ofertas/${oferta.id}`)}
    >
      {esPropia && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: '#22c55e',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          ✓ Tu Oferta
        </div>
      )}
      
      {soloLectura && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: '#64748b',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          👁️ Solo lectura
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem' }}>{oferta.titulo}</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            🏢 {oferta.empresa}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            background: oferta.modalidad === 'remoto' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
            color: oferta.modalidad === 'remoto' ? '#4ade80' : '#60a5fa',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            display: 'block',
            marginBottom: '0.5rem',
            textTransform: 'capitalize'
          }}>
            {oferta.modalidad || 'No especificado'}
          </span>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
            📍 {oferta.ubicacion || 'No especificado'}
          </span>
        </div>
      </div>

      <p style={{ color: '#cbd5e1', marginBottom: '1rem', fontSize: '0.95rem' }}>
        {oferta.descripcion ? oferta.descripcion.substring(0, 150) + '...' : 'Sin descripción'}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          {oferta.salario ? `💰 $${oferta.salario.toLocaleString()}` : '💰 A convenir'}
        </span>
        {esCandidato && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/ofertas/${oferta.id}`);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#38bdf8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            Ver Detalles →
          </button>
        )}
      </div>
    </div>
  );
}