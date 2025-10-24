import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Candidatos from './pages/Candidatos';
import CrearCandidato from './pages/CrearCandidato';
import Matching from './pages/Matching';
import Procesos from './pages/Procesos';
import RedContactos from './pages/RedContactos';
import Cursos from './pages/Cursos';
import MisCursos from './pages/MisCursos';
import Ofertas from './pages/Ofertas';
import PublicarOferta from './pages/PublicarOferta';
// NUEVAS IMPORTACIONES
import DetalleOferta from './pages/DetalleOferta';
import MisAplicaciones from './pages/MisAplicaciones';
import MisSkills from './pages/MisSkills';
import MiHistorialLaboral from './pages/MiHistorialLaboral';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardEmpresa from './pages/DashboardEmpresa';
import AdminCursos from './pages/AdminCursos';
import './App.css';

function Sidebar() {
  const { user, logout } = useAuth();

  // Definir menú según rol
  const getMenuItems = () => {
    const commonItems = [
      { to: '/', label: '📊 Dashboard', roles: ['admin', 'candidato', 'empresa'] }
    ];

    const roleSpecificItems = {
      admin: [
        { to: '/candidatos', label: '👥 Candidatos' },
        { to: '/crear-candidato', label: '➕ Crear Candidato' },
        { to: '/matching', label: '🎯 Matching' },
        { to: '/procesos', label: '📋 Procesos' },
        { to: '/red', label: '🌐 Red' },
        { to: '/admin-cursos', label: '🎓 Admin Cursos' },
        { to: '/ofertas', label: '💼 Ofertas' },
        { to: '/publicar-oferta', label: '➕ Publicar Oferta' }
      ],
      candidato: [
        { to: '/cursos', label: '📚 Catálogo Cursos' },
        { to: '/mis-cursos', label: '💻 Mis Cursos' },
        { to: '/mis-skills', label: '💼 Mis Skills' },
        { to: '/mi-historial', label: '📋 Mi Historial' },
        { to: '/ofertas', label: '💼 Ofertas' },
        { to: '/mis-aplicaciones', label: '📝 Mis Aplicaciones' },
        { to: '/red', label: '🌐 Red Contactos' }
      ],
      empresa: [
        { to: '/dashboard-empresa', label: '📈 Dashboard Empresa' },
        { to: '/candidatos', label: '👥 Candidatos' },
        { to: '/matching', label: '🎯 Matching' },
        { to: '/procesos', label: '📋 Procesos' },
        { to: '/ofertas', label: '💼 Gestión de Ofertas' }
      ]
    };

    const items = roleSpecificItems[user?.rol] || [];
    return [...commonItems, ...items];
  };

  const menuItems = getMenuItems();

  return (
    <nav style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: '250px',
      background: '#1e293b',
      padding: '2rem 1rem',
      borderRight: '1px solid #334155',
      overflowY: 'auto',
      zIndex: 100
    }}>
      <h2 style={{ marginBottom: '2rem', color: '#38bdf8', fontSize: '1.5rem', fontWeight: '700' }}>
        Talentum+
      </h2>

      {user && (
        <div style={{
          background: '#0f172a',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #334155'
        }}>
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            Sesión activa
          </p>
          <p style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>
            {user.nombre}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
            {user.rol}
          </p>
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {menuItems.map((item, index) => (
          <li key={index} style={{ marginBottom: '0.5rem' }}>
            <Link 
              to={item.to} 
              style={{ 
                color: '#e2e8f0', 
                textDecoration: 'none',
                display: 'block',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {item.label}
            </Link>
          </li>
        ))}

            {/* LOGIN - Solo visible si NO hay sesión */}
            {!user && (
              <li style={{ marginTop: '2rem', marginBottom: '0.5rem' }}>
                <Link 
                  to="/login" 
                  style={{ 
                    color: '#38bdf8', 
                    textDecoration: 'none',
                    display: 'block',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(56,189,248,0.1)',
                    fontWeight: '600',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(56,189,248,0.2)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(56,189,248,0.1)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  🔐 Login
                </Link>
              </li>
            )}
          </ul>

          {/* LOGOUT - Solo visible si HAY sesión */}
          {user && (
            <button
              onClick={logout}
              style={{
                width: '100%',
                marginTop: '2rem',
                padding: '0.75rem 1rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
              onMouseLeave={(e) => e.target.style.background = '#dc2626'}
            >
              🚪 Cerrar Sesión
            </button>
          )}
    </nav>
  );
}

function AppContent() {
  const { user } = useAuth();
  const location = window.location.pathname;
  
  // Si no hay sesión Y no estamos en login/register, mostrar solo login
  const isAuthPage = location === '/login' || location === '/register';
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Sidebar solo visible cuando hay sesión activa */}
      {user && <Sidebar />}

      {/* Main Content */}
      <main style={{ 
          marginLeft: user ? '250px' : '0', /* Solo margen si hay sidebar */
          flex: 1, 
          background: '#0f172a', 
          color: '#e2e8f0', 
          minHeight: '100vh',
          width: user ? 'calc(100% - 250px)' : '100%'
        }}>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas - Requieren autenticación */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/candidatos" element={<ProtectedRoute><Candidatos /></ProtectedRoute>} />
            <Route path="/crear-candidato" element={<ProtectedRoute requiredRole="admin"><CrearCandidato /></ProtectedRoute>} />
            <Route path="/matching" element={<ProtectedRoute><Matching /></ProtectedRoute>} />
            <Route path="/procesos" element={<ProtectedRoute><Procesos /></ProtectedRoute>} />
            <Route path="/red" element={<ProtectedRoute><RedContactos /></ProtectedRoute>} />
            <Route path="/admin-cursos" element={<ProtectedRoute requiredRole="admin"><AdminCursos /></ProtectedRoute>} />
            <Route path="/cursos" element={<ProtectedRoute><Cursos /></ProtectedRoute>} />
            <Route path="/mis-cursos" element={<ProtectedRoute><MisCursos /></ProtectedRoute>} />
            <Route path="/mis-skills" element={<ProtectedRoute requiredRole="candidato"><MisSkills /></ProtectedRoute>} />
            <Route path="/mi-historial" element={<ProtectedRoute requiredRole="candidato"><MiHistorialLaboral /></ProtectedRoute>} />
            <Route path="/ofertas" element={<ProtectedRoute><Ofertas /></ProtectedRoute>} />
            <Route path="/publicar-oferta" element={<ProtectedRoute><PublicarOferta /></ProtectedRoute>} />
            <Route path="/ofertas/:id" element={<ProtectedRoute><DetalleOferta /></ProtectedRoute>} />
            <Route path="/mis-aplicaciones" element={<ProtectedRoute><MisAplicaciones /></ProtectedRoute>} />
            <Route path="/dashboard-empresa" element={<ProtectedRoute requiredRole="empresa"><DashboardEmpresa /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
