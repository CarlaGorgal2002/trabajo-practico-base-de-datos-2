# 📋 TODO List - Completar Talentum+ según CONSIGNA.md

## 🔴 **PRIORIDAD CRÍTICA**

### **1. Sistema de Capacitación y Certificaciones**

#### Backend:
- [ ] Crear modelo `Curso` en models.py con: codigo, nombre, descripcion, duracion_horas, categoria, nivel, recursos (URLs), instructor
- [ ] Crear modelo `Inscripcion` en models.py con: candidato_email, curso_codigo, fecha_inscripcion, progreso (0-1), calificacion (0-100), completado
- [ ] Agregar colección `cursos` en MongoDB (init.js)
- [ ] Agregar colección `inscripciones` en MongoDB
- [ ] Crear endpoints en main.py:
  - `POST /cursos` - Crear curso
  - `GET /cursos` - Listar cursos (con filtros: categoria, nivel)
  - `GET /cursos/{codigo}` - Obtener curso específico
  - `POST /inscripciones` - Inscribir candidato a curso
  - `PUT /inscripciones/{id}/progreso` - Actualizar progreso (0-100%)
  - `PUT /inscripciones/{id}/calificar` - Asignar calificación final
  - `GET /candidatos/{email}/cursos` - Ver cursos del candidato con progreso
- [ ] Sincronizar cursos completados en Neo4j: `(Candidato)-[:COMPLETO {calificacion}]->(Curso)`
- [ ] Cachear listado de cursos en Redis (TTL: 1 hora)

#### Frontend:
- [ ] Crear `frontend/src/pages/Cursos.jsx` - Catálogo de cursos
- [ ] Crear `frontend/src/pages/MisCursos.jsx` - Cursos del candidato con barra de progreso
- [ ] Agregar rutas en `App.jsx`: `/cursos`, `/mis-cursos`
- [ ] Componente `CursoCard` con botón "Inscribirse"
- [ ] Componente `ProgressBar` para visualizar progreso

---

### **2. Publicación de Búsquedas Laborales**

#### Backend:
- [ ] Crear modelo `Empresa` en models.py con: id, nombre, cuit, sector, tamaño, descripcion, logo_url
- [ ] Crear modelo `OfertaLaboral` en models.py con: id, titulo, empresa_id, descripcion, skills_requeridos, seniority_minimo, modalidad, salario_min/max, ubicacion, estado, fecha_publicacion
- [ ] Agregar colección `empresas` en MongoDB
- [ ] Agregar colección `ofertas` en MongoDB
- [ ] Crear tabla `aplicaciones` en PostgreSQL (init.sql): id, candidato_email, oferta_id, estado, fecha_aplicacion
- [ ] Crear endpoints en main.py:
  - `POST /empresas` - Registrar empresa
  - `GET /empresas` - Listar empresas
  - `POST /ofertas` - Publicar oferta laboral
  - `GET /ofertas` - Listar ofertas activas (filtros: modalidad, ubicacion)
  - `GET /ofertas/{id}` - Detalle de oferta
  - `POST /ofertas/{id}/aplicar` - Candidato aplica a oferta
  - `GET /ofertas/{id}/matches` - Matching automático (Neo4j)
  - `GET /candidatos/{email}/aplicaciones` - Ver aplicaciones del candidato
- [ ] Sincronizar ofertas en Neo4j: `(Empresa)-[:PUBLICA]->(Oferta)-[:REQUIERE]->(Skill)`
- [ ] Actualizar función `matching_automatico()` en events.py para soportar ofertas
- [ ] Cachear ofertas activas en Redis

#### Frontend:
- [ ] Crear `frontend/src/pages/Ofertas.jsx` - Listado de ofertas
- [ ] Crear `frontend/src/pages/DetalleOferta.jsx` - Vista detallada con botón "Aplicar"
- [ ] Crear `frontend/src/pages/MisAplicaciones.jsx` - Tracking de aplicaciones
- [ ] Agregar filtros: modalidad, ubicación, seniority
- [ ] Indicador de % match en cada oferta

---

### **3. Bus de Eventos (RabbitMQ)**

#### Infraestructura:
- [ ] Agregar servicio `rabbitmq` en docker-compose.yml (imagen: `rabbitmq:3-management`, puertos: 5672, 15672)
- [ ] Agregar `pika==1.3.2` a requirements.txt

#### Backend:
- [ ] Crear `src/event_bus.py` con:
  - `conectar_rabbitmq()` - Conexión a RabbitMQ
  - `publicar_evento(tipo, datos)` - Publica evento en cola
  - `declarar_colas()` - Crear colas: `candidatos`, `procesos`, `cursos`, `ofertas`
- [ ] Crear `src/event_listeners.py` con:
  - `escuchar_eventos_candidatos()` - Consume eventos de candidatos
  - `escuchar_eventos_procesos()` - Consume eventos de procesos
  - `procesar_candidato_creado(datos)` - Sincroniza Neo4j, PostgreSQL, Redis
  - `procesar_candidato_actualizado(datos)` - Propaga cambios
  - `procesar_proceso_creado(datos)` - Sincroniza grafo
- [ ] Refactorizar events.py:
  - Cambiar `await sincronizar_candidato_creado()` por `publicar_evento("CandidatoCreado", datos)`
  - Cambiar todas las funciones de sincronización a listeners asíncronos
- [ ] Crear script `src/worker.py` que ejecuta `event_listeners.py` en background
- [ ] Actualizar Dockerfile para ejecutar workers en paralelo con `supervisord`
- [ ] Agregar health checks para RabbitMQ en docker-compose.yml

#### Testing:
- [ ] Crear candidato → Verificar mensaje en RabbitMQ Management UI (http://localhost:15672)
- [ ] Verificar que listeners procesan eventos correctamente
- [ ] Logs: `docker logs talentum-plus | grep "Evento procesado"`

---

## 🟡 **PRIORIDAD IMPORTANTE**

### **4. Autenticación y Autorización (JWT)**

#### Backend:
- [ ] Agregar a requirements.txt: `python-jose[cryptography]==3.3.0`, `passlib[bcrypt]==1.7.4`
- [ ] Crear modelo `Usuario` en models.py con: email, password_hash, rol (admin/recruiter/candidato)
- [ ] Crear tabla `usuarios` en PostgreSQL con contraseñas hasheadas (bcrypt)
- [ ] Crear `src/auth.py` con:
  - `generar_token_jwt(email, rol)` - Genera token
  - `verificar_token(token)` - Valida token
  - `hash_password(password)` - Hash con bcrypt
  - `verificar_password(password, hash)` - Compara contraseñas
- [ ] Crear endpoints en main.py:
  - `POST /register` - Registro de usuario
  - `POST /login` - Login → retorna JWT
  - `GET /me` - Obtener usuario actual (requiere token)
- [ ] Agregar dependencia `get_current_user()` en endpoints protegidos
- [ ] Implementar roles:
  - Admin: acceso completo
  - Recruiter: puede crear ofertas, ver candidatos
  - Candidato: solo su perfil, aplicar a ofertas
- [ ] Proteger endpoints sensibles con `Depends(get_current_user)`

#### Frontend:
- [ ] Crear `frontend/src/pages/Login.jsx` - Formulario de login
- [ ] Crear `frontend/src/pages/Register.jsx` - Formulario de registro
- [ ] Crear `frontend/src/context/AuthContext.jsx` - Manejo de estado de autenticación
- [ ] Guardar JWT en `localStorage`
- [ ] Interceptor de axios para agregar `Authorization: Bearer {token}` en headers
- [ ] Redirigir a `/login` si token expiró (401 Unauthorized)
- [ ] Mostrar usuario logueado en navbar

---

### **5. Historial de Cambios en Perfiles**

#### Backend:
- [ ] Crear colección `historial_cambios` en MongoDB
- [ ] Modificar `PUT /candidatos/{email}` para guardar:
  ```json
  {
    "candidato_email": "...",
    "campo_modificado": "skills",
    "valor_anterior": [...],
    "valor_nuevo": [...],
    "timestamp": "...",
    "usuario_modificador": "..."
  }
  ```
- [ ] Crear endpoint `GET /candidatos/{email}/historial` - Retorna timeline de cambios
- [ ] Indexar por `candidato_email` y `timestamp`

#### Frontend:
- [ ] Crear componente `HistorialCambios.jsx` - Timeline visual de modificaciones
- [ ] Mostrar en vista de detalle de candidato

---

### **6. Modelo de Entrevistas y Evaluaciones**

#### Backend:
- [ ] Crear modelo `Entrevista` en models.py con: id, proceso_id, tipo (técnica/HR/cultural), fecha, entrevistador, duracion_minutos, notas, puntaje (1-5)
- [ ] Crear modelo `EvaluacionTecnica` con: id, proceso_id, tipo (coding/live/take-home), plataforma, resultado, puntaje, feedback
- [ ] Agregar tabla `entrevistas` en PostgreSQL
- [ ] Agregar tabla `evaluaciones` en PostgreSQL
- [ ] Crear endpoints:
  - `POST /procesos/{id}/entrevistas` - Registrar entrevista
  - `GET /procesos/{id}/entrevistas` - Listar entrevistas del proceso
  - `POST /procesos/{id}/evaluaciones` - Registrar evaluación técnica
  - `GET /procesos/{id}/evaluaciones` - Ver evaluaciones

#### Frontend:
- [ ] Agregar sección "Entrevistas" en página de Procesos
- [ ] Formulario para agendar entrevista
- [ ] Vista de resultados de evaluaciones técnicas

---

## 🟢 **PRIORIDAD MEDIA**

### **7. Dashboard por Empresa**

#### Backend:
- [ ] Crear endpoint `GET /empresas/{id}/dashboard` que retorne:
  - Total de ofertas activas
  - Candidatos que aplicaron este mes
  - Procesos en curso
  - Tiempo promedio de contratación
  - Tasa de conversión (aplicaciones → contrataciones)
- [ ] Crear endpoint `GET /empresas/{id}/metricas` con gráficos:
  - Aplicaciones por semana (últimos 3 meses)
  - Top skills más demandados
  - Distribución por seniority

#### Frontend:
- [ ] Crear `frontend/src/pages/DashboardEmpresa.jsx`
- [ ] Integrar gráficos con `recharts` (líneas, barras, pie)
- [ ] Mostrar KPIs en cards

---

### **8. Cifrado de Datos Confidenciales**

#### Backend:
- [ ] Habilitar extensión `pgcrypto` en PostgreSQL (`init.sql`)
- [ ] Agregar columna `feedback_encrypted BYTEA` en tabla `procesos`
- [ ] Modificar `POST /procesos` para cifrar feedback con `pgp_sym_encrypt()`
- [ ] Modificar `GET /procesos` para descifrar con `pgp_sym_decrypt()`
- [ ] Guardar clave de cifrado en variable de entorno `ENCRYPTION_KEY`

---

### **9. Mejoras en Matching**

#### Backend:
- [ ] Agregar scoring ponderado en `matching_automatico()`:
  - Skills: 60%
  - Seniority: 20%
  - Ubicación: 10%
  - Cursos completados: 10%
- [ ] Crear endpoint `GET /candidatos/{email}/recomendaciones-ofertas` - Ofertas sugeridas
- [ ] Notificar por evento cuando hay nuevo match: `(Candidato)-[:MATCH {score}]->(Oferta)`

---

### **10. Testing y Documentación**

- [ ] Crear carpeta `tests/` con tests unitarios (pytest):
  - `test_candidatos.py` - CRUD de candidatos
  - `test_matching.py` - Algoritmo de matching
  - `test_eventos.py` - Bus de eventos
  - `test_auth.py` - Autenticación JWT
- [ ] Agregar docstrings a todas las funciones
- [ ] Crear `DEPLOYMENT.md` con:
  - Instrucciones de deploy en producción
  - Variables de entorno necesarias
  - Comandos de backup de BDs
- [ ] Actualizar README.md con arquitectura completa y diagramas

---

## 📊 **Checklist de Validación Final**

- [ ] ✅ Candidato puede inscribirse a cursos y ver progreso
- [ ] ✅ Empresa puede publicar ofertas laborales
- [ ] ✅ Candidato puede aplicar a ofertas y ver % match
- [ ] ✅ Sistema de autenticación JWT funcional
- [ ] ✅ Bus de eventos RabbitMQ procesando mensajes
- [ ] ✅ Historial de cambios guardándose correctamente
- [ ] ✅ Dashboard de empresa mostrando métricas
- [ ] ✅ Datos confidenciales cifrados en PostgreSQL
- [ ] ✅ Tests unitarios pasando (>80% coverage)
- [ ] ✅ Documentación completa y actualizada

---

## 🎯 **Orden de Implementación Recomendado**

1. **Sistema de Cursos** (1-2 días)
2. **Ofertas Laborales** (1-2 días)
3. **RabbitMQ + Eventos** (1 día)
4. **Autenticación JWT** (1 día)
5. **Historial + Entrevistas** (1 día)
6. **Dashboard + Métricas** (1 día)
7. **Testing + Docs** (1 día)

**Total estimado:** 7-10 días de desarrollo

---

## 📦 **Archivos a Crear/Modificar**

### Nuevos:
- `src/event_bus.py`
- `src/event_listeners.py`
- `src/worker.py`
- `src/auth.py`
- `frontend/src/pages/Cursos.jsx`
- `frontend/src/pages/MisCursos.jsx`
- `frontend/src/pages/Ofertas.jsx`
- `frontend/src/pages/DetalleOferta.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/DashboardEmpresa.jsx`
- `frontend/src/context/AuthContext.jsx`
- `tests/test_*.py`

### A Modificar:
- models.py (agregar 5+ modelos)
- main.py (agregar 20+ endpoints)
- events.py (refactorizar a eventos)
- docker-compose.yml (agregar RabbitMQ)
- requirements.txt (agregar pika, python-jose, passlib)
- init.js (nuevas colecciones)
- init.sql (nuevas tablas)
- App.jsx (nuevas rutas)

---

**🚀 Nota:** Esta TODO list cubre el 100% de la CONSIGNA.md. Priorizá ítems según deadline.