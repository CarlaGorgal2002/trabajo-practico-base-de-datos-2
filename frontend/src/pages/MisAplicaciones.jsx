import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function MisAplicaciones() {
  const { user } = useAuth();
  const [aplicaciones, setAplicaciones] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.email) {
      buscarAplicaciones();
    }
  }, [user]);

  const buscarAplicaciones = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      const { data } = await axios.get(`http://localhost:8080/candidatos/${user.email}/aplicaciones`);
      setAplicaciones(data.aplicaciones || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + (error.response?.data?.detail || 'No se pudieron cargar las aplicaciones'));
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Pendiente': { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
      'En Revisión': { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
      'Rechazado': { bg: 'rgba(239,68,68,0.15)', text: '#f87171' },
      'Contratado': { bg: 'rgba(34,197,94,0.15)', text: '#4ade80' }
    };
    return colores[estado] || colores['Pendiente'];
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>📝 Mis Aplicaciones</h1>

      {!user?.email ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>
          Por favor, inicia sesión para ver tus aplicaciones
        </p>
      ) : loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>⏳ Cargando...</p>
      ) : (
        <>
          {aplicaciones.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>
              No tenés aplicaciones todavía
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {aplicaciones.map((aplic) => (
                <div
                  key={aplic.id}
                  style={{
                    background: '#1e293b',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    border: '1px solid #334155'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem' }}>
                        {aplic.oferta?.titulo || 'Oferta Eliminada'}
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
                        🏢 {aplic.oferta?.empresa_id}
                      </p>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                        📅 Aplicado: {new Date(aplic.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <span style={{
                      background: getEstadoColor(aplic.estado).bg,
                      color: getEstadoColor(aplic.estado).text,
                      padding: '0.5rem 1rem',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {aplic.estado}
                    </span>
                  </div>

                  {aplic.oferta && (
                    <div style={{ display: 'flex', gap: '0.75rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                      <span>💼 {aplic.oferta.modalidad}</span>
                    </div>
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