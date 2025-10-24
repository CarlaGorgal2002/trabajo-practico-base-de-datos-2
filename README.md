🎓 Guía Completa del Backend - Sistema de Gestión de Empleo

## 📖 Introducción para Principiantes

### ¿Qué es este proyecto?

Imagina LinkedIn o Indeed: una plataforma donde **personas buscan trabajo** y **empresas publican ofertas**. Nuestro sistema hace exactamente eso, conectando candidatos con empresas y gestionando todo el proceso de contratación.

**Funcionalidades principales:**
- 👤 Candidatos crean perfiles y aplican a ofertas
- 🏢 Empresas publican trabajos y evalúan candidatos
- 📚 Sistema de cursos para capacitación
- 🤝 Red social profesional entre candidatos
- 🎯 Algoritmo de matching (encuentra los mejores candidatos para cada oferta)

### ¿Qué es un Backend?

El **backend** es la parte del sistema que el usuario NO ve, pero que hace todo el trabajo pesado:
- 🗄️ Guarda y recupera información de bases de datos
- 🔐 Verifica que los usuarios sean quienes dicen ser (autenticación)
- ✅ Valida que los datos sean correctos (un email debe tener @)
- 🧮 Realiza cálculos complejos (matching, algoritmos)
- 🚦 Decide quién puede hacer qué (autorización)

**Analogía:** Si una aplicación web fuera un restaurante:
- **Frontend** = El salón donde comes (lo que ves y tocas)
- **Backend** = La cocina (donde se prepara todo)
- **Base de datos** = La despensa (donde se guardan los ingredientes)

---

## 🗄️ Arquitectura Multi-Base de Datos (¿Por qué 4 bases de datos?)

### 🤔 ¿Por qué usar múltiples bases de datos?

**Respuesta corta:** Cada tipo de base de datos es excelente para ciertos problemas, pero mala para otros.

**Analogía:** Es como tener diferentes herramientas:
- 🔨 Martillo (PostgreSQL) → Excelente para clavar clavos (datos estructurados)
- 🪛 Destornillador (MongoDB) → Perfecto para tornillos (datos flexibles)
- ✂️ Tijeras (Neo4j) → Ideal para cortar (relaciones complejas)
- 📝 Post-it (Redis) → Notas rápidas y temporales (caché)

### 1️⃣ **PostgreSQL** - Base de Datos Relacional

**📍 Ubicación:** `deploy/postgres/init.sql`

#### ¿Qué es PostgreSQL?

Es una base de datos **relacional** (también llamada SQL). Piensa en ella como **Excel con superpoderes**:
- Los datos se guardan en **tablas** (como hojas de cálculo)
- Cada tabla tiene **columnas** (campos) con tipos de datos definidos
- Las filas son los **registros** individuales
- Las tablas se pueden **relacionar** entre sí

#### ¿Por qué PostgreSQL?

✅ **Ventajas:**
- **Estructura rígida:** Si digo que "email" es texto y "edad" es número, SIEMPRE será así
- **Integridad de datos:** No puedo crear una aplicación sin que exista el usuario
- **ACID:** Garantiza que las transacciones sean consistentes (todo se guarda o nada)
- **Relaciones complejas:** Perfecto para unir datos de múltiples tablas
- **Consultas SQL potentes:** Lenguaje estándar usado por millones

❌ **Desventajas:**
- **Inflexible:** Difícil agregar campos nuevos después
- **Escalabilidad horizontal limitada:** Complicado distribuir en múltiples servidores
- **No ideal para datos variables:** Si cada usuario tiene campos diferentes, se complica

#### ¿Qué guardamos aquí?

**Datos estructurados con relaciones claras:**

**Tabla `usuarios`:** Base de todos los usuarios
```sql
CREATE TABLE usuarios (
    email VARCHAR PRIMARY KEY,        -- Identificador único
    password_hash VARCHAR NOT NULL,   -- Contraseña encriptada
    nombre VARCHAR NOT NULL,
    rol VARCHAR NOT NULL,             -- 'candidato', 'empresa', 'admin'
    activo BOOLEAN DEFAULT TRUE
);
```
*¿Por qué aquí?* Todos los usuarios tienen exactamente estos campos. Es información crítica que debe ser consistente.

**Tabla `aplicaciones`:** Postulaciones a ofertas
```sql
CREATE TABLE aplicaciones (
    id SERIAL PRIMARY KEY,
    candidato_email VARCHAR REFERENCES usuarios(email),  -- 👈 Relación
    oferta_id VARCHAR NOT NULL,
    fecha_aplicacion TIMESTAMP DEFAULT NOW(),
    estado VARCHAR DEFAULT 'pendiente'
);
```
*¿Por qué aquí?* Necesitamos GARANTIZAR que no puedas aplicar a una oferta sin ser un usuario válido. PostgreSQL nos da esa seguridad con `REFERENCES` (foreign keys).

**Otras tablas:**
- `candidatos` → Extensión del perfil de usuario candidato
- `entrevistas` → Citas programadas (fecha, hora, estado)
- `evaluaciones` → Calificaciones de candidatos (numéricas y estructuradas)
- `procesos` → Estado del proceso de selección

**🚫 ¿Por qué NO usar solo PostgreSQL para todo?**

Imagina que cada candidato tiene habilidades diferentes:
- Juan tiene: Python, React, Docker, AWS, Kubernetes
- María tiene: Java, Spring Boot
- Pedro tiene: Marketing Digital, SEO, SEM, Google Analytics, Facebook Ads, Instagram, TikTok

Con PostgreSQL tendrías que:
1. Crear una tabla `skills` separada para cada skill
2. Crear relaciones complejas
3. Hacer JOINs pesados cada vez que consultes

MongoDB es MUCHO mejor para esto.

---

### 2️⃣ **MongoDB** - Base de Datos NoSQL (Documentos)

**📍 Ubicación:** `deploy/mongo/init.js`

#### ¿Qué es MongoDB?

Es una base de datos **NoSQL de documentos**. Piensa en ella como una **colección de archivos JSON**:
- No hay tablas, hay **colecciones** (carpetas)
- No hay filas, hay **documentos** (archivos JSON)
- Cada documento puede tener **campos diferentes**
- No hay esquema fijo

#### ¿Por qué MongoDB?

✅ **Ventajas:**
- **Flexibilidad extrema:** Cada documento puede ser diferente
- **Rápido para escrituras:** No hay validaciones complejas
- **Escalabilidad horizontal:** Fácil distribuir en múltiples servidores
- **Perfecto para datos variables:** Arrays, objetos anidados, campos opcionales
- **Desarrollo ágil:** Agrega campos sin migrar toda la base

❌ **Desventajas:**
- **Sin garantías fuertes:** Puedes guardar datos inconsistentes
- **Relaciones débiles:** No hay foreign keys ni JOINs nativos
- **Puede volverse desordenado:** Sin disciplina, cada documento será diferente
- **Uso de memoria:** Repite mucha información

#### ¿Qué guardamos aquí?

**Colección `perfiles`:** Información extendida de candidatos
```javascript
{
  "_id": ObjectId("..."),
  "email": "juan@ejemplo.com",
  "nombre": "Juan Pérez",
  "skills": ["Python", "FastAPI", "MongoDB", "Docker"],  // 👈 Array!
  "experiencia": "5 años como backend developer...",
  "educacion": "Ingeniería en Sistemas - UADE",
  "portfolio": "https://juan.dev",
  "linkedin": "https://linkedin.com/in/juanperez"
}
```
*¿Por qué aquí?* 
- ✅ Cada candidato tiene diferentes skills
- ✅ Skills es un array de tamaño variable
- ✅ Puedo agregar campos nuevos (portfolio, github) sin tocar la estructura

**Colección `ofertas`:** Publicaciones de trabajo
```javascript
{
  "_id": ObjectId("..."),
  "titulo": "Backend Developer Python",
  "empresa": "universidad@uade.edu.ar",
  "descripcion": "Buscamos desarrollador con experiencia...",
  "skills_requeridos": ["Python", "FastAPI", "PostgreSQL"],  // 👈 Array
  "salario": 50000,
  "ubicacion": "CABA",
  "modalidad": "remoto",
  "estado": "abierta"
}
```
*¿Por qué aquí?* Las skills requeridas varían mucho entre ofertas. MongoDB maneja arrays perfectamente.

**Colección `cursos`:** Capacitaciones
```javascript
{
  "_id": ObjectId("..."),
  "nombre": "Python Avanzado",
  "descripcion": "Aprende async, decorators, metaclasses...",
  "skills": ["Python", "Programación Avanzada"],  // 👈 Skills que otorga
  "duracion": 40,
  "nivel": "avanzado"
}
```

**Colección `inscripciones`:** Relación candidato-curso
```javascript
{
  "_id": ObjectId("..."),
  "candidato_email": "juan@ejemplo.com",
  "curso_id": ObjectId("..."),
  "fecha_inscripcion": "2025-10-20",
  "estado": "aprobado",  // 'inscrito', 'cursando', 'aprobado', 'reprobado'
  "nota": 8.5
}
```

**🚫 ¿Por qué NO usar solo MongoDB para todo?**

MongoDB no tiene relaciones fuertes. Podrías crear una aplicación con un email que no existe en usuarios. No hay validación de integridad referencial. Para datos críticos (usuarios, aplicaciones, dinero), necesitas PostgreSQL.

---

### 3️⃣ **Neo4j** - Base de Datos de Grafos

**📍 Ubicación:** `deploy/neo4j/bootstrap.cql`

#### ¿Qué es Neo4j?

Es una base de datos **de grafos**. Piensa en ella como **Facebook Friends o LinkedIn Connections**:
- Los datos son **nodos** (círculos = personas, empresas, skills)
- Las conexiones son **relaciones** (flechas = conoce_a, trabaja_en, tiene_skill)
- Optimizada para consultas de red (amigos de amigos, camino más corto)

#### ¿Por qué Neo4j?

✅ **Ventajas:**
- **Relaciones como ciudadanos de primera clase:** Las conexiones son tan importantes como los datos
- **Consultas de red ultra-rápidas:** "Amigos de mis amigos" en milisegundos
- **Visualización natural:** Los datos se ven como un grafo visual
- **Patrones complejos:** "Encuentra candidatos conectados a empleados de mi empresa"
- **Recomendaciones:** "Personas que tal vez conozcas"

❌ **Desventajas:**
- **Curva de aprendizaje:** Cypher (su lenguaje) es diferente a SQL
- **No ideal para reportes:** Agregaciones y estadísticas son complejas
- **Overhead:** Para datos sin relaciones es más lento que SQL
- **Costo:** Escalar Neo4j es caro

#### ¿Qué guardamos aquí?

**Nodos y relaciones:**

```cypher
// Nodo Candidato
CREATE (juan:Candidato {
  email: 'juan@ejemplo.com',
  nombre: 'Juan Pérez'
})

// Nodo Skill
CREATE (python:Skill {nombre: 'Python'})

// Relación: Juan tiene la skill Python
CREATE (juan)-[:TIENE_SKILL {nivel: 'Avanzado'}]->(python)

// Relación: Juan conoce a María
CREATE (juan)-[:CONECTADO_CON {desde: '2024-01-15'}]->(maria)
```

**Consulta poderosa:**
```cypher
// Encuentra candidatos conectados a mis empleados que tengan Python
MATCH (miEmpleado:Candidato)-[:TRABAJA_EN]->(miEmpresa:Empresa)
MATCH (miEmpleado)-[:CONECTADO_CON]-(amigo:Candidato)
MATCH (amigo)-[:TIENE_SKILL]->(skill:Skill {nombre: 'Python'})
RETURN amigo.nombre, amigo.email
```

**🎯 Caso de uso real en nuestro sistema:**

Red de contactos profesionales. Un candidato puede:
- Ver su red de contactos
- Ver contactos de sus contactos (2do grado)
- Encontrar "camino" hacia un empleado de una empresa objetivo
- Recibir recomendaciones de conexiones

**🚫 ¿Por qué NO usar solo Neo4j para todo?**

Neo4j es excelente para relaciones, pero terrible para datos tabulares simples. Guardar 10,000 entrevistas con fecha/hora/estado es mejor en PostgreSQL. Neo4j tiene overhead y es más lento para consultas simples.

---

### 4️⃣ **Redis** - Caché en Memoria

**📍 Puerto:** 6379 (sin archivo de init, se configura en el código)

#### ¿Qué es Redis?

Es una base de datos **en memoria** (RAM, no disco). Piensa en ella como **notas Post-it temporales**:
- Datos en formato **clave-valor** (como un diccionario)
- **Ultra rápido:** Todo está en RAM
- **Temporal:** Los datos expiran automáticamente (TTL = Time To Live)

#### ¿Por qué Redis?

✅ **Ventajas:**
- **VELOCIDAD EXTREMA:** 100,000+ operaciones por segundo
- **Reduce carga en otras BD:** Evita consultas repetidas
- **TTL automático:** Los datos viejos se borran solos
- **Tipos de datos avanzados:** Sets, listas, hashes, sorted sets

❌ **Desventajas:**
- **Volatil:** Si se reinicia, pierdes los datos (a menos que uses persistencia)
- **Limitado por RAM:** No puedes guardar terabytes
- **No es base de datos principal:** Solo para caché y datos temporales

#### ¿Qué guardamos aquí?

**Caché de perfiles:**
```python
# Clave: perfil:{email}
# Valor: JSON del perfil
# TTL: 1 hora (3600 segundos)

redis.setex(
    'perfil:juan@ejemplo.com',
    3600,
    json.dumps(perfil_completo)
)
```

**Lógica:**
1. Usuario pide perfil de Juan
2. Backend pregunta a Redis: "¿Tienes perfil:juan@ejemplo.com?"
3. ✅ **Cache HIT:** Redis responde en 1ms → Devuelve datos
4. ❌ **Cache MISS:** Redis no tiene → Consulta MongoDB (50ms) → Guarda en Redis → Devuelve datos

**Beneficio:** Si 1000 usuarios piden el perfil de Juan, solo la primera consulta va a MongoDB. Las otras 999 son instantáneas desde Redis.

**Otros usos:**
- Resultados de matching (cálculos costosos)
- Listas de cursos populares
- Recomendaciones de ofertas

**🚫 ¿Por qué NO usar solo Redis para todo?**

Redis es volátil. Si el servidor se reinicia, pierdes TODO. No puedes confiar en Redis para datos críticos. Es solo un acelerador.

---

## 🛠️ Tecnología Backend: FastAPI (Python)

### ¿Qué es FastAPI?

**FastAPI** es un framework web moderno para Python. Piensa en él como el **constructor de APIs REST**:
- Define **rutas** (URLs) y qué hacer cuando alguien las visita
- **Valida** automáticamente los datos que llegan
- **Documenta** automáticamente tu API (Swagger UI)
- **Rápido** (tan rápido como Node.js)
- **Type hints:** Usa tipos de Python para validar todo

**Alternativas que NO elegimos:**
- ❌ Django: Demasiado grande y opinionado para una API
- ❌ Flask: Más simple pero sin validación automática
- ❌ Express (Node.js): Preferimos Python por el ecosistema de data science

---

## 🌐 ¿Qué son los Endpoints?

### Concepto básico

Un **endpoint** es como una **puerta específica** en tu aplicación:
- Cada puerta tiene una **dirección** (URL)
- Cada puerta acepta ciertos **métodos** (GET, POST, PUT, DELETE)
- Cada puerta hace algo específico

**Analogía:** Tu backend es un edificio con muchas puertas:
- 🚪 `GET /ofertas` → Puerta para "ver todas las ofertas"
- 🚪 `POST /aplicaciones` → Puerta para "crear una aplicación a una oferta"
- 🚪 `DELETE /skills/{skill}` → Puerta para "borrar una habilidad"

### Métodos HTTP (Verbos)

- **GET** 👁️ = Leer/Ver (no modifica nada)
- **POST** ➕ = Crear algo nuevo
- **PUT** / **PATCH** ✏️ = Actualizar algo existente
- **DELETE** 🗑️ = Eliminar algo

---

## 📂 Estructura del Backend

### 📄 `src/main.py` - Archivo Principal

Este es el **corazón de la aplicación**. Aquí están TODOS los endpoints.

#### Inicialización de FastAPI

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Talentum Plus API")

# CORS: Permite que el frontend (React) se comunique con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend Vite
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE
    allow_headers=["*"]
)
```

---

### 🔓 Endpoints Públicos (Sin autenticación)

#### 1. Registro de Candidato

```python
@app.post("/register")
def register(candidato: CandidatoCreate):
    """
    Registra un nuevo candidato en el sistema
    
    ¿Qué hace?
    1. Valida que el email no exista
    2. Hashea la contraseña (nunca guardes contraseñas en texto plano!)
    3. Guarda en PostgreSQL (tabla usuarios + tabla candidatos)
    4. Crea nodo en Neo4j para la red social
    """
```

**Flujo paso a paso:**

```python
# 1. Conectar a PostgreSQL
conn = get_postgres_connection()
cursor = conn.cursor()

# 2. Verificar si el email ya existe
cursor.execute("SELECT email FROM usuarios WHERE email = %s", (candidato.email,))
if cursor.fetchone():
    raise HTTPException(status_code=400, detail="Email ya registrado")

# 3. Hashear la contraseña con bcrypt
password_hash = get_password_hash(candidato.password)

# 4. Insertar en tabla usuarios
cursor.execute("""
    INSERT INTO usuarios (email, password_hash, nombre, rol)
    VALUES (%s, %s, %s, 'candidato')
""", (candidato.email, password_hash, candidato.nombre))

# 5. Insertar en tabla candidatos (perfil extendido)
cursor.execute("""
    INSERT INTO candidatos (email, telefono, fecha_nacimiento)
    VALUES (%s, %s, %s)
""", (candidato.email, candidato.telefono, candidato.fecha_nacimiento))

# 6. Commit (guardar cambios permanentemente)
conn.commit()

# 7. Crear nodo en Neo4j para red de contactos
neo4j = get_neo4j_driver()
with neo4j.session() as session:
    session.run("""
        CREATE (c:Candidato {
            email: $email,
            nombre: $nombre
        })
    """, email=candidato.email, nombre=candidato.nombre)

# 8. Retornar confirmación
return {"mensaje": "Candidato registrado exitosamente"}
```

**¿Por qué PostgreSQL Y Neo4j?**
- PostgreSQL: Datos de login y perfil básico (críticos, estructurados)
- Neo4j: Para la red social (relaciones futuras con otros candidatos)

#### 2. Login (Autenticación)

```python
@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Autentica un usuario y devuelve un token JWT
    
    ¿Qué es JWT?
    JSON Web Token = Una "credencial digital" cifrada que identifica al usuario
    
    Es como una pulsera de un festival:
    - Te la dan en la entrada (login)
    - La muestras en cada atracción (endpoint)
    - Tiene información sobre ti (email, rol)
    - Expira después de un tiempo
    """
```

**Flujo:**

```python
# 1. Buscar usuario en PostgreSQL
cursor.execute("""
    SELECT email, password_hash, rol 
    FROM usuarios 
    WHERE email = %s AND activo = TRUE
""", (form_data.username,))  # username en OAuth2 es el email

usuario = cursor.fetchone()
if not usuario:
    raise HTTPException(status_code=401, detail="Usuario no encontrado")

# 2. Verificar contraseña
email, password_hash, rol = usuario
if not verify_password(form_data.password, password_hash):
    raise HTTPException(status_code=401, detail="Contraseña incorrecta")

# 3. Crear token JWT (válido por 7 días)
access_token = create_access_token(
    data={"sub": email, "rol": rol},
    expires_delta=timedelta(days=7)
)

# 4. Retornar token
return {
    "access_token": access_token,
    "token_type": "bearer",  # Tipo de token (estándar)
    "rol": rol
}
```

**¿Cómo funciona JWT?**

```python
# Token JWT tiene 3 partes separadas por puntos:
# header.payload.signature

# Ejemplo:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
# eyJzdWIiOiJqdWFuQGVqZW1wbG8uY29tIiwicm9sIjoiY2FuZGlkYXRvIn0.
# SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

# Header: {"alg": "HS256", "typ": "JWT"}
# Payload: {"sub": "juan@ejemplo.com", "rol": "candidato", "exp": 1730000000}
# Signature: Firma criptográfica para verificar autenticidad
```

---

### 👤 Endpoints de Candidato (Requieren autenticación)

Todos estos endpoints usan `Depends(verificar_token)` para validar que el usuario esté autenticado.

#### 3. Ver ofertas disponibles

```python
@app.get("/ofertas")
def listar_ofertas(usuario: dict = Depends(verificar_token)):
    """
    Lista todas las ofertas de trabajo activas
    
    Multi-BD: Usa MongoDB (ofertas) + Redis (caché)
    """
```

**Flujo con caché:**

```python
# 1. Intentar obtener desde Redis (caché)
cache_key = "ofertas:activas"
cached = redis_client.get(cache_key)

if cached:
    # Cache HIT: Retornar desde Redis (1ms)
    return json.loads(cached)

# Cache MISS: Consultar MongoDB (50ms)
mongo_db = get_mongo_db()
ofertas = list(mongo_db.ofertas.find(
    {"estado": "abierta"},
    {"_id": 0}  # No retornar el ObjectId
).sort("fecha_publicacion", -1))

# Guardar en caché por 10 minutos
redis_client.setex(
    cache_key,
    600,  # TTL: 600 segundos = 10 minutos
    json.dumps(ofertas, default=str)
)

return ofertas
```

**¿Por qué MongoDB?**
Las ofertas tienen campos variables (skills_requeridos es un array de tamaño indefinido).

#### 4. Aplicar a una oferta

```python
@app.post("/aplicaciones")
def aplicar_oferta(aplicacion: AplicacionCreate, usuario: dict = Depends(verificar_token)):
    """
    Crea una aplicación de un candidato a una oferta
    
    Multi-BD:
    - PostgreSQL: Guarda la aplicación (registro crítico)
    - MongoDB: Verifica que la oferta exista
    - Redis: Invalida caché de "mis aplicaciones"
    """
```

**Flujo completo:**

```python
candidato_email = usuario["email"]

# 1. Verificar que la oferta existe en MongoDB
mongo_db = get_mongo_db()
oferta = mongo_db.ofertas.find_one({"_id": ObjectId(aplicacion.oferta_id)})
if not oferta:
    raise HTTPException(status_code=404, detail="Oferta no encontrada")

# 2. Verificar que no haya aplicado antes
conn = get_postgres_connection()
cursor = conn.cursor()

cursor.execute("""
    SELECT id FROM aplicaciones 
    WHERE candidato_email = %s AND oferta_id = %s
""", (candidato_email, aplicacion.oferta_id))

if cursor.fetchone():
    raise HTTPException(status_code=400, detail="Ya aplicaste a esta oferta")

# 3. Crear la aplicación en PostgreSQL
cursor.execute("""
    INSERT INTO aplicaciones (candidato_email, oferta_id, estado)
    VALUES (%s, %s, 'pendiente')
    RETURNING id
""", (candidato_email, aplicacion.oferta_id))

aplicacion_id = cursor.fetchone()[0]
conn.commit()

# 4. Invalidar caché de "mis aplicaciones" en Redis
redis_client.delete(f"aplicaciones:{candidato_email}")

# 5. Registrar evento en MongoDB (auditoría)
mongo_db.historial_cambios.insert_one({
    "tipo": "aplicacion_creada",
    "candidato_email": candidato_email,
    "oferta_id": aplicacion.oferta_id,
    "timestamp": datetime.utcnow()
})

return {"mensaje": "Aplicación enviada", "id": aplicacion_id}
```

**¿Por qué PostgreSQL?**
Las aplicaciones son transacciones críticas. Necesitamos ACID:
- **Atomicidad:** O se guarda todo o nada
- **Consistencia:** No puedes aplicar con email inválido (foreign key)
- **Aislamiento:** Dos personas no pueden crear la misma aplicación al mismo tiempo
- **Durabilidad:** Una vez guardada, NUNCA se pierde

#### 5. Ver mis habilidades (skills)

```python
@app.get("/candidatos/{email}/skills")
def obtener_skills(email: str, usuario: dict = Depends(verificar_token)):
    """
    Obtiene las habilidades de un candidato
    
    Multi-BD: MongoDB (array en perfil) + Neo4j (respaldo)
    """
```

**Flujo:**

```python
# 1. Buscar perfil en MongoDB
mongo_db = get_mongo_db()
perfil = mongo_db.perfiles.find_one({"email": email})

if perfil and "skills" in perfil:
    # Migración automática: Si skills es string, convertir a array
    if isinstance(perfil["skills"], str):
        skills_array = [s.strip() for s in perfil["skills"].split(",")]
        mongo_db.perfiles.update_one(
            {"email": email},
            {"$set": {"skills": skills_array}}
        )
        return {"email": email, "skills": skills_array}
    
    # Ya es array
    return {"email": email, "skills": perfil["skills"]}

# 2. Fallback: Buscar en Neo4j
neo4j = get_neo4j_driver()
with neo4j.session() as session:
    result = session.run("""
        MATCH (c:Candidato {email: $email})-[:TIENE_SKILL]->(s:Skill)
        RETURN s.nombre as skill
    """, email=email)
    
    skills = [record["skill"] for record in result]
    return {"email": email, "skills": skills}
```

**¿Por qué MongoDB con array?**

Antes teníamos una colección `skills` separada con un documento por cada skill:
```javascript
{skill: "Python", candidato_email: "juan@ejemplo.com"}
{skill: "FastAPI", candidato_email: "juan@ejemplo.com"}
{skill: "Docker", candidato_email: "juan@ejemplo.com"}
```

**Problema:** 3 consultas a la BD para obtener 3 skills. Ineficiente.

**Solución:** Array en el perfil
```javascript
{
  email: "juan@ejemplo.com",
  skills: ["Python", "FastAPI", "Docker"]  // 👈 Una consulta
}
```

MongoDB es perfecto para esto con operadores como `$addToSet` (agrega sin duplicar).

#### 6. Agregar habilidad

```python
@app.post("/candidatos/{email}/skills")
def agregar_skill(email: str, skill_data: SkillCreate, usuario: dict = Depends(verificar_token)):
    """
    Agrega una skill al perfil del candidato
    
    Usa $addToSet: Operador de MongoDB que agrega SOLO si no existe
    """
```

**Flujo:**

```python
skill = skill_data.skill.strip()

# 1. Agregar a MongoDB usando $addToSet (evita duplicados)
mongo_db = get_mongo_db()
result = mongo_db.perfiles.update_one(
    {"email": email},
    {
        "$addToSet": {"skills": skill},  # 👈 Solo agrega si no existe
        "$setOnInsert": {  # Solo si se crea el documento
            "email": email,
            "created_at": datetime.utcnow()
        }
    },
    upsert=True  # Crea el perfil si no existe
)

# 2. También agregar a Neo4j (para matching basado en grafo)
neo4j = get_neo4j_driver()
with neo4j.session() as session:
    session.run("""
        MERGE (c:Candidato {email: $email})
        MERGE (s:Skill {nombre: $skill})
        MERGE (c)-[:TIENE_SKILL]->(s)
    """, email=email, skill=skill)

# 3. Invalidar caché
redis_client.delete(f"perfil:{email}")

return {"mensaje": "Skill agregada exitosamente"}
```

**Ventajas de $addToSet:**
```python
# Sin $addToSet (manual):
perfil = mongo_db.perfiles.find_one({"email": email})
if skill not in perfil["skills"]:  # 👈 Verificación manual
    perfil["skills"].append(skill)
    mongo_db.perfiles.update_one({"email": email}, {"$set": {"skills": perfil["skills"]}})

# Con $addToSet (atómico):
mongo_db.perfiles.update_one(
    {"email": email},
    {"$addToSet": {"skills": skill}}  # 👈 MongoDB verifica automáticamente
)
```

---

### 🏢 Endpoints de Empresa

#### 7. Publicar oferta

```python
@app.post("/ofertas")
def crear_oferta(oferta: OfertaCreate, usuario: dict = Depends(verificar_token)):
    """
    Publica una nueva oferta de trabajo
    
    Multi-BD: MongoDB (documento flexible) + Neo4j (relaciones)

    """
```

**Flujo:**

```python
empresa_email = usuario["email"]

# 1. Crear documento en MongoDB
mongo_db = get_mongo_db()
oferta_doc = {
    "titulo": oferta.titulo,
    "empresa": empresa_email,
    "descripcion": oferta.descripcion,
    "skills_requeridos": oferta.skills_requeridos,  # Array
    "salario": oferta.salario,
    "ubicacion": oferta.ubicacion,
    "modalidad": oferta.modalidad,  # remoto, presencial, híbrido
    "tipo_contrato": oferta.tipo_contrato,  # full-time, part-time
    "estado": "abierta",
    "fecha_publicacion": datetime.utcnow(),
    "seniority_minimo": oferta.seniority_minimo  # Puede ser null
}

result = mongo_db.ofertas.insert_one(oferta_doc)
oferta_id = str(result.inserted_id)

# 2. Crear nodo en Neo4j (para matching basado en grafo)
neo4j = get_neo4j_driver()
with neo4j.session() as session:
    session.run("""
        MATCH (e:Empresa {email: $empresa_email})
        CREATE (o:Oferta {
            id: $oferta_id,
            titulo: $titulo
        })
        CREATE (e)-[:PUBLICO]->(o)
    """, empresa_email=empresa_email, oferta_id=oferta_id, titulo=oferta.titulo)
    
    # Crear relaciones con skills requeridos
    for skill in oferta.skills_requeridos:
        session.run("""
            MATCH (o:Oferta {id: $oferta_id})
            MERGE (s:Skill {nombre: $skill})
            MERGE (o)-[:REQUIERE_SKILL]->(s)
        """, oferta_id=oferta_id, skill=skill)

# 3. Invalidar caché de ofertas
redis_client.delete("ofertas:activas")

return {"mensaje": "Oferta publicada", "id": oferta_id}
```

**¿Por qué MongoDB?**
- Skills requeridos es un array de tamaño variable
- Descripción puede ser texto largo sin límite
- Fácil agregar campos nuevos (beneficios, cultura, etc.)

#### 8. Matching de candidatos

```python
@app.get("/ofertas/{oferta_id}/matches")
def matching_candidatos(oferta_id: str, usuario: dict = Depends(verificar_token)):
    """
    Encuentra los candidatos más compatibles con una oferta
    
    Algoritmo de matching:
    1. Busca candidatos con las skills requeridas (Neo4j)
    2. Calcula porcentaje de match
    3. Ordena por compatibilidad
    
    Usa Neo4j porque es consulta de grafo compleja
    """
```

**Flujo:**

```python
# 1. Obtener skills requeridas de la oferta (MongoDB)
mongo_db = get_mongo_db()
oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
skills_requeridos = oferta["skills_requeridos"]

# 2. Consulta compleja en Neo4j
neo4j = get_neo4j_driver()
with neo4j.session() as session:
    result = session.run("""
        MATCH (c:Candidato)-[:TIENE_SKILL]->(s:Skill)
        WHERE s.nombre IN $skills_requeridos
        WITH c, collect(s.nombre) as skills_candidato
        RETURN 
            c.email as email,
            c.nombre as nombre,
            skills_candidato,
            size(skills_candidato) as skills_match,
            (size(skills_candidato) * 100.0 / $total_skills) as porcentaje_match
        ORDER BY skills_match DESC
        LIMIT 20
    """, skills_requeridos=skills_requeridos, total_skills=len(skills_requeridos))
    
    candidatos = []
    for record in result:
        candidatos.append({
            "email": record["email"],
            "nombre": record["nombre"],
            "skills_match": record["skills_match"],
            "porcentaje_match": round(record["porcentaje_match"], 2),
            "skills": record["skills_candidato"]
        })

return {"candidatos": candidatos, "total": len(candidatos)}
```

**Ejemplo de resultado:**
```json
{
  "candidatos": [
    {
      "email": "juan@ejemplo.com",
      "nombre": "Juan Pérez",
      "skills_match": 3,
      "porcentaje_match": 100.0,
      "skills": ["Python", "FastAPI", "PostgreSQL"]
    },
    {
      "email": "maria@ejemplo.com",
      "nombre": "María González",
      "skills_match": 2,
      "porcentaje_match": 66.67,
      "skills": ["Python", "Django"]
    }
  ],
  "total": 2
}
```

**¿Por qué Neo4j?**
Esta consulta en PostgreSQL sería:
```sql
SELECT c.email, COUNT(s.skill) as matches
FROM candidatos c
JOIN candidatos_skills cs ON c.email = cs.email
JOIN skills s ON cs.skill = s.nombre
WHERE s.nombre IN ('Python', 'FastAPI', 'PostgreSQL')
GROUP BY c.email
ORDER BY matches DESC
```
Funciona, pero Neo4j es 10x más rápido para este tipo de consultas de relaciones.

---

### 📚 Endpoints de Cursos

#### 9. Rendir examen de curso

```python
@app.post("/inscripciones/{inscripcion_id}/rendir-examen")
def rendir_examen(inscripcion_id: str, usuario: dict = Depends(verificar_token)):
    """
    Simula rendir un examen de curso y otorga skills si aprueba
    
    Lógica:
    - Nota aleatoria entre nota_anterior y 10
    - Aprueba con nota >= 4
    - Si aprueba, agrega skills del curso al perfil
    - Las notas NUNCA bajan (solo suben o quedan igual)
    """
```

**Flujo:**

```python
mongo_db = get_mongo_db()

# 1. Obtener inscripción
inscripcion = mongo_db.inscripciones.find_one({"_id": ObjectId(inscripcion_id)})
if not inscripcion:
    raise HTTPException(status_code=404, detail="Inscripción no encontrada")

candidato_email = inscripcion["candidato_email"]
curso_id = inscripcion["curso_id"]

# 2. Obtener curso
curso = mongo_db.cursos.find_one({"_id": ObjectId(curso_id)})
skills_curso = curso.get("skills", [])

# 3. Generar nota aleatoria (entre nota anterior y 10)
import random
nota_anterior = inscripcion.get("nota", 0)
nueva_nota = round(random.uniform(nota_anterior, 10), 2)

# 4. Determinar si aprobó
estado = "aprobado" if nueva_nota >= 4 else "reprobado"

# 5. Actualizar inscripción
mongo_db.inscripciones.update_one(
    {"_id": ObjectId(inscripcion_id)},
    {
        "$set": {
            "nota": nueva_nota,
            "estado": estado,
            "fecha_examen": datetime.utcnow()
        }
    }
)

# 6. Si aprobó, otorgar skills del curso
if estado == "aprobado" and skills_curso:
    # Agregar skills al perfil (array)
    mongo_db.perfiles.update_one(
        {"email": candidato_email},
        {
            "$addToSet": {"skills": {"$each": skills_curso}},  # 👈 Agrega todas las skills
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )
    
    # También agregar a Neo4j
    neo4j = get_neo4j_driver()
    with neo4j.session() as session:
        for skill in skills_curso:
            session.run("""
                MATCH (c:Candidato {email: $email})
                MERGE (s:Skill {nombre: $skill})
                MERGE (c)-[:TIENE_SKILL {fuente: 'curso'}]->(s)
            """, email=candidato_email, skill=skill)
    
    # Invalidar caché
    redis_client.delete(f"perfil:{candidato_email}")
    redis_client.delete(f"skills:{candidato_email}")

return {
    "nota": nueva_nota,
    "estado": estado,
    "mensaje": f"¡Aprobaste! Se agregaron {len(skills_curso)} skills a tu perfil" if estado == "aprobado" else "No aprobaste el examen"
}
```

**Operador $each con $addToSet:**
```python
# Sin $each (ERROR):
mongo_db.perfiles.update_one(
    {"email": email},
    {"$addToSet": {"skills": ["Python", "FastAPI"]}}  # ❌ Agrega el array como un elemento
)
# Resultado: skills = [["Python", "FastAPI"]]  # 👈 Array dentro de array!

# Con $each (CORRECTO):
mongo_db.perfiles.update_one(
    {"email": email},
    {"$addToSet": {"skills": {"$each": ["Python", "FastAPI"]}}}  # ✅ Agrega cada elemento
)
# Resultado: skills = ["Python", "FastAPI"]  # 👈 Correcto!
```

---

## 📄 Archivos de Soporte

### `src/database.py` - Conexiones a Bases de Datos

```python
import psycopg2
from pymongo import MongoClient
from neo4j import GraphDatabase
import redis

# PostgreSQL
def get_postgres_connection():
    return psycopg2.connect(
        host="localhost",
        port=5431,
        database="talentum",
        user="postgres",
        password="postgres"
    )

# MongoDB
def get_mongo_db():
    client = MongoClient("mongodb://localhost:27017/")
    return client.talentum

# Neo4j
def get_neo4j_driver():
    return GraphDatabase.driver(
        "bolt://localhost:7687",
        auth=("neo4j", "neo4j1234")
    )

# Redis
redis_client = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True  # Retorna strings, no bytes
)
```

### `src/models.py` - Schemas de Validación (Pydantic)

```python
from pydantic import BaseModel, EmailStr
from typing import Optional, List

class CandidatoCreate(BaseModel):
    """
    Schema para validar datos de registro de candidato
    
    Pydantic valida automáticamente:
    - email debe ser email válido
    - nombre no puede estar vacío
    - password mínimo 6 caracteres
    """
    email: EmailStr  # 👈 Valida formato de email
    password: str
    nombre: str
    telefono: Optional[str] = None
    fecha_nacimiento: Optional[str] = None

class OfertaCreate(BaseModel):
    titulo: str
    descripcion: str
    skills_requeridos: List[str]  # 👈 Array de strings
    salario: Optional[float] = None
    ubicacion: str
    modalidad: str  # remoto, presencial, híbrido
    tipo_contrato: str  # full-time, part-time, freelance
    seniority_minimo: Optional[int] = None  # Años de experiencia

class Curso(BaseModel):
    nombre: str
    codigo: str
    descripcion: str
    skills: List[str] = []  # 👈 Skills que otorga el curso
    duracion: int  # Horas
    nivel: str  # básico, intermedio, avanzado
```

**Ejemplo de validación automática:**
```python
# Request del frontend
{
  "email": "no-es-un-email",  # ❌ Inválido
  "password": "123",          # ❌ Muy corto
  "nombre": ""                # ❌ Vacío
}

# FastAPI rechaza automáticamente:
{
  "detail": [
    {"loc": ["body", "email"], "msg": "value is not a valid email address"},
    {"loc": ["body", "password"], "msg": "ensure this value has at least 6 characters"},
    {"loc": ["body", "nombre"], "msg": "field required"}
  ]
}
```

### `src/auth.py` - Sistema de Autenticación JWT

```python
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta

# Configuración
SECRET_KEY = "tu-clave-secreta-super-segura"  # En producción: variable de entorno
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt
    
    ¿Por qué no guardar contraseñas en texto plano?
    - Si hackean la BD, tienen todas las contraseñas
    - Los usuarios reusan contraseñas en múltiples sitios
    
    bcrypt es "one-way": No se puede revertir
    "hola123" → "$2b$12$KIXxL3..." (siempre diferente por el "salt")
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña coincide con el hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta):
    """
    Crea un JWT token
    
    Token contiene:
    - sub: Email del usuario (subject)
    - rol: candidato/empresa/admin
    - exp: Fecha de expiración
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verificar_token(token: str):
    """
    Valida un JWT y retorna los datos del usuario
    
    Usado en Depends() de FastAPI:
    @app.get("/ofertas")
    def listar_ofertas(usuario: dict = Depends(verificar_token)):
                                         👆 FastAPI llama automáticamente
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        rol = payload.get("rol")
        
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        return {"email": email, "rol": rol}
    
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")
```

---

## 🔐 Roles y Permisos

### Sistema de Autorización

```python
def require_role(required_role: str):
    """
    Decorator para verificar rol del usuario
    
    Uso:
    @app.post("/cursos")
    def crear_curso(curso: CursoCreate, usuario: dict = Depends(require_role("admin"))):
        ...
    """
    def role_checker(usuario: dict = Depends(verificar_token)):
        if usuario["rol"] != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"Solo usuarios con rol {required_role} pueden acceder"
            )
        return usuario
    return role_checker
```

### **Candidato** (`rol: "candidato"`)
- ✅ Ver ofertas
- ✅ Aplicar a ofertas
- ✅ Ver sus aplicaciones
- ✅ Inscribirse en cursos
- ✅ Gestionar skills
- ✅ Red de contactos
- ❌ Publicar ofertas (solo empresas)
- ❌ Crear cursos (solo admin)

### **Empresa** (`rol: "empresa"`)
- ✅ Publicar ofertas
- ✅ Ver candidatos que aplicaron
- ✅ Programar entrevistas
- ✅ Evaluar candidatos
- ✅ Matching
- ❌ Aplicar a ofertas (solo candidatos)
- ❌ Crear cursos (solo admin)

### **Admin** (`rol: "admin"`)
- ✅ Crear y gestionar cursos
- ✅ Ver estadísticas globales
- ✅ (Potencialmente) acceso a todo

---

## 🎨 Frontend (Resumen)

El frontend (React + Vite) es la interfaz visual que los usuarios ven. Se comunica con el backend mediante **peticiones HTTP**:

```javascript
// frontend/src/api/axios.js
import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080'  // URL del backend
});

// Interceptor: Agrega el token JWT automáticamente a cada request
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;  // 👈 JWT
    }
    return config;
});

export default instance;
```

**Ejemplo de uso:**
```javascript
// frontend/src/pages/Ofertas.jsx
import axios from '../api/axios';

async function cargarOfertas() {
    const { data } = await axios.get('/ofertas');  // 👈 Llama al endpoint
    setOfertas(data);
}
```

---

## 🐳 Despliegue con Docker

### `docker-compose.yml` - Orquestación de Servicios

```yaml
services:
  # Backend FastAPI
  app:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - mongo
      - postgres
      - neo4j
      - redis
  
  # Base de datos relacional
  postgres:
    image: postgres:16
    ports:
      - "5431:5432"
    volumes:
      - ./deploy/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
  
  # Base de datos de documentos
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db  # 👈 Volumen persistente
      - ./deploy/mongo/init.js:/docker-entrypoint-initdb.d/init.js
  
  # Base de datos de grafos
  neo4j:
    image: neo4j:5
    ports:
      - "7474:7474"  # Interfaz web
      - "7687:7687"  # Protocolo Bolt
    volumes:
      - neo4j-data:/data  # 👈 Volumen persistente
  
  # Caché en memoria
  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  mongo-data:  # Los datos no se pierden al reiniciar
  neo4j-data:
```

**Ventajas de Docker:**
- ✅ Todas las dependencias en contenedores
- ✅ Funciona igual en Windows, Mac, Linux
- ✅ Un comando (`docker-compose up`) levanta todo
- ✅ Fácil resetear: `docker-compose down -v`

---

## 🔄 Flujo de Trabajo Completo (Backend)

### Ejemplo: Candidato aplica a una oferta

```
1. Usuario hace clic en "Aplicar" (Frontend)
   ↓
2. Frontend envía: POST /aplicaciones
   Headers: Authorization: Bearer eyJhbGc...
   Body: { "oferta_id": "507f1f77bcf86cd799439011" }
   ↓
3. Backend (main.py):
   - verificar_token() valida el JWT → extrae email del candidato
   - Busca oferta en MongoDB (verifica que exista)
   - Verifica que no haya aplicado antes (PostgreSQL)
   - Crea registro en tabla aplicaciones (PostgreSQL)
   - Invalida caché en Redis
   - Registra evento en MongoDB (auditoría)
   ↓
4. Backend retorna: 
   { "mensaje": "Aplicación enviada", "id": 42 }
   ↓
5. Frontend muestra: "✅ ¡Aplicación enviada exitosamente!"
```

### Diagrama de flujo de datos:

```
Frontend (React)
    ↕ HTTP/JSON
Backend (FastAPI)
    ├── PostgreSQL (aplicaciones, usuarios, entrevistas)
    ├── MongoDB (ofertas, perfiles, cursos, eventos)
    ├── Neo4j (red de contactos, matching)
    └── Redis (caché de consultas frecuentes)
```

---

## 📊 Comparación de Alternativas (¿Por qué NO usamos...?)

### ¿Por qué NO usar solo una base de datos?

| Alternativa | Problema |
|-------------|----------|
| **Solo PostgreSQL** | Arrays y documentos flexibles son torpes. Relaciones de red (grafos) requieren JOINs recursivos complejos y lentos. |
| **Solo MongoDB** | No hay integridad referencial. Riesgo de inconsistencias. Transacciones ACID limitadas. Malo para datos relacionales estrictos. |
| **Solo Neo4j** | Lento para datos tabulares simples. Overhead para consultas que no necesitan grafos. Más caro de escalar. |

### ¿Por qué FastAPI y no...?

| Framework | Ventaja | Desventaja |
|-----------|---------|------------|
| **FastAPI** ✅ | Rápido, validación automática, documentación auto-generada | Menos maduro que Django |
| **Django** ❌ | Muy completo, admin panel | Demasiado pesado para APIs, ORM impone estructura |
| **Flask** ❌ | Simple y flexible | Sin validación automática, más código manual |
| **Express (Node.js)** ❌ | Muy popular | JavaScript no es ideal para análisis de datos |

### ¿Por qué PostgreSQL y no MySQL?

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| **JSON nativo** | ✅ Excelente soporte | ⚠️ Limitado |
| **Extensiones** | ✅ PostGIS, pgvector | ❌ Pocas |
| **Conformidad SQL** | ✅ Muy estricto | ⚠️ Permisivo |
| **Performance** | ✅ Mejor para lecturas complejas | ✅ Mejor para escrituras simples |
| **Licencia** | ✅ Completamente open source | ⚠️ Dual (problemas comerciales) |

---

## 🎓 Conceptos Clave Explicados

### ¿Qué es una API REST?

**REST** = Representational State Transfer

**Principios:**
1. **Stateless:** Cada request es independiente (no hay sesiones)
2. **Client-Server:** Frontend y backend separados
3. **Recursos:** Todo es un recurso con URL (`/ofertas`, `/candidatos/{id}`)
4. **Métodos HTTP:** GET (leer), POST (crear), PUT (actualizar), DELETE (borrar)

### ¿Qué es un ORM?

**ORM** = Object-Relational Mapping

Convierte objetos de programación en filas de base de datos.

```python
# Sin ORM (SQL crudo)
cursor.execute("INSERT INTO usuarios (email, nombre) VALUES (%s, %s)", (email, nombre))

# Con ORM (SQLAlchemy)
usuario = Usuario(email=email, nombre=nombre)
db.session.add(usuario)
db.session.commit()
```

**¿Por qué NO usamos ORM?**
- Nuestro proyecto usa **múltiples BD diferentes**
- ORMs asumen una sola BD relacional
- Queries directas son más claras y rápidas

### ¿Qué es ACID?

**A**tomicity: Todo o nada (no se puede guardar "mitad" de una transacción)
**C**onsistency: Los datos siempre cumplen las reglas
**I**solation: Dos transacciones simultáneas no se interfieren
**D**urability: Una vez guardado, nunca se pierde

**Ejemplo:**
```python
# Transferencia bancaria (ambas deben ocurrir o ninguna)
cursor.execute("UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1")
cursor.execute("UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2")
conn.commit()  # 👈 Si esto falla, se revierte todo
```

PostgreSQL garantiza ACID. MongoDB tiene ACID limitado.

---

## 🚀 Cómo Ejecutar el Proyecto

### Prerrequisitos

- Docker Desktop instalado
- Node.js 18+ (para desarrollo del frontend)
- Python 3.11+ (opcional, ya está en Docker)

### Comandos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd trabajo-practico-base-de-datos-2

# 2. Levantar todas las bases de datos y el backend
docker-compose up -d

# 3. (Opcional) Instalar dependencias del frontend
cd frontend
npm install

# 4. (Opcional) Ejecutar frontend en modo desarrollo
npm run dev
```

### URLs de Acceso

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080
- **Swagger Docs:** http://localhost:8080/docs
- **Neo4j Browser:** http://localhost:7474
- **PostgreSQL:** `localhost:5431` (DBeaver, pgAdmin)
- **MongoDB:** `localhost:27017` (MongoDB Compass)
- **Redis:** `localhost:6379` (RedisInsight)

### Credenciales Iniciales

- **Admin:** `admin@talentum.plus` / `admin123`
- **Neo4j:** `neo4j` / `neo4j1234`
- **PostgreSQL:** `postgres` / `postgres`

---

## 📚 Recursos para Aprender Más

### Bases de Datos

- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [MongoDB University](https://university.mongodb.com/) (gratis)
- [Neo4j GraphAcademy](https://graphacademy.neo4j.com/) (gratis)
- [Redis University](https://university.redis.com/) (gratis)

### Backend

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [JWT.io](https://jwt.io/) - Debugger de tokens JWT

### Arquitectura

- [Microservices Pattern](https://microservices.io/)
- [12 Factor App](https://12factor.net/)

---

## ❓ Preguntas Frecuentes

### ¿Por qué no usar GraphQL en vez de REST?

**GraphQL** permite al frontend pedir exactamente los campos que necesita.

**Ventajas:**
- ✅ Un solo endpoint (`/graphql`)
- ✅ Frontend controla los datos que recibe

**Desventajas para nuestro caso:**
- ❌ Complejidad extra innecesaria
- ❌ Caché más difícil
- ❌ Nuestro backend ya decide qué retornar

REST es más simple y suficiente para nuestro caso.

### ¿Por qué no usar WebSockets para tiempo real?

**WebSockets** permiten comunicación bidireccional (servidor puede enviar datos sin que el cliente pregunte).

**Ideal para:** Chats, notificaciones en vivo, dashboards en tiempo real

**Nuestro caso:** Las ofertas no cambian cada segundo. Polling (refrescar cada X minutos) es suficiente.

### ¿Cómo escalar este sistema?

1. **Backend:** Múltiples instancias detrás de un load balancer
2. **PostgreSQL:** Réplicas de lectura (read replicas)
3. **MongoDB:** Sharding (particionar datos por rango)
4. **Neo4j:** Clustering (modo Enterprise)
5. **Redis:** Redis Cluster

---

## 🎯 Conclusión

Este sistema demuestra una **arquitectura multi-base de datos** real:

- ✅ **PostgreSQL** para datos críticos relacionales
- ✅ **MongoDB** para datos flexibles (skills, ofertas)
- ✅ **Neo4j** para red social (relaciones de grafo)
- ✅ **Redis** para caché y rendimiento

Cada base de datos hace lo que mejor sabe hacer. **No hay una "mejor" base de datos**, solo la correcta para cada problema.

**Regla de oro:** 
> Usa la herramienta correcta para el trabajo correcto. No uses un martillo para atornillar.

---

¿Preguntas? Abre un issue en GitHub o contacta al equipo de desarrollo.
