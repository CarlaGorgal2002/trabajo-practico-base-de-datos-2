import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay token al cargar la app
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('http://localhost:8080/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Token inválido:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('http://localhost:8080/login', {
      email,
      password
    });

    const { access_token, email: userEmail, rol, nombre } = response.data;
    const userData = { email: userEmail, rol, nombre };
    
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('token', access_token);
    return userData;
  };

  const register = async (email, password, nombre, rol = 'candidato') => {
    const response = await axios.post('http://localhost:8080/register', {
      email,
      password,
      nombre,
      rol
    });
    return response.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    window.location.href = '/login'; // Redirigir al login después de logout
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.rol === 'admin',
    isEmpresa: user?.rol === 'empresa' || user?.rol === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
