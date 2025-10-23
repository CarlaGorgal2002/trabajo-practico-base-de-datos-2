import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    candidatos: 0,
    procesos: 0,
    matching: 0,
    relaciones: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Solo cargar estadísticas globales si es admin o empresa
    if (user && (user.rol === 'admin' || user.rol === 'empresa')) {
      cargarEstadisticas();
    }
  }, [user]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Candidatos
      const candidatosRes = await axiosInstance.get('/candidatos');
      
      // Procesos desde PostgreSQL
      const procesosRes = await axiosInstance.get('/procesos');
      
      setStats({
        candidatos: candidatosRes.data.total || 0,
        procesos: procesosRes.data.total || 0,
        matching: 12,
        relaciones: 45
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h2>🔄 Cargando estadísticas...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '2rem',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h2>❌ {error}</h2>
        <button 
          onClick={cargarEstadisticas}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#38bdf8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  // Dashboard personalizado para candidatos
  if (user?.rol === 'candidato') {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>
          ¡Bienvenido, {user.nombre}! 👋
        </h1>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>🎯 Tu Panel de Candidato</h2>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
            Desde aquí podés gestionar tus cursos, aplicaciones y conexiones profesionales.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <button
              onClick={() => navigate('/mis-cursos')}
              style={{
                padding: '1.5rem',
                background: '#38bdf8',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              📚 Mis Cursos
            </button>
            <button
              onClick={() => navigate('/ofertas')}
              style={{
                padding: '1.5rem',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              💼 Ver Ofertas
            </button>
            <button
              onClick={() => navigate('/mis-aplicaciones')}
              style={{
                padding: '1.5rem',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              📝 Mis Aplicaciones
            </button>
            <button
              onClick={() => navigate('/red')}
              style={{
                padding: '1.5rem',
                background: '#ec4899',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              🌐 Red de Contactos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard personalizado para empresas
  if (user?.rol === 'empresa') {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>
          Panel de Empresa 🏢
        </h1>
        <p>Gestioná tus ofertas laborales y candidatos desde aquí.</p>
        <button
          onClick={() => navigate('/dashboard-empresa')}
          style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            background: '#38bdf8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Ver Dashboard Empresa
        </button>
      </div>
    );
  }

  // Dashboard de admin/empresa (con estadísticas globales)
  return (
    <div style={{ 
      padding: '2rem',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Dashboard</h1>

      {/* Grid de Métricas 2x2 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem',
        marginBottom: '3rem',
        maxWidth: '900px'
      }}>
        {/* Candidatos Registrados */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid #475569',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '180px'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👥</div>
          <h3 style={{ 
            color: '#94a3b8', 
            fontSize: '0.9rem', 
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Candidatos Registrados
          </h3>
          <p style={{ 
            fontSize: '3.5rem', 
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {stats.candidatos}
          </p>
        </div>

        {/* Procesos Activos */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid #475569',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '180px'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
          <h3 style={{ 
            color: '#94a3b8', 
            fontSize: '0.9rem', 
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Procesos Activos
          </h3>
          <p style={{ 
            fontSize: '3.5rem', 
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {stats.procesos}
          </p>
        </div>

        {/* Matching Realizados */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid #475569',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '180px'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
          <h3 style={{ 
            color: '#94a3b8', 
            fontSize: '0.9rem', 
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Matching Realizados
          </h3>
          <p style={{ 
            fontSize: '3.5rem', 
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #10b981, #14b8a6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {stats.matching}
          </p>
        </div>

        {/* Relaciones en Red */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: '20px',
          padding: '2rem',
          border: '1px solid #475569',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '180px'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌐</div>
          <h3 style={{ 
            color: '#94a3b8', 
            fontSize: '0.9rem', 
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '1rem'
          }}>
            Relaciones en Red
          </h3>
          <p style={{ 
            fontSize: '3.5rem', 
            fontWeight: '700',
            margin: 0,
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {stats.relaciones}
          </p>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 style={{ 
          marginBottom: '1.5rem',
          fontSize: '1.5rem',
          color: '#e2e8f0'
        }}>
          Acciones Rápidas
        </h2>
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/crear-candidato')}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(56, 189, 248, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(56, 189, 248, 0.3)';
            }}
          >
            ➕ Crear Candidato
          </button>

          <button
            onClick={() => navigate('/matching')}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #10b981, #14b8a6)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(16, 185, 129, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.3)';
            }}
          >
            🎯 Buscar Matches
          </button>

          <button
            onClick={() => navigate('/cursos')}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(139, 92, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.3)';
            }}
          >
            📚 Ver Cursos
          </button>

          <button
            onClick={() => navigate('/ofertas')}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(245, 158, 11, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.3)';
            }}
          >
            💼 Ver Ofertas
          </button>
        </div>
      </div>
    </div>
  );
}