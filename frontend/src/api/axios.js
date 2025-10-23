import axios from 'axios';

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para requests: agregar token automáticamente
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses: manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401: Token inválido o expirado → redirect a login
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // 403: Sin permisos
      if (error.response.status === 403) {
        console.error('Acceso denegado: permisos insuficientes');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
