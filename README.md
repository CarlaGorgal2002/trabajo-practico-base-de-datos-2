# 📚 Explicación Completa del Proyecto Talentum+

## 🎯 **¿Qué es este proyecto?**

**Talentum+** es una plataforma de gestión de talento IT que utiliza **4 bases de datos diferentes** (persistencia políglota), cada una optimizada para un tipo específico de dato y funcionalidad.

---

## 🏗️ **Arquitectura General**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│              http://localhost:3000                          │
│  - Dashboard, Candidatos, Matching, Procesos, Red           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                          │
│              http://localhost:8080                          │
│  - Endpoints REST                                           │
│  - Sincronización entre BDs (Eventos)                       │
└───┬─────────┬─────────┬─────────┬───────────────────────────┘
    │         │         │         │
    ▼         ▼         ▼         ▼
┌─────────┐ ┌─────┐ ┌──────────┐ ┌────────┐
│ MongoDB │ │Redis│ │PostgreSQL│ │ Neo4j  │
│ :27017  │ │:6379│ │  :5431   │ │ :7474  │
└─────────┘ └─────┘ └──────────┘ └────────┘
```

---

## 🗄️ **Las 4 Bases de Datos y Sus Roles**

### 1️⃣ **MongoDB** (Base NoSQL Documental)
**Puerto:** `27017`  
**Rol:** Almacenar **perfiles de candidatos**

**¿Por qué MongoDB?**
- Datos flexibles (cada candidato puede tener diferentes campos)
- Esquema dinámico (fácil agregar nuevos atributos)
- Búsquedas rápidas por campos indexados

**Datos que guarda:**
```json
{
  "_id": "673abc...",
  "nombre": "Grace Hopper",
  "email": "grace@talentum.plus",
  "seniority": "Senior",
  "skills": ["python", "algorithms", "debugging"],
  "cursos": [
    {
      "codigo": "CS101",
      "nombre": "Introducción a Python",
      "progreso": 0.75
    }
  ]
}
```

**Operaciones:**
- Crear candidatos
- Buscar por email
- Filtrar por skills o seniority
- Actualizar perfiles

---

### 2️⃣ **Redis** (Caché en Memoria)
**Puerto:** `6379`  
**Rol:** **Cache de datos** para respuestas rápidas

**¿Por qué Redis?**
- Ultra rápido (almacena en RAM)
- Reduce carga en otras BDs
- TTL automático (expira datos viejos)

**Datos que cachea:**
```
perfil:grace@talentum.plus → {"nombre":"Grace Hopper","seniority":"Senior",...}
recomendaciones:alan@talentum.plus → [{"rol":"ML Engineer","match":3}]
matching:Backend-python-algorithms → [{candidatos matcheados}]
```

**Funcionamiento:**
1. Primer request → Consulta MongoDB/Neo4j → Guarda en Redis (TTL: 5-10 min)
2. Siguiente request → Lee directamente de Redis (milisegundos)
3. Si hay UPDATE → Invalida caché

---

### 3️⃣ **PostgreSQL** (Base Relacional)
**Puerto:** `5431`  
**Rol:** **Procesos de selección** (datos transaccionales)

**¿Por qué PostgreSQL?**
- Garantías ACID (integridad de datos)
- Relaciones claras (candidato → procesos)
- Ideal para auditoría y compliance

**Tablas:**

**`candidatos`:**
```sql
id          | nombre       | email               | seniority | created_at
------------|--------------|---------------------|-----------|-------------------
uuid-123... | Grace Hopper | grace@talentum.plus | Senior    | 2025-10-20 01:00
```

**`procesos`:**
```sql
id       | candidato_id | puesto              | estado     | feedback          | updated_at
---------|--------------|---------------------|------------|-------------------|------------
uuid-456 | uuid-123     | Backend Developer   | entrevista | Muy buen perfil   | 2025-10-20
```

**Operaciones:**
- Crear proceso de selección
- Actualizar estado (inicial → entrevista → finalista → contratado)
- Historial completo de un candidato
- Reportes y métricas

---

### 4️⃣ **Neo4j** (Base de Grafos)
**Puerto:** `7474` (Browser) / `7687` (Bolt)  
**Rol:** **Recomendaciones, matching y red de contactos**

**¿Por qué Neo4j?**
- Modela relaciones complejas (grafo)
- Algoritmos de matching nativos
- Visualización de redes

**Estructura del grafo:**
```
(Candidato:Grace)-[:DOMINA]->(Skill:Python)
                  -[:DOMINA]->(Skill:Algorithms)
                  -[:POSTULA_A]->(Rol:Backend Dev)
                  -[:MENTOREADO_POR]->(Mentor:Alan)

