# 📚 Flujo de Gestión de Cursos - Talentum+

## Resumen
El sistema permite crear cursos, inscribir candidatos y hacer seguimiento del progreso de capacitación.

## 🎯 Componentes Principales

### 1. **Admin Cursos** (`/admin-cursos`)
**Funcionalidad:**
- Crear nuevos cursos con:
  - Título y descripción
  - Categoría (Programación, Data Science, DevOps, Cloud, Soft Skills, Idiomas)
  - Nivel (Principiante, Intermedio, Avanzado)
  - Duración en horas
  - Instructor
  - Requisitos previos
  - Lista de temas
  
- Inscribir candidatos a cursos:
  - Desde cada tarjeta de curso → botón "Inscribir"
  - Ingresar email del candidato
  - Se crea automáticamente el registro de inscripción

**Backend:**
- `POST /cursos` - Crear curso
- `GET /cursos` - Listar cursos
- `POST /inscripciones` - Inscribir candidato

### 2. **Catálogo de Cursos** (`/cursos`)
**Funcionalidad:**
- Vista pública de todos los cursos disponibles
- Filtros por categoría y nivel
- Cards con información resumida
- Botón "Inscribirme" (próximamente con auth)

### 3. **Mis Cursos** (`/mis-cursos`)
**Funcionalidad:**
- Vista del candidato de sus cursos inscritos
- Barra de progreso visual (0-100%)
- Actualizar progreso con slider
- Fecha de inscripción
- Estado del curso

**Backend:**
- `GET /candidatos/{email}/cursos` - Obtener cursos del candidato
- `PUT /inscripciones/{id}/progreso?progreso=0.75` - Actualizar progreso

## 🔄 Flujo Completo

### Escenario A: Admin crea curso e inscribe candidato
```
1. Admin → /admin-cursos
2. Click "Nuevo Curso"
3. Completa formulario:
   - Título: "Python Avanzado: Programación Asíncrona"
   - Descripción: "Domina async/await y asyncio..."
   - Categoría: Programación
   - Nivel: Avanzado
   - Duración: 40 horas
   - Instructor: "Dr. Alan Turing"
   - Requisitos: "Python básico, POO"
   - Temas: "async/await, asyncio, concurrencia"
4. Click "Crear Curso" → POST /cursos
5. Curso aparece en la lista
6. Click "Inscribir" en el curso
7. Ingresa email: "maria@talentum.plus"
8. Click "Inscribir" → POST /inscripciones
   {
     "candidato_email": "maria@talentum.plus",
     "curso_id": "6789abc..."
   }
9. ✅ Candidato inscrito
```

### Escenario B: Candidato ve y actualiza sus cursos
```
1. Candidato → /mis-cursos
2. Ingresa su email: "maria@talentum.plus"
3. Click "Buscar" → GET /candidatos/maria@talentum.plus/cursos
4. Ve lista de cursos con progreso
5. Mueve slider de progreso a 75%
6. Click "Actualizar" → PUT /inscripciones/{id}/progreso?progreso=0.75
7. ✅ Progreso actualizado
```

### Escenario C: Candidato navega catálogo
```
1. Candidato → /cursos
2. Aplica filtros:
   - Categoría: "Programación"
   - Nivel: "Avanzado"
3. Ve cursos filtrados
4. Click "Ver más" → navegará al detalle (próximamente)
```

## 💾 Estructura de Datos

### Curso (MongoDB)
```json
{
  "_id": "6789abc...",
  "titulo": "Python Avanzado: Programación Asíncrona",
  "descripcion": "Domina async/await y asyncio...",
  "categoria": "Programación",
  "nivel": "Avanzado",
  "duracion_horas": 40,
  "instructor": "Dr. Alan Turing",
  "requisitos": ["Python básico", "POO"],
  "temas": ["async/await", "asyncio", "concurrencia"],
  "fecha_creacion": "2025-01-15T10:00:00Z"
}
```

### Inscripción (MongoDB)
```json
{
  "_id": "inscr123...",
  "candidato_email": "maria@talentum.plus",
  "curso_id": "6789abc...",
  "fecha_inscripcion": "2025-01-20T09:30:00Z",
  "progreso": 0.75,
  "estado": "En Progreso",
  "fecha_completado": null
}
```

## 🔌 Endpoints Backend

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/cursos` | Crear nuevo curso |
| GET | `/cursos` | Listar todos los cursos (con filtros opcionales) |
| GET | `/cursos/{id}` | Obtener detalle de un curso |
| POST | `/inscripciones` | Inscribir candidato a curso |
| GET | `/candidatos/{email}/cursos` | Obtener cursos de un candidato |
| PUT | `/inscripciones/{id}/progreso` | Actualizar progreso (query param: progreso=0.0-1.0) |

## 🎨 Navegación en el Sidebar

```
📊 Dashboard
👥 Candidatos
🎯 Matching
📋 Procesos
🌐 Red

CAPACITACIÓN
  🎓 Admin Cursos    ← NUEVO
  📚 Catálogo
  📖 Mis Cursos

BÚSQUEDAS
  💼 Ofertas
  📝 Mis Aplicaciones

EMPRESA
  📈 Dashboard
```

## ✅ ¿Cómo Probarlo?

1. **Crear un curso:**
   ```bash
   # Navega a: http://localhost:3000/admin-cursos
   # Click "Nuevo Curso"
   # Completa formulario
   # Click "Crear Curso"
   ```

2. **Inscribir candidato:**
   ```bash
   # En /admin-cursos
   # Click "Inscribir" en un curso
   # Ingresa: maria@talentum.plus
   # Click "Inscribir"
   ```

3. **Ver cursos como candidato:**
   ```bash
   # Navega a: http://localhost:3000/mis-cursos
   # Ingresa email: maria@talentum.plus
   # Click "Buscar"
   ```

4. **Actualizar progreso:**
   ```bash
   # En /mis-cursos (después de buscar)
   # Mueve slider de progreso
   # Click "Actualizar Progreso"
   ```

## 🚀 Próximas Mejoras

- [ ] Autenticación: eliminar input de email, usar usuario logueado
- [ ] Detalle del curso con contenido, módulos, videos
- [ ] Certificados al completar (progreso = 100%)
- [ ] Recomendación de cursos basada en skills del candidato
- [ ] Notificaciones cuando se asigna un curso
- [ ] Integración con Neo4j: candidato INSCRITO_EN curso
- [ ] Dashboard de métricas: cursos más populares, tasas de completitud
