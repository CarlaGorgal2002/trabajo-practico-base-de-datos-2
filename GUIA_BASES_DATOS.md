# 🗄️ Guía de Intercomunicación con las Bases de Datos en Python

## 📚 Tabla de Contenidos
1. [PostgreSQL - Datos Relacionales](#postgresql)
2. [MongoDB - Documentos Flexibles](#mongodb)
3. [Neo4j - Grafo de Relaciones](#neo4j)
4. [Redis - Cache en Memoria](#redis)
5. [Ejemplos de Integración Multi-DB](#ejemplos-integración)

---

## 1️⃣ PostgreSQL - Datos Relacionales

### 🔌 Conexión
```python
from src.database import postgres_conn

# Usar con cursor
cursor = postgres_conn.cursor()
```

### 📖 Operaciones Básicas

#### SELECT - Consultar datos
```python
# Consulta simple
cursor = postgres_conn.cursor()
cursor.execute("SELECT * FROM candidatos WHERE email = %s", ("juan@ejemplo.com",))
resultado = cursor.fetchone()  # Un resultado
cursor.close()

# Múltiples resultados
cursor = postgres_conn.cursor()
cursor.execute("SELECT * FROM aplicaciones WHERE estado = %s", ("Pendiente",))
resultados = cursor.fetchall()  # Todos los resultados
cursor.close()

# Con context manager (recomendado - cierra automáticamente)
with postgres_conn.cursor() as cursor:
    cursor.execute("SELECT id, nombre, email FROM candidatos")
    candidatos = cursor.fetchall()
    # cursor se cierra automáticamente
```

#### INSERT - Insertar datos
```python
with postgres_conn.cursor() as cursor:
    cursor.execute(
        """
        INSERT INTO aplicaciones (candidato_email, oferta_id, estado)
        VALUES (%s, %s, %s)
        RETURNING id
        """,
        ("juan@ejemplo.com", "oferta-123", "Pendiente")
    )
    nueva_id = cursor.fetchone()[0]
    postgres_conn.commit()  # ⚠️ IMPORTANTE: Confirmar transacción
```

#### UPDATE - Actualizar datos
```python
with postgres_conn.cursor() as cursor:
    cursor.execute(
        """
        UPDATE aplicaciones 
        SET estado = %s 
        WHERE id = %s
        """,
        ("En Revisión", "uuid-aplicacion")
    )
    postgres_conn.commit()
```

#### DELETE - Eliminar datos
```python
with postgres_conn.cursor() as cursor:
    cursor.execute("DELETE FROM aplicaciones WHERE id = %s", ("uuid-aplicacion",))
    postgres_conn.commit()
```

### ⚠️ Manejo de Errores
```python
try:
    with postgres_conn.cursor() as cursor:
        cursor.execute("INSERT INTO aplicaciones (...) VALUES (...)")
        postgres_conn.commit()
except Exception as e:
    postgres_conn.rollback()  # Deshacer cambios si hay error
    print(f"Error: {e}")
    raise
```

### 🔍 Consultas Avanzadas
```python
# JOIN entre tablas
with postgres_conn.cursor() as cursor:
    cursor.execute("""
        SELECT a.id, a.estado, u.nombre
        FROM aplicaciones a
        JOIN usuarios u ON a.candidato_email = u.email
        WHERE a.estado = %s
        ORDER BY a.fecha_aplicacion DESC
        LIMIT 10
    """, ("Pendiente",))
    resultados = cursor.fetchall()
```

---

## 2️⃣ MongoDB - Documentos Flexibles

### 🔌 Conexión
```python
from src.database import mongo_db

# Acceder a colecciones
ofertas = mongo_db.ofertas
skills = mongo_db.skills
eventos = mongo_db.eventos
```

### 📖 Operaciones Básicas

#### INSERT - Insertar documentos
```python
from bson import ObjectId

# Insertar un documento
nueva_oferta = {
    "titulo": "Backend Developer",
    "empresa_id": "empresa@ejemplo.com",
    "descripcion": "Desarrollador Python con FastAPI",
    "skills_requeridos": ["Python", "FastAPI", "PostgreSQL"],
    "salario_min": 50000,
    "salario_max": 80000,
    "modalidad": "Remoto",
    "fecha_publicacion": datetime.now()
}
resultado = mongo_db.ofertas.insert_one(nueva_oferta)
oferta_id = resultado.inserted_id  # ObjectId generado

# Insertar múltiples documentos
nuevos_skills = [
    {"candidato_email": "juan@ejemplo.com", "skill": "Python", "nivel": "Avanzado"},
    {"candidato_email": "juan@ejemplo.com", "skill": "FastAPI", "nivel": "Intermedio"}
]
mongo_db.skills.insert_many(nuevos_skills)
```

#### FIND - Buscar documentos
```python
# Buscar uno
oferta = mongo_db.ofertas.find_one({"_id": ObjectId("id-de-oferta")})

# Buscar varios con filtro
ofertas_remotas = mongo_db.ofertas.find({"modalidad": "Remoto"})
for oferta in ofertas_remotas:
    print(oferta["titulo"])

# Buscar con proyección (solo ciertos campos)
ofertas = mongo_db.ofertas.find(
    {"modalidad": "Remoto"},
    {"_id": 0, "titulo": 1, "empresa_id": 1}  # 1 = incluir, 0 = excluir
)

# Buscar con operadores
ofertas_bien_pagadas = mongo_db.ofertas.find({
    "salario_min": {"$gte": 60000},  # Mayor o igual a 60000
    "modalidad": {"$in": ["Remoto", "Híbrido"]}  # En lista
})

# Buscar con regex (búsqueda de texto)
ofertas_python = mongo_db.ofertas.find({
    "descripcion": {"$regex": "Python", "$options": "i"}  # Case insensitive
})
```

#### UPDATE - Actualizar documentos
```python
# Actualizar uno
mongo_db.ofertas.update_one(
    {"_id": ObjectId("id-de-oferta")},  # Filtro
    {"$set": {"estado": "Cerrada"}}      # Actualización
)

# Actualizar varios
mongo_db.ofertas.update_many(
    {"empresa_id": "empresa@ejemplo.com"},
    {"$set": {"activa": True}}
)

# Operadores de actualización
mongo_db.skills.update_one(
    {"candidato_email": "juan@ejemplo.com", "skill": "Python"},
    {
        "$set": {"nivel": "Experto"},           # Establecer valor
        "$inc": {"años_experiencia": 1},        # Incrementar
        "$push": {"certificaciones": "PSF"}     # Agregar a array
    }
)
```

#### DELETE - Eliminar documentos
```python
# Eliminar uno
mongo_db.ofertas.delete_one({"_id": ObjectId("id-de-oferta")})

# Eliminar varios
mongo_db.ofertas.delete_many({"estado": "Cerrada", "fecha_cierre": {"$lt": datetime.now()}})
```

### 🔍 Consultas Avanzadas
```python
# Aggregation Pipeline
resultados = mongo_db.ofertas.aggregate([
    {"$match": {"modalidad": "Remoto"}},  # Filtrar
    {"$group": {                           # Agrupar
        "_id": "$empresa_id",
        "total_ofertas": {"$sum": 1},
        "salario_promedio": {"$avg": "$salario_min"}
    }},
    {"$sort": {"total_ofertas": -1}},     # Ordenar
    {"$limit": 10}                         # Limitar
])

for r in resultados:
    print(r)
```

---

## 3️⃣ Neo4j - Grafo de Relaciones

### 🔌 Conexión
```python
from src.database import neo4j_driver

# Usar con sesión
with neo4j_driver.session() as session:
    # Ejecutar consultas aquí
    pass
```

### 📖 Operaciones Básicas

#### CREATE - Crear nodos y relaciones
```python
# Crear nodo
with neo4j_driver.session() as session:
    session.run(
        """
        CREATE (c:Candidato {
            id: $email,
            nombre: $nombre,
            fecha_registro: datetime()
        })
        """,
        email="juan@ejemplo.com",
        nombre="Juan Pérez"
    )

# Crear relación entre nodos existentes
with neo4j_driver.session() as session:
    session.run(
        """
        MATCH (c1:Candidato {id: $email1})
        MATCH (c2:Candidato {id: $email2})
        MERGE (c1)-[r:CONECTADO_CON]->(c2)
        MERGE (c2)-[r2:CONECTADO_CON]->(c1)
        SET r.fecha = datetime(), r2.fecha = datetime()
        """,
        email1="juan@ejemplo.com",
        email2="maria@ejemplo.com"
    )
```

#### MATCH - Buscar nodos y relaciones
```python
# Buscar un nodo
with neo4j_driver.session() as session:
    resultado = session.run(
        "MATCH (c:Candidato {id: $email}) RETURN c",
        email="juan@ejemplo.com"
    )
    candidato = resultado.single()
    if candidato:
        print(candidato["c"]["nombre"])

# Buscar conexiones directas
with neo4j_driver.session() as session:
    resultado = session.run(
        """
        MATCH (c:Candidato {id: $email})-[:CONECTADO_CON]->(conexion:Candidato)
        RETURN conexion.id as email, conexion.nombre as nombre
        """,
        email="juan@ejemplo.com"
    )
    for record in resultado:
        print(f"{record['nombre']} ({record['email']})")

# Buscar conexiones de segundo grado (amigos de amigos)
with neo4j_driver.session() as session:
    resultado = session.run(
        """
        MATCH (c:Candidato {id: $email})-[:CONECTADO_CON*2]->(sugerencia:Candidato)
        WHERE NOT (c)-[:CONECTADO_CON]->(sugerencia)
        AND c <> sugerencia
        RETURN DISTINCT sugerencia.id as email, sugerencia.nombre as nombre
        LIMIT 10
        """,
        email="juan@ejemplo.com"
    )
    sugerencias = [dict(record) for record in resultado]
```

#### UPDATE - Actualizar propiedades
```python
with neo4j_driver.session() as session:
    session.run(
        """
        MATCH (c:Candidato {id: $email})
        SET c.ultima_conexion = datetime(),
            c.perfil_completo = true
        """,
        email="juan@ejemplo.com"
    )
```

#### DELETE - Eliminar nodos y relaciones
```python
# Eliminar relación
with neo4j_driver.session() as session:
    session.run(
        """
        MATCH (c1:Candidato {id: $email1})-[r:CONECTADO_CON]-(c2:Candidato {id: $email2})
        DELETE r
        """,
        email1="juan@ejemplo.com",
        email2="maria@ejemplo.com"
    )

# Eliminar nodo y todas sus relaciones
with neo4j_driver.session() as session:
    session.run(
        """
        MATCH (c:Candidato {id: $email})
        DETACH DELETE c
        """,
        email="juan@ejemplo.com"
    )
```

### 🔍 Consultas Avanzadas
```python
# Camino más corto entre dos candidatos
with neo4j_driver.session() as session:
    resultado = session.run(
        """
        MATCH path = shortestPath(
            (c1:Candidato {id: $email1})-[:CONECTADO_CON*]-(c2:Candidato {id: $email2})
        )
        RETURN [node in nodes(path) | node.nombre] as camino, length(path) as grados
        """,
        email1="juan@ejemplo.com",
        email2="pedro@ejemplo.com"
    )
    record = resultado.single()
    if record:
        print(f"Camino: {' -> '.join(record['camino'])}")
        print(f"Grados de separación: {record['grados']}")

# Candidatos más conectados (influencers)
with neo4j_driver.session() as session:
    resultado = session.run(
        """
        MATCH (c:Candidato)-[r:CONECTADO_CON]->()
        RETURN c.id as email, c.nombre as nombre, count(r) as conexiones
        ORDER BY conexiones DESC
        LIMIT 10
        """
    )
    influencers = [dict(record) for record in resultado]
```

---

## 4️⃣ Redis - Cache en Memoria

### 🔌 Conexión
```python
from src.database import redis_client
```

### 📖 Operaciones Básicas

#### SET - Guardar datos
```python
# String simple
redis_client.set("usuario:juan:sesion", "token-jwt-123", ex=3600)  # Expira en 1 hora

# JSON (serializado)
import json
datos_usuario = {"email": "juan@ejemplo.com", "nombre": "Juan", "rol": "candidato"}
redis_client.set("usuario:juan:datos", json.dumps(datos_usuario), ex=1800)

# Múltiples valores a la vez
redis_client.mset({
    "contador:visitas": 0,
    "contador:aplicaciones": 0
})
```

#### GET - Obtener datos
```python
# String simple
token = redis_client.get("usuario:juan:sesion")
if token:
    token = token.decode('utf-8')  # Redis devuelve bytes

# JSON
datos_json = redis_client.get("usuario:juan:datos")
if datos_json:
    datos = json.loads(datos_json)
    print(datos["nombre"])
```

#### OPERACIONES CON NÚMEROS
```python
# Incrementar contador
redis_client.incr("contador:visitas")  # +1
redis_client.incrby("contador:visitas", 10)  # +10

# Decrementar
redis_client.decr("contador:visitas")  # -1
```

#### LISTAS (Colas)
```python
# Agregar a lista (push)
redis_client.rpush("notificaciones:juan", "Nueva aplicación revisada")
redis_client.rpush("notificaciones:juan", "Tienes una entrevista programada")

# Obtener elementos
notificaciones = redis_client.lrange("notificaciones:juan", 0, -1)  # Todas

# Pop (obtener y eliminar)
notif = redis_client.lpop("notificaciones:juan")  # Primera
```

#### HASH (Objetos)
```python
# Guardar objeto como hash
redis_client.hset("candidato:juan", mapping={
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "skills_count": "5"
})

# Obtener campo específico
nombre = redis_client.hget("candidato:juan", "nombre")

# Obtener todo el objeto
candidato = redis_client.hgetall("candidato:juan")
# Devuelve dict con bytes: {b'nombre': b'Juan Pérez', ...}
```

#### SETS (Conjuntos únicos)
```python
# Agregar a conjunto
redis_client.sadd("skills:juan", "Python", "FastAPI", "PostgreSQL")

# Verificar si existe
existe = redis_client.sismember("skills:juan", "Python")  # True/False

# Obtener todos
skills = redis_client.smembers("skills:juan")  # Set de bytes

# Intersección (skills comunes entre dos candidatos)
comunes = redis_client.sinter("skills:juan", "skills:maria")
```

#### DELETE - Eliminar datos
```python
redis_client.delete("usuario:juan:sesion")

# Eliminar múltiples
redis_client.delete("key1", "key2", "key3")
```

#### EXPIRACIÓN
```python
# Establecer expiración en clave existente
redis_client.expire("usuario:juan:datos", 3600)  # 1 hora

# Ver tiempo restante
ttl = redis_client.ttl("usuario:juan:datos")  # Segundos restantes
```

### 🔍 Uso Avanzado - Cache de Consultas
```python
def obtener_ofertas_cacheadas():
    """Cachear consulta pesada de ofertas"""
    cache_key = "ofertas:remotas:activas"
    
    # Intentar obtener del cache
    ofertas_json = redis_client.get(cache_key)
    
    if ofertas_json:
        # Cache hit
        return json.loads(ofertas_json)
    
    # Cache miss - consultar MongoDB
    ofertas = list(mongo_db.ofertas.find(
        {"modalidad": "Remoto", "activa": True},
        {"_id": 0}
    ))
    
    # Guardar en cache por 5 minutos
    redis_client.set(cache_key, json.dumps(ofertas), ex=300)
    
    return ofertas
```

---

## 🔗 Ejemplos de Integración Multi-DB

### Ejemplo 1: Crear Aplicación (Multi-DB)
```python
from datetime import datetime
from bson import ObjectId
import json

def aplicar_a_oferta(candidato_email: str, oferta_id: str):
    """Crea aplicación usando PostgreSQL, MongoDB y Neo4j"""
    
    # 1️⃣ Verificar oferta en MongoDB
    oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    # 2️⃣ Verificar duplicado en PostgreSQL
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            "SELECT id FROM aplicaciones WHERE candidato_email = %s AND oferta_id = %s",
            (candidato_email, oferta_id)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Ya aplicaste a esta oferta")
    
    # 3️⃣ Crear aplicación en PostgreSQL
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO aplicaciones (candidato_email, oferta_id, estado)
            VALUES (%s, %s, 'Pendiente')
            RETURNING id
            """,
            (candidato_email, oferta_id)
        )
        aplicacion_id = cursor.fetchone()[0]
        postgres_conn.commit()
    
    # 4️⃣ Crear relación en Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MATCH (c:Candidato {id: $candidato})
            MATCH (o:Oferta {id: $oferta})
            MERGE (c)-[r:APLICA_A]->(o)
            SET r.estado = 'Pendiente', r.fecha = datetime()
            """,
            candidato=candidato_email,
            oferta=oferta_id
        )
    
    # 5️⃣ Invalidar cache en Redis
    redis_client.delete(f"aplicaciones:{candidato_email}")
    
    # 6️⃣ Registrar evento en MongoDB
    mongo_db.eventos.insert_one({
        "tipo": "aplicacion_creada",
        "candidato_email": candidato_email,
        "oferta_id": oferta_id,
        "timestamp": datetime.now()
    })
    
    return {"aplicacion_id": str(aplicacion_id), "estado": "Pendiente"}
```

### Ejemplo 2: Obtener Dashboard del Candidato (Multi-DB)
```python
def obtener_dashboard_candidato(email: str):
    """Dashboard completo usando las 4 bases de datos"""
    
    # 1️⃣ Cache - Verificar si está cacheado
    cache_key = f"dashboard:{email}"
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # 2️⃣ PostgreSQL - Aplicaciones recientes
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, oferta_id, estado, fecha_aplicacion
            FROM aplicaciones
            WHERE candidato_email = %s
            ORDER BY fecha_aplicacion DESC
            LIMIT 5
            """,
            (email,)
        )
        aplicaciones = cursor.fetchall()
    
    # 3️⃣ MongoDB - Skills y ofertas recomendadas
    skills = list(mongo_db.skills.find({"candidato_email": email}))
    ofertas_recomendadas = list(mongo_db.ofertas.find(
        {"activa": True},
        {"_id": 1, "titulo": 1, "empresa_id": 1}
    ).limit(5))
    
    # 4️⃣ Neo4j - Conexiones y sugerencias
    with neo4j_driver.session() as session:
        # Conexiones directas
        resultado_conexiones = session.run(
            """
            MATCH (c:Candidato {id: $email})-[:CONECTADO_CON]->(con:Candidato)
            RETURN count(con) as total_conexiones
            """,
            email=email
        )
        total_conexiones = resultado_conexiones.single()["total_conexiones"]
        
        # Sugerencias de conexión
        resultado_sugerencias = session.run(
            """
            MATCH (c:Candidato {id: $email})-[:CONECTADO_CON*2]->(sug:Candidato)
            WHERE NOT (c)-[:CONECTADO_CON]->(sug)
            AND c <> sug
            RETURN DISTINCT sug.id, sug.nombre
            LIMIT 3
            """,
            email=email
        )
        sugerencias = [dict(r) for r in resultado_sugerencias]
    
    # 5️⃣ Construir respuesta
    dashboard = {
        "aplicaciones_recientes": [
            {"id": str(a[0]), "oferta_id": a[1], "estado": a[2], "fecha": a[3].isoformat()}
            for a in aplicaciones
        ],
        "total_skills": len(skills),
        "ofertas_recomendadas": ofertas_recomendadas,
        "red": {
            "total_conexiones": total_conexiones,
            "sugerencias": sugerencias
        }
    }
    
    # 6️⃣ Cachear por 5 minutos
    redis_client.set(cache_key, json.dumps(dashboard, default=str), ex=300)
    
    return dashboard
```

### Ejemplo 3: Matching Inteligente (Multi-DB)
```python
def matching_candidato_oferta(oferta_id: str):
    """Encuentra mejores candidatos usando múltiples bases de datos"""
    
    # 1️⃣ MongoDB - Obtener skills requeridos de la oferta
    oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
    skills_requeridos = set(oferta.get("skills_requeridos", []))
    
    # 2️⃣ MongoDB - Buscar candidatos con esos skills
    candidatos_con_skills = mongo_db.skills.aggregate([
        {"$match": {"skill": {"$in": list(skills_requeridos)}}},
        {"$group": {
            "_id": "$candidato_email",
            "skills_match": {"$addToSet": "$skill"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 20}
    ])
    
    resultados = []
    for candidato in candidatos_con_skills:
        email = candidato["_id"]
        skills_match = set(candidato["skills_match"])
        porcentaje_match = (len(skills_match) / len(skills_requeridos)) * 100
        
        # 3️⃣ PostgreSQL - Verificar si ya aplicó
        with postgres_conn.cursor() as cursor:
            cursor.execute(
                "SELECT id FROM aplicaciones WHERE candidato_email = %s AND oferta_id = %s",
                (email, oferta_id)
            )
            ya_aplico = cursor.fetchone() is not None
        
        # 4️⃣ Neo4j - Ver conexiones con la empresa
        with neo4j_driver.session() as session:
            resultado = session.run(
                """
                MATCH (c:Candidato {id: $email})-[:CONECTADO_CON*1..2]-(emp:Empresa {id: $empresa})
                RETURN count(*) > 0 as tiene_conexion
                """,
                email=email,
                empresa=oferta["empresa_id"]
            )
            tiene_conexion = resultado.single()["tiene_conexion"] if resultado.single() else False
        
        resultados.append({
            "candidato_email": email,
            "porcentaje_match": porcentaje_match,
            "skills_comunes": list(skills_match),
            "ya_aplico": ya_aplico,
            "conexion_empresa": tiene_conexion,
            "score": porcentaje_match + (10 if tiene_conexion else 0)  # Bonus por conexión
        })
    
    # Ordenar por score
    resultados.sort(key=lambda x: x["score"], reverse=True)
    
    return resultados[:10]  # Top 10
```

---

## 📚 Recursos Adicionales

### Clientes Recomendados
- **PostgreSQL**: pgAdmin, DBeaver, TablePlus
- **MongoDB**: MongoDB Compass (http://localhost:27017)
- **Neo4j**: Neo4j Browser (http://localhost:7474)
- **Redis**: RedisInsight, Another Redis Desktop Manager

### Documentación Oficial
- [psycopg2](https://www.psycopg.org/docs/)
- [PyMongo](https://pymongo.readthedocs.io/)
- [Neo4j Python Driver](https://neo4j.com/docs/api/python-driver/)
- [redis-py](https://redis-py.readthedocs.io/)

---

## ✅ Checklist de Desarrollo

Cuando trabajes con las bases de datos:

- [ ] ✅ PostgreSQL: Siempre hacer `commit()` después de INSERT/UPDATE/DELETE
- [ ] ✅ PostgreSQL: Usar `rollback()` en caso de error
- [ ] ✅ MongoDB: Convertir `ObjectId` cuando sea necesario
- [ ] ✅ Neo4j: Cerrar sesiones con `session.close()` o usar `with`
- [ ] ✅ Redis: Decodificar bytes a strings cuando sea necesario
- [ ] ✅ Cache: Invalidar cache cuando se modifican datos
- [ ] ✅ Multi-DB: Mantener consistencia entre bases de datos
- [ ] ✅ Errores: Manejar excepciones apropiadamente en cada DB

¡Buena suerte con tu proyecto! 🚀