(Rol:Backend Dev)-[:REQUIERE]->(Skill:Python)
                 -[:REQUIERE]->(Skill:Algorithms)
```

**Operaciones:**
- **Matching:** "¿Qué candidatos tienen las skills que requiere este rol?"
- **Recomendaciones:** "¿A qué roles puede postularse Grace según sus skills?"
- **Red de contactos:** "¿Quiénes son los mentores, colegas de Grace?"

**Query de ejemplo (Cypher):**
```cypher
// Buscar candidatos que matcheen con Backend Developer
MATCH (c:Candidato)-[:DOMINA]->(s:Skill)<-[:REQUIERE]-(r:Rol {nombre: "Backend Developer"})
RETURN c.nombre, COUNT(s) AS match_count
ORDER BY match_count DESC
```

---

## 🔄 **Sincronización entre Bases de Datos (Eventos)**

Cuando ocurre una acción en una BD, se **propaga automáticamente** a las demás:

### Ejemplo: Crear un Candidato

```
1. Usuario llena formulario en React (/crear-candidato)
   ↓
2. Frontend envía POST /candidatos
   ↓
3. Backend (FastAPI):
   a) Guarda en MongoDB ✅
      {nombre, email, skills, seniority, cursos}
   
   b) EVENTO: sincronizar_candidato_creado()
      - Crea nodo en Neo4j ✅
        (Candidato {id: email, nombre, seniority})
        + relaciones [:DOMINA]→(Skill)
      
      - Registra en PostgreSQL ✅
        INSERT INTO candidatos (nombre, email, seniority)
      
      - Cachea en Redis ✅
        SET perfil:email {...} EX 3600
   
   c) Retorna: {"id": "...", "sincronizado": true}
```

### Ejemplo: Actualizar Skills

```
1. Usuario edita skills en /candidatos/grace@talentum.plus
   ↓
2. Frontend envía PUT /candidatos/grace@talentum.plus
   body: {"skills": ["python", "rust", "go"]}
   ↓
3. Backend:
   a) Actualiza MongoDB ✅
      UPDATE perfiles SET skills = [...]
   
   b) EVENTO: sincronizar_candidato_actualizado()
      - Elimina relaciones viejas en Neo4j ✅
        MATCH (c:Candidato)-[r:DOMINA]->() DELETE r
      
      - Crea nuevas relaciones ✅
        MERGE (s:Skill {nombre: "rust"})
        MERGE (c)-[:DOMINA]->(s)
      
      - Invalida caché en Redis ✅
        DEL perfil:grace@talentum.plus
        DEL recomendaciones:grace@talentum.plus
```

### Ejemplo: Matching Automático

```
1. Reclutador busca candidatos para "Backend Developer"
   Skills: [python, algorithms, debugging]
   ↓
2. Frontend envía POST /matching
   ↓
3. Backend:
   a) Consulta Neo4j ✅
      MATCH (c:Candidato)-[:DOMINA]->(s:Skill)
      WHERE s.nombre IN ["python", "algorithms", "debugging"]
      WITH c, COUNT(s) AS match_count
      RETURN c.email, match_count
      ORDER BY match_count DESC
   
   b) Cachea resultado en Redis ✅
      SET matching:Backend-python-algorithms-debugging [{...}] EX 600
   
   c) Retorna candidatos ordenados por % match
```

---

## 🖥️ **Frontend (React)**

### Páginas Principales:

1. **Dashboard** (`/`)
   - Estadísticas generales
   - Total de candidatos, procesos activos
   - Accesos rápidos

2. **Candidatos** (`/candidatos`)
   - Lista todos los candidatos (MongoDB)
   - Filtros por skill/seniority
   - Ver detalles de cada perfil

3. **Crear Candidato** (`/crear-candidato`)
   - Formulario para nuevo candidato
   - Al enviar → POST /candidatos → sincronización automática

4. **Matching** (`/matching`)
   - Buscar candidatos para un puesto
   - Input: puesto + skills requeridos
   - Output: candidatos ordenados por % match (Neo4j)

5. **Procesos** (`/procesos`)
   - Ver procesos de selección (PostgreSQL)
   - Crear nuevo proceso
   - Actualizar estado (entrevista → finalista → contratado)

6. **Red de Contactos** (`/red`)
   - Visualiza grafo de relaciones (Neo4j)
   - Asignar mentores
   - Ver conexiones (skills, roles, mentores)

---

## 🔑 **Flujos de Datos Clave**

### 🎯 **Flujo 1: Recomendaciones Inteligentes**
```
Usuario busca en /recomendaciones/grace@talentum.plus
   ↓
1. Verifica caché Redis
   - Si existe → retorna inmediatamente
   - Si no existe ↓
2. Query a Neo4j:
   "¿Qué roles requieren las skills que Grace domina?"
   MATCH (c:Candidato {id:"grace@..."})-[:DOMINA]->(s:Skill)<-[:REQUIERE]-(r:Rol)
   RETURN r.nombre, COUNT(s) AS match
3. Cachea resultado en Redis (TTL: 10 min)
4. Retorna al frontend
```

### 📊 **Flujo 2: Búsqueda Optimizada**
```
Usuario filtra candidatos por skill="python" en /candidatos
   ↓
1. Consulta MongoDB (indexado por skills)
   db.perfiles.find({"skills": "python"})
2. Si hay muchos resultados, cachea en Redis
3. Frontend muestra cards con:
   - Datos de MongoDB
   - Link a "Ver Procesos" (PostgreSQL)
   - Link a "Ver Red" (Neo4j)
```

### 🔗 **Flujo 3: Sincronización Completa**
```
Crear proceso de selección en /procesos
   ↓
1. INSERT en PostgreSQL (tabla procesos)
2. EVENTO: sincronizar_proceso_creado()
   - Crea relación en Neo4j:
     (Candidato)-[:POSTULA_A {estado:"entrevista"}]->(Rol)
   - Invalida caché Redis del candidato
3. Frontend puede visualizar en grafo Neo4j
```

---

## 📁 **Estructura de Archivos Clave**

```
talentum-plus/
├── src/
│   ├── main.py          # FastAPI app + endpoints REST
│   ├── models.py        # Pydantic schemas (Candidato, Proceso)
│   ├── database.py      # Conexiones a las 4 BDs
│   └── events.py        # Lógica de sincronización
├── frontend/
│   └── src/
│       ├── App.jsx      # Router + navegación
│       └── pages/       # Cada vista (Dashboard, Candidatos, etc)
├── deploy/
│   ├── mongo/init.js    # Inicializa MongoDB
│   ├── postgres/init.sql # Crea tablas en PostgreSQL
│   └── neo4j/bootstrap.cql # Datos iniciales Neo4j
├── docker-compose.yml   # Orquesta las 4 BDs + backend
└── Dockerfile          # Imagen del backend Python
```

---

## 🚀 **¿Cómo funciona end-to-end?**

### Ejemplo Real: Contratar a un Backend Developer

1. **Reclutador abre /matching**
   - Input: "Backend Developer", skills: ["python", "algorithms"]
   
2. **Backend consulta Neo4j:**
   ```cypher
   MATCH (c:Candidato)-[:DOMINA]->(s:Skill)
   WHERE s.nombre IN ["python", "algorithms"]
   RETURN c
   ```
   
3. **Resultados:**
   - Grace Hopper: 100% match (tiene ambas skills)
   - Alan Turing: 50% match (solo algorithms)
   
4. **Reclutador selecciona a Grace → Crea proceso:**
   - POST /procesos
   - Guarda en PostgreSQL: `{candidato: grace, puesto: Backend Dev, estado: inicial}`
   - Neo4j crea: `(Grace)-[:POSTULA_A {estado:"inicial"}]->(Backend Dev)`
   
5. **Entrevistas:**
   - UPDATE estado → "entrevista" → "finalista" → "contratado"
   - Cada cambio se registra en PostgreSQL (auditoría)
   
6. **Contratación:**
   - Asignar mentor en /red
   - POST /mentoring/grace@.../senior@...
   - Neo4j crea: `(Grace)-[:MENTOREADO_POR]->(Senior Dev)`

---

## 🎓 **Ventajas de esta Arquitectura**

| Base de Datos | Ventaja |
|--------------|---------|
| **MongoDB** | Flexibilidad de esquema, búsquedas textuales |
| **Redis** | Velocidad extrema (caché), reduce latencia |
| **PostgreSQL** | Integridad de datos, compliance, reportes |
| **Neo4j** | Matching inteligente, recomendaciones, grafos |

**Resultado:** Sistema escalable, rápido y especializado para cada tipo de dato 🚀

¿Querés que profundice en alguna parte específica? (sincronización, queries, frontend, etc.)