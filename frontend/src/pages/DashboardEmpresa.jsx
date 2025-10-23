import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function DashboardEmpresa() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    ofertasTotales: 0,
    ofertasActivas: 0,
    totalAplicaciones: 0,
    candidatosEnProceso: 0,
    misOfertas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      cargarEstadisticas();
    }
  }, [user]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);

      // Obtener todas las ofertas
      const ofertasRes = await axios.get('http://localhost:8080/ofertas');
      const todasOfertas = ofertasRes.data.ofertas || [];

      console.log('📧 Email del usuario:', user?.email);
      console.log('📊 Total ofertas recibidas:', todasOfertas.length);
      console.log('📋 Ofertas completas:', todasOfertas);

      // Filtrar ofertas de esta empresa
      const misOfertas = todasOfertas.filter(o => o.empresa === user?.email);
      console.log('✅ Mis ofertas filtradas:', misOfertas.length, misOfertas);
      
      const ofertasActivas = misOfertas.filter(o => o.estado === 'abierta');
      console.log('🟢 Ofertas activas:', ofertasActivas.length);

      // Obtener aplicaciones (con manejo de errores)
      let totalAplicaciones = 0;
      try {
        const aplicacionesRes = await axios.get('http://localhost:8080/aplicaciones');
        const aplicaciones = aplicacionesRes.data || [];
        
        // Contar aplicaciones a mis ofertas
        const ofertasIds = misOfertas.map(o => o.id);
        const aplicacionesMisOfertas = aplicaciones.filter(a => 
          ofertasIds.includes(a.oferta_id)
        );
        totalAplicaciones = aplicacionesMisOfertas.length;
      } catch (error) {
        console.warn('⚠️ No se pudieron cargar las aplicaciones:', error.message);
      }

      // Obtener procesos (con manejo de errores)
      let candidatosEnProceso = 0;
      try {
        const procesosRes = await axios.get('http://localhost:8080/procesos');
        const procesos = procesosRes.data.procesos || [];
        
        // Contar candidatos únicos en procesos
        const candidatosUnicos = new Set(procesos.map(p => p.candidato_email));
        candidatosEnProceso = candidatosUnicos.size;
      } catch (error) {
        console.warn('⚠️ No se pudieron cargar los procesos:', error.message);
      }

      setStats({
        ofertasTotales: misOfertas.length,
        ofertasActivas: ofertasActivas.length,
        totalAplicaciones,
        candidatosEnProceso,
        misOfertas: misOfertas.slice(0, 5) // Últimas 5 ofertas
      });

      console.log('✅ Estadísticas actualizadas:', {
        ofertasTotales: misOfertas.length,
        ofertasActivas: ofertasActivas.length,
        totalAplicaciones,
        candidatosEnProceso
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh'
      }}>
        <h2>🔄 Cargando estadísticas...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>📊 Dashboard Empresa</h1>
        <button
          onClick={() => navigate('/publicar-oferta')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6366f1',
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
        >
          📢 Publicar Nueva Oferta
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Ofertas Totales */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💼</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
            Ofertas Totales
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#38bdf8' }}>
            {stats.ofertasTotales}
          </p>
        </div>

        {/* Ofertas Activas */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
            Ofertas Activas
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#22c55e' }}>
            {stats.ofertasActivas}
          </p>
        </div>

        {/* Total Aplicaciones */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📝</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
            Total Aplicaciones
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b' }}>
            {stats.totalAplicaciones}
          </p>
        </div>

        {/* Candidatos en Proceso */}
        <div style={{
          background: '#1e293b',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔄</div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '500' }}>
            Candidatos en Proceso
          </h3>
          <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '700', color: '#a855f7' }}>
            {stats.candidatosEnProceso}
          </p>
        </div>
      </div>

      {/* Mis Ofertas Publicadas */}
      <div style={{
        background: '#1e293b',
        borderRadius: '16px',
        padding: '2rem',
        border: '1px solid #334155'
      }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem' }}>📋 Mis Ofertas Publicadas</h2>
        
        {stats.misOfertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📢</div>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              No has publicado ninguna oferta aún
            </p>
            <button
              onClick={() => navigate('/publicar-oferta')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Publicar Primera Oferta
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.misOfertas.map((oferta, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/ofertas/${oferta.id}`)}
                  style={{
                    background: '#0f172a',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#6366f1';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#334155';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>
                        {oferta.titulo}
                      </h3>
                      <p style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                        📍 {oferta.ubicacion} • 💼 {oferta.modalidad} • 💰 ${oferta.salario?.toLocaleString()}
                      </p>
                    </div>
                    <span style={{
                      background: oferta.estado === 'abierta' ? '#22c55e' : '#64748b',
                      color: 'white',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {oferta.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {stats.ofertasTotales > 5 && (
              <button
                onClick={() => navigate('/ofertas')}
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  border: '1px solid #6366f1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Ver todas las ofertas ({stats.ofertasTotales})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}