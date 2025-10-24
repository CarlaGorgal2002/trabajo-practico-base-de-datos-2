from fastapi import FastAPI, HTTPException, Body, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from src.models import Candidato, Proceso, Curso, Inscripcion, Empresa, OfertaLaboral, Entrevista, EvaluacionTecnica, SolicitudConexion
from src.database import mongo_db, postgres_conn, neo4j_driver, redis_client
from src.events import (
    sincronizar_candidato_creado, 
    sincronizar_candidato_actualizado,
    sincronizar_proceso_creado,
    matching_automatico,
    registrar_interaccion_mentor
)
from src.auth import hash_password, verificar_password, generar_token_jwt, get_current_user, require_admin
from typing import List, Optional
from datetime import datetime
import json
from bson import ObjectId

app = FastAPI(title="Talentum+")

# Agregar CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def dashboard():
    return """
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Talentum+ | Dashboard</title>
        <style>
          :root { color-scheme: light dark; font-family: "Segoe UI", sans-serif; }
          body { margin: 0; padding: 2rem; background: #0f172a; color: #e2e8f0; }
          h1 { margin-bottom: 0.5rem; }
          p.lead { margin-top: 0; color: #94a3b8; }
          .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 2rem; }
          .card { background: #1e293b; border-radius: 16px; padding: 1.5rem; box-shadow: 0 12px 24px rgba(15,23,42,0.4); border: 1px solid rgba(148,163,184,0.15); }
          .card h2 { margin: 0 0 0.5rem; font-size: 1.2rem; }
          .card p { margin: 0 0 1rem; color: #cbd5f5; font-size: 0.95rem; }
          .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; background: rgba(59,130,246,0.15); color: #60a5fa; margin-bottom: 0.75rem; }
          a.button { display: inline-block; padding: 0.6rem 1rem; border-radius: 10px; background: linear-gradient(135deg,#38bdf8,#6366f1); color: #f8fafc; text-decoration: none; font-weight: 600; }
          a.button.secondary { background: rgba(148,163,184,0.15); color: #cbd5f5; margin-left: 0.5rem; }
          footer { margin-top: 3rem; color: #64748b; font-size: 0.85rem; }
          code { background: rgba(15,23,42,0.6); padding: 0.35rem 0.5rem; border-radius: 6px; display: block; margin-top: 0.75rem; font-family: "Cascadia Code", monospace; }
        </style>
      </head>
      <body>
        <h1>Talentum+</h1>
        <p class="lead">Dashboard local para servicios de datos. Conectate usando las credenciales predeterminadas.</p>

        <div class="grid">
          <div class="card">
            <span class="badge">MongoDB</span>
            <h2>Perfiles y búsquedas</h2>
            <p>Conectá MongoDB Compass u otra GUI usando el string de conexión.</p>
            <code>mongodb://localhost:27017</code>
            <a class="button" href="https://www.mongodb.com/try/download/compass" target="_blank" rel="noopener">Descargar Compass</a>
          </div>

          <div class="card">
            <span class="badge">Redis</span>
            <h2>Cache y sesiones</h2>
            <p>Usá RedisInsight para explorar claves, TTL y estructuras.</p>
            <code>redis://localhost:6379/0</code>
            <a class="button" href="https://redis.com/redis-enterprise/redis-insight/" target="_blank" rel="noopener">Abrir RedisInsight</a>
          </div>

          <div class="card">
            <span class="badge">PostgreSQL</span>
            <h2>Procesos de selección</h2>
            <p>Accedé con pgAdmin, DBeaver u otro cliente SQL.</p>
            <code>postgresql://postgres:postgres@localhost:5431/talentum</code>
            <a class="button" href="https://www.pgadmin.org/download/" target="_blank" rel="noopener">Descargar pgAdmin</a>
            <a class="button secondary" href="https://dbeaver.io/download/" target="_blank" rel="noopener">DBeaver</a>
          </div>

          <div class="card">
            <span class="badge">Neo4j</span>
            <h2>Grafos y recomendaciones</h2>
            <p>Interfaz web disponible en el puerto 7474, credenciales iniciales.</p>
            <code>Usuario: neo4j<br/>Password: neo4j1234</code>
            <a class="button" href="http://localhost:7474" target="_blank" rel="noopener">Abrir Neo4j Browser</a>
          </div>
        </div>

        <footer>
          Recordá que los contenedores deben estar encendidos (ver <em>COMO_CORRER.md</em>). Actualizá este dashboard según tus necesidades.
        </footer>
      </body>
    </html>
    """

# --- MongoDB: Perfiles ---
@app.post("/candidatos", status_code=201)
async def crear_candidato(candidato: Candidato):
    try:
        # 1. Guardar en MongoDB
        candidato_dict = candidato.dict()
        result = mongo_db.perfiles.insert_one(candidato_dict)
        candidato_dict["_id"] = str(result.inserted_id)
        
        # 2. SINCRONIZAR con otras BDs
        try:
            await sincronizar_candidato_creado(candidato_dict)
            sincronizado = True
            mensaje = "Candidato creado y sincronizado correctamente"
        except Exception as sync_error:
            # Si falla la sincronización, log pero NO fallar el request
            print(f"⚠️ Error en sincronización: {sync_error}")
            sincronizado = False
            mensaje = "Candidato creado pero con errores en sincronización"
        
        return {
            "id": str(result.inserted_id), 
            "sincronizado": sincronizado,
            "mensaje": mensaje,
            "email": candidato.email,
            "nombre": candidato.nombre
        }
    except Exception as e:
        print(f"❌ Error al crear candidato: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear candidato: {str(e)}")

@app.get("/candidatos/{email}")
async def obtener_candidato(email: str):
    # Intentar desde caché primero
    cached = redis_client.get(f"perfil:{email}")
    if cached:
        return {"source": "cache", **json.loads(cached)}
    
    # Si no está en caché, buscar en MongoDB
    candidato = mongo_db.perfiles.find_one({"email": email})
    if not candidato:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")
    
    candidato["_id"] = str(candidato["_id"])
    return {"source": "mongodb", **candidato}

@app.put("/candidatos/{email}")
async def actualizar_candidato(email: str, cambios: dict):
    """
    Actualiza un candidato y sincroniza cambios en todas las BDs
    """
    result = mongo_db.perfiles.update_one(
        {"email": email},
        {"$set": cambios}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Candidato no encontrado")
    
    await sincronizar_candidato_actualizado(email, cambios)
    
    return {"updated": True, "sincronizado": True}

# ==================== GESTIÓN DE SKILLS (CANDIDATOS) ====================

@app.get("/candidatos/{email}/perfil")
async def obtener_perfil_candidato(email: str):
    """
    Obtiene el perfil completo del candidato desde MongoDB
    """
    try:
        perfil = mongo_db.perfiles.find_one({"email": email}, {"_id": 0})
        if not perfil:
            # Si no existe, buscar en PostgreSQL para verificar que es candidato
            cursor = postgres_conn.cursor()
            cursor.execute("SELECT nombre, rol FROM usuarios WHERE email = %s", (email,))
            usuario = cursor.fetchone()
            cursor.close()
            
            if not usuario or usuario[1] != 'candidato':
                raise HTTPException(status_code=404, detail="Candidato no encontrado")
            
            # Retornar perfil básico
            return {
                "email": email,
                "nombre": usuario[0],
                "seniority": None,
                "skills": [],
                "experiencia": "",
                "educacion": ""
            }
        
        # Normalizar skills a array si es string
        if isinstance(perfil.get("skills"), str):
            perfil["skills"] = [s.strip() for s in perfil["skills"].split(",") if s.strip()]
        
        return perfil
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener perfil: {str(e)}")

@app.get("/candidatos/{email}/skills")
async def obtener_skills_candidato(email: str):
    """
    Obtiene todas las skills de un candidato desde MongoDB (array en perfil)
    """
    try:
        # Buscar perfil en MongoDB
        perfil = mongo_db.perfiles.find_one({"email": email}, {"skills": 1, "_id": 0})
        
        if not perfil:
            # Si no existe perfil, intentar obtener desde Neo4j
            with neo4j_driver.session() as session:
                result = session.run(
                    """
                    MATCH (c:Usuario {email: $email})-[:TIENE_SKILL]->(s:Skill)
                    RETURN s.nombre AS skill
                    ORDER BY s.nombre
                    """,
                    email=email
                )
                skills = [record["skill"] for record in result]
                return {"email": email, "skills": skills, "total": len(skills)}
        
        # Obtener skills del array
        skills = perfil.get("skills", [])
        
        # Asegurar que sea una lista (migración de string a array)
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
            # Actualizar a formato array
            mongo_db.perfiles.update_one(
                {"email": email},
                {"$set": {"skills": skills}}
            )
        
        return {"email": email, "skills": skills, "total": len(skills)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener skills: {str(e)}")

@app.post("/candidatos/{email}/skills")
async def agregar_skill_candidato(email: str, skill: str = Body(..., embed=True)):
    """
    Agrega una nueva skill al candidato en MongoDB (array en perfil) y Neo4j
    Solo el candidato puede agregar sus propias skills
    """
    skill = skill.strip().title()  # Normalizar formato
    
    if not skill:
        raise HTTPException(status_code=400, detail="La skill no puede estar vacía")
    
    # Verificar que el usuario existe en PostgreSQL y es candidato
    cursor = postgres_conn.cursor()
    cursor.execute("SELECT nombre, rol FROM usuarios WHERE email = %s", (email,))
    usuario = cursor.fetchone()
    cursor.close()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if usuario[1] != 'candidato':
        raise HTTPException(status_code=403, detail="Solo los candidatos pueden gestionar skills")
    
    try:
        # Agregar en Neo4j
        with neo4j_driver.session() as session:
            session.run(
                """
                MERGE (c:Usuario {email: $email})
                MERGE (s:Skill {nombre: $skill})
                MERGE (c)-[:TIENE_SKILL]->(s)
                """,
                email=email,
                skill=skill
            )
        
        # Agregar en MongoDB usando $addToSet (evita duplicados automáticamente)
        result = mongo_db.perfiles.update_one(
            {"email": email},
            {
                "$addToSet": {"skills": skill},
                "$setOnInsert": {
                    "nombre": usuario[0],
                    "experiencia": "",
                    "educacion": "",
                    "created_at": datetime.utcnow()
                }
            },
            upsert=True  # Crea el perfil si no existe
        )
        
        # Invalidar cache
        redis_client.delete(f"perfil:{email}")
        
        return {
            "success": True,
            "skill": skill,
            "mensaje": f"Skill '{skill}' agregada exitosamente",
            "created": result.upserted_id is not None
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar skill: {str(e)}")

@app.delete("/candidatos/{email}/skills/{skill}")
async def eliminar_skill_candidato(email: str, skill: str):
    """
    Elimina una skill del candidato en MongoDB (array) y Neo4j
    Solo el candidato puede eliminar sus propias skills
    """
    from urllib.parse import unquote
    
    # Decodificar URL y limpiar espacios, pero NO cambiar formato
    skill_decoded = unquote(skill).strip()
    
    try:
        # Eliminar en Neo4j (intentar con el formato exacto)
        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (c:Usuario {email: $email})-[r:TIENE_SKILL]->(s:Skill {nombre: $skill})
                DELETE r
                RETURN count(r) AS deleted
                """,
                email=email,
                skill=skill_decoded
            )
            deleted = result.single()["deleted"]
        
        # Eliminar en MongoDB usando $pull (búsqueda exacta)
        mongo_result = mongo_db.perfiles.update_one(
            {"email": email},
            {"$pull": {"skills": skill_decoded}}
        )
        
        if deleted == 0 and mongo_result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Skill no encontrada en el perfil")
        
        # Invalidar cache
        redis_client.delete(f"perfil:{email}")
        
        return {"success": True, "skill": skill_decoded, "mensaje": f"Skill '{skill_decoded}' eliminada exitosamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar skill: {str(e)}")

@app.put("/candidatos/{email}/seniority")
async def actualizar_seniority(email: str, seniority: str = Body(..., embed=True)):
    """
    Actualiza el nivel de seniority del candidato en MongoDB
    Valores permitidos: Junior, Semi-Senior, Senior, Lead
    """
    seniority = seniority.strip().title()
    
    niveles_validos = ["Junior", "Semi-Senior", "Senior", "Lead"]
    if seniority not in niveles_validos:
        raise HTTPException(
            status_code=400, 
            detail=f"Seniority inválido. Valores permitidos: {', '.join(niveles_validos)}"
        )
    
    # Verificar que el usuario existe en PostgreSQL y es candidato
    cursor = postgres_conn.cursor()
    cursor.execute("SELECT nombre, rol FROM usuarios WHERE email = %s", (email,))
    usuario = cursor.fetchone()
    cursor.close()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if usuario[1] != 'candidato':
        raise HTTPException(status_code=403, detail="Solo los candidatos pueden actualizar su seniority")
    
    try:
        # Actualizar en MongoDB (crear perfil si no existe)
        candidato = mongo_db.perfiles.find_one({"email": email})
        
        if not candidato:
            # Crear perfil básico si no existe
            mongo_db.perfiles.insert_one({
                "email": email,
                "nombre": usuario[0],
                "seniority": seniority,
                "skills": "",
                "experiencia": "",
                "educacion": "",
                "created_at": datetime.utcnow()
            })
        else:
            # Actualizar seniority existente
            mongo_db.perfiles.update_one(
                {"email": email},
                {"$set": {"seniority": seniority}}
            )
        
        return {
            "success": True, 
            "email": email,
            "seniority": seniority,
            "mensaje": f"Seniority actualizado a '{seniority}' exitosamente"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar seniority: {str(e)}")

@app.get("/candidatos")
async def listar_candidatos(skill: str = None, seniority: str = None):
    """
    Lista candidatos con filtros opcionales
    """
    filtro = {}
    if skill:
        # Búsqueda case-insensitive usando regex
        filtro["skills"] = {"$regex": skill, "$options": "i"}
    if seniority:
        filtro["seniority"] = seniority
    
    candidatos = list(mongo_db.perfiles.find(filtro, {"_id": 0}).limit(50))
    return {"total": len(candidatos), "candidatos": candidatos}

# --- PostgreSQL: Procesos ---
@app.post("/procesos", status_code=201)
async def crear_proceso(proceso: Proceso):
    """
    Crear proceso
    TODO: Descomentar require_recruiter cuando frontend implemente login
    """
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO procesos (candidato_id, puesto, estado, feedback, notas_confidenciales) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING id
            """,
            (proceso.candidato_id, proceso.puesto, proceso.estado, proceso.feedback, proceso.notas_confidenciales)
        )
        proceso_id = cursor.fetchone()[0]
        postgres_conn.commit()
    
    # SINCRONIZAR
    await sincronizar_proceso_creado(proceso.dict())
    
    return {"id": str(proceso_id), "sincronizado": True}

@app.get("/procesos/{candidato_id}")
async def obtener_procesos(candidato_id: str):
    """
    Obtiene todos los procesos de un candidato desde PostgreSQL
    TODO: Las notas confidenciales deberían filtrarse según rol cuando se implemente login
    """
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, puesto, estado, feedback, updated_at
            FROM procesos
            WHERE candidato_id = %s
            ORDER BY updated_at DESC
            """,
            (candidato_id,)
        )
        procesos = cursor.fetchall()
    
    return {
        "candidato_id": candidato_id,
        "procesos": [
            {
                "id": str(p[0]),
                "puesto": p[1],
                "estado": p[2],
                "feedback": p[3],
                "fecha": p[4].isoformat()
            }
            for p in procesos
        ]
    }

@app.get("/procesos")
async def obtener_todos_los_procesos():
    """
    Obtiene todos los procesos desde PostgreSQL
    """
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, candidato_id, puesto, estado, feedback, updated_at
            FROM procesos
            ORDER BY updated_at DESC
            """
        )
        procesos = cursor.fetchall()
    
    return {
        "total": len(procesos),
        "procesos": [
            {
                "id": str(p[0]),
                "candidato_id": p[1],
                "puesto": p[2],
                "estado": p[3],
                "feedback": p[4],
                "fecha": p[5].isoformat()
            }
            for p in procesos
        ]
    }

# --- Neo4j: Matching y Recomendaciones ---
@app.post("/matching")
async def buscar_candidatos_matching(
    puesto: str = Body(...),
    skills: List[str] = Body(...)
):
    """
    Busca candidatos que matcheen con un puesto usando Neo4j
    
    Body JSON esperado:
    {
        "puesto": "Backend Developer",
        "skills": ["python", "algorithms", "debugging"]
    }
    """
    candidatos = await matching_automatico(puesto, skills)
    return {
        "puesto": puesto,
        "skills_requeridos": skills,
        "candidatos_encontrados": len(candidatos),
        "candidatos": candidatos
    }

@app.get("/recomendaciones/{candidato_id}")
async def recomendar_roles(candidato_id: str):
    # Intentar desde caché
    cached = redis_client.get(f"recomendaciones:{candidato_id}")
    if cached:
        return {"source": "cache", "recomendaciones": json.loads(cached)}
    
    with neo4j_driver.session() as session:
        result = session.run(
            """
            MATCH (c:Candidato {id: $id})-[:DOMINA]->(s:Skill)<-[:REQUIERE]-(r:Rol)
            RETURN r.nombre AS rol, COUNT(s) AS match_count
            ORDER BY match_count DESC
            LIMIT 5
            """,
            id=candidato_id
        )
        recomendaciones = [
            {"rol": record["rol"], "match": record["match_count"]} 
            for record in result
        ]
        
        redis_client.setex(
            f"recomendaciones:{candidato_id}",
            600,
            json.dumps(recomendaciones)
        )
        
        return {"source": "neo4j", "recomendaciones": recomendaciones}

@app.post("/mentoring/{candidato_id}/{mentor_id}")
async def asignar_mentor(candidato_id: str, mentor_id: str, tipo: str = "técnico"):
    """
    Registra una relación de mentoring en Neo4j
    """
    await registrar_interaccion_mentor(candidato_id, mentor_id, tipo)
    return {"success": True, "candidato": candidato_id, "mentor": mentor_id}

@app.get("/red/{email}")
async def obtener_red(email: str):
    """
    Obtiene la red de contactos confirmados de un usuario (solo conexiones aceptadas)
    """
    # Obtener todas las conexiones aceptadas del usuario
    solicitudes_aceptadas = list(mongo_db.solicitudes_conexion.find({
        "$or": [
            {"remitente_email": email, "estado": "aceptada"},
            {"destinatario_email": email, "estado": "aceptada"}
        ]
    }))
    
    red = []
    for sol in solicitudes_aceptadas:
        # Determinar quién es el contacto (el que no es el usuario actual)
        email_contacto = sol["destinatario_email"] if sol["remitente_email"] == email else sol["remitente_email"]
        
        # Buscar datos del contacto en PostgreSQL
        cursor = postgres_conn.cursor()
        cursor.execute(
            "SELECT nombre, rol FROM usuarios WHERE email = %s",
            (email_contacto,)
        )
        contacto = cursor.fetchone()
        cursor.close()
        
        if contacto:
            red.append({
                "email": email_contacto,
                "nombre": contacto[0],
                "rol": contacto[1],
                "relacion": "CONECTADO_CON",
                "fecha_conexion": sol.get("fecha_solicitud")
            })
    
    return {"email": email, "red": red, "total": len(red)}

# ==================== SOLICITUDES DE CONEXIÓN ====================

@app.post("/solicitudes", status_code=201)
async def enviar_solicitud(solicitud: SolicitudConexion):
    """Envía una solicitud de conexión a otro usuario"""
    # Verificar que no sea auto-solicitud
    if solicitud.remitente_email == solicitud.destinatario_email:
        raise HTTPException(status_code=400, detail="No puedes enviarte una solicitud a ti mismo")
    
    # Verificar que no exista ya una solicitud pendiente
    solicitud_existente = mongo_db.solicitudes_conexion.find_one({
        "$or": [
            {"remitente_email": solicitud.remitente_email, "destinatario_email": solicitud.destinatario_email, "estado": "pendiente"},
            {"remitente_email": solicitud.destinatario_email, "destinatario_email": solicitud.remitente_email, "estado": "pendiente"}
        ]
    })
    
    if solicitud_existente:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud pendiente con este usuario")
    
    # Verificar que no estén ya conectados
    conexion_existente = mongo_db.solicitudes_conexion.find_one({
        "$or": [
            {"remitente_email": solicitud.remitente_email, "destinatario_email": solicitud.destinatario_email, "estado": "aceptada"},
            {"remitente_email": solicitud.destinatario_email, "destinatario_email": solicitud.remitente_email, "estado": "aceptada"}
        ]
    })
    
    if conexion_existente:
        raise HTTPException(status_code=400, detail="Ya estás conectado con este usuario")
    
    solicitud_dict = solicitud.dict()
    result = mongo_db.solicitudes_conexion.insert_one(solicitud_dict)
    
    return {"id": str(result.inserted_id), "mensaje": "Solicitud enviada exitosamente"}

@app.get("/solicitudes/recibidas/{email}")
async def obtener_solicitudes_recibidas(email: str):
    """Obtiene las solicitudes de conexión recibidas por un usuario"""
    solicitudes_raw = list(mongo_db.solicitudes_conexion.find({
        "destinatario_email": email,
        "estado": "pendiente"
    }))
    
    solicitudes = []
    for sol in solicitudes_raw:
        # Buscar datos del remitente en PostgreSQL
        cursor = postgres_conn.cursor()
        cursor.execute(
            "SELECT nombre, rol FROM usuarios WHERE email = %s",
            (sol["remitente_email"],)
        )
        remitente = cursor.fetchone()
        cursor.close()
        
        solicitudes.append({
            "_id": str(sol["_id"]),
            "remitente_email": sol["remitente_email"],
            "remitente_nombre": remitente[0] if remitente else "Usuario",
            "remitente_rol": remitente[1] if remitente else "candidato",
            "mensaje": sol.get("mensaje"),
            "fecha_solicitud": sol.get("fecha_solicitud")
        })
    
    return {"solicitudes": solicitudes}

@app.get("/solicitudes/enviadas/{email}")
async def obtener_solicitudes_enviadas(email: str):
    """Obtiene las solicitudes de conexión enviadas por un usuario"""
    solicitudes_raw = list(mongo_db.solicitudes_conexion.find({
        "remitente_email": email,
        "estado": "pendiente"
    }))
    
    solicitudes = []
    for sol in solicitudes_raw:
        # Buscar datos del destinatario en PostgreSQL
        cursor = postgres_conn.cursor()
        cursor.execute(
            "SELECT nombre, rol FROM usuarios WHERE email = %s",
            (sol["destinatario_email"],)
        )
        destinatario = cursor.fetchone()
        cursor.close()
        
        solicitudes.append({
            "_id": str(sol["_id"]),
            "destinatario_email": sol["destinatario_email"],
            "destinatario_nombre": destinatario[0] if destinatario else "Usuario",
            "destinatario_rol": destinatario[1] if destinatario else "candidato",
            "mensaje": sol.get("mensaje"),
            "fecha_solicitud": sol.get("fecha_solicitud")
        })
    
    return {"solicitudes": solicitudes}

@app.put("/solicitudes/{solicitud_id}/aceptar")
async def aceptar_solicitud(solicitud_id: str):
    """Acepta una solicitud de conexión"""
    solicitud = mongo_db.solicitudes_conexion.find_one({"_id": ObjectId(solicitud_id)})
    
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if solicitud["estado"] != "pendiente":
        raise HTTPException(status_code=400, detail="Esta solicitud ya fue procesada")
    
    # Actualizar estado a aceptada
    mongo_db.solicitudes_conexion.update_one(
        {"_id": ObjectId(solicitud_id)},
        {"$set": {"estado": "aceptada"}}
    )
    
    # Intentar crear relación en Neo4j (no bloquear si falla)
    try:
        with neo4j_driver.session() as session:
            session.run(
                """
                MERGE (u1:Usuario {email: $email1})
                ON CREATE SET u1.email = $email1
                MERGE (u2:Usuario {email: $email2})
                ON CREATE SET u2.email = $email2
                MERGE (u1)-[:CONECTADO_CON]-(u2)
                """,
                email1=solicitud["remitente_email"],
                email2=solicitud["destinatario_email"]
            )
    except Exception as e:
        # Log del error pero no fallar la operación
        print(f"⚠️ Error al crear relación en Neo4j: {e}")
    
    return {"mensaje": "Solicitud aceptada exitosamente"}

@app.put("/solicitudes/{solicitud_id}/rechazar")
async def rechazar_solicitud(solicitud_id: str):
    """Rechaza una solicitud de conexión"""
    solicitud = mongo_db.solicitudes_conexion.find_one({"_id": ObjectId(solicitud_id)})
    
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if solicitud["estado"] != "pendiente":
        raise HTTPException(status_code=400, detail="Esta solicitud ya fue procesada")
    
    # Actualizar estado a rechazada
    mongo_db.solicitudes_conexion.update_one(
        {"_id": ObjectId(solicitud_id)},
        {"$set": {"estado": "rechazada"}}
    )
    
    return {"mensaje": "Solicitud rechazada"}

@app.get("/usuarios/buscar")
async def buscar_usuarios(q: str, email_actual: str):
    """Busca usuarios por nombre o email (excluye el usuario actual, conexiones existentes y solicitudes pendientes)"""
    if not q or len(q) < 2:
        return {"usuarios": []}
    
    # Buscar usuarios en PostgreSQL que coincidan con la búsqueda
    cursor = postgres_conn.cursor()
    cursor.execute(
        """
        SELECT email, nombre, rol 
        FROM usuarios 
        WHERE email != %s 
        AND (nombre ILIKE %s OR email ILIKE %s)
        LIMIT 20
        """,
        (email_actual, f"%{q}%", f"%{q}%")
    )
    usuarios_raw = cursor.fetchall()
    cursor.close()
    
    # Obtener IDs de usuarios ya conectados
    solicitudes_aceptadas = list(mongo_db.solicitudes_conexion.find({
        "$or": [
            {"remitente_email": email_actual, "estado": "aceptada"},
            {"destinatario_email": email_actual, "estado": "aceptada"}
        ]
    }))
    
    emails_conectados = set()
    for sol in solicitudes_aceptadas:
        if sol["remitente_email"] == email_actual:
            emails_conectados.add(sol["destinatario_email"])
        else:
            emails_conectados.add(sol["remitente_email"])
    
    # Obtener solicitudes pendientes
    solicitudes_pendientes = list(mongo_db.solicitudes_conexion.find({
        "$or": [
            {"remitente_email": email_actual, "estado": "pendiente"},
            {"destinatario_email": email_actual, "estado": "pendiente"}
        ]
    }))
    
    emails_pendientes = set()
    for sol in solicitudes_pendientes:
        if sol["remitente_email"] == email_actual:
            emails_pendientes.add(sol["destinatario_email"])
        else:
            emails_pendientes.add(sol["remitente_email"])
    
    # Filtrar usuarios
    usuarios = []
    for user in usuarios_raw:
        email = user[0]
        if email not in emails_conectados and email not in emails_pendientes:
            usuarios.append({
                "email": email,
                "nombre": user[1],
                "rol": user[2]
            })
    
    return {"usuarios": usuarios}

# --- Redis: Cache ---
@app.get("/cache/{key}")
async def get_cache(key: str):
    value = redis_client.get(key)
    if not value:
        raise HTTPException(status_code=404, detail="Cache miss")
    return {"value": value.decode()}

@app.post("/cache/{key}")
async def set_cache(key: str, value: str, ttl: int = 300):
    redis_client.setex(key, ttl, value)
    return {"status": "cached"}

# ==================== CURSOS ====================

@app.post("/cursos", status_code=201)
async def crear_curso(curso: Curso, _: dict = Depends(require_admin)):
    """Crea un nuevo curso en MongoDB (solo admins)"""
    # Verificar si ya existe un curso con ese código
    if mongo_db.cursos.find_one({"codigo": curso.codigo}):
        raise HTTPException(
            status_code=400, 
            detail=f"Ya existe un curso con el código '{curso.codigo}'. Por favor usa un código diferente."
        )
    
    curso_dict = curso.dict()
    result = mongo_db.cursos.insert_one(curso_dict)
    
    # Preparar datos para caché (sin ObjectId)
    curso_cache = {
        "codigo": curso.codigo,
        "nombre": curso.nombre,
        "descripcion": curso.descripcion,
        "duracion_horas": curso.duracion_horas,
        "categoria": curso.categoria,
        "nivel": curso.nivel,
        "recursos": curso.recursos,
        "instructor": curso.instructor
    }
    
    # Cachear el curso específico
    redis_client.setex(
        f"curso:{curso.codigo}",
        3600,  # 1 hora
        json.dumps(curso_cache)
    )
    
    # IMPORTANTE: Invalidar cachés de listas de cursos
    # Para que el frontend obtenga la lista actualizada
    for key in redis_client.scan_iter("cursos:*"):
        redis_client.delete(key)
    
    return {"codigo": curso.codigo, "id": str(result.inserted_id)}

@app.get("/cursos")
async def listar_cursos(categoria: str = None, nivel: str = None):
    """Lista cursos con filtros opcionales"""
    # Intentar desde caché
    cache_key = f"cursos:cat={categoria or 'all'}:nivel={nivel or 'all'}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return {"source": "cache", "cursos": json.loads(cached)}
    
    # Consultar MongoDB
    filtro = {}
    if categoria:
        filtro["categoria"] = categoria
    if nivel:
        filtro["nivel"] = nivel
    
    cursos = list(mongo_db.cursos.find(filtro, {"_id": 0}))
    
    # Cachear resultado
    redis_client.setex(cache_key, 3600, json.dumps(cursos))
    
    return {"source": "mongodb", "total": len(cursos), "cursos": cursos}

@app.get("/cursos/{codigo}")
async def obtener_curso(codigo: str):
    """Obtiene un curso específico"""
    # Intentar desde caché
    cached = redis_client.get(f"curso:{codigo}")
    if cached:
        return {"source": "cache", **json.loads(cached)}
    
    curso = mongo_db.cursos.find_one({"codigo": codigo}, {"_id": 0})
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    return {"source": "mongodb", **curso}

# ==================== INSCRIPCIONES ====================

@app.post("/inscripciones", status_code=201)
async def inscribir_candidato(inscripcion: Inscripcion):
    """Inscribe un candidato a un curso"""
    # Verificar que el curso existe
    curso = mongo_db.cursos.find_one({"codigo": inscripcion.curso_codigo})
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Verificar si ya está inscrito
    inscripcion_existente = mongo_db.inscripciones.find_one({
        "candidato_email": inscripcion.candidato_email,
        "curso_codigo": inscripcion.curso_codigo
    })
    
    if inscripcion_existente:
        raise HTTPException(status_code=400, detail="Ya estás inscrito en este curso")
    
    # Crear inscripción
    insc_dict = inscripcion.dict()
    insc_dict["fecha_inscripcion"] = insc_dict["fecha_inscripcion"].isoformat()
    
    try:
        result = mongo_db.inscripciones.insert_one(insc_dict)
    except Exception as e:
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="Ya inscrito en este curso")
        raise
    
    # Sincronizar con Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MERGE (cu:Curso {codigo: $curso_codigo, nombre: $curso_nombre})
            WITH cu
            MATCH (c:Candidato {id: $candidato_email})
            MERGE (c)-[r:INSCRITO_EN]->(cu)
            SET r.progreso = 0.0, r.fecha = datetime()
            """,
            curso_codigo=inscripcion.curso_codigo,
            curso_nombre=curso["nombre"],
            candidato_email=inscripcion.candidato_email
        )
    
    # Invalidar caché del candidato
    redis_client.delete(f"perfil:{inscripcion.candidato_email}")
    
    return {"id": str(result.inserted_id), "inscrito": True}

@app.put("/inscripciones/{inscripcion_id}/progreso")
async def actualizar_progreso(inscripcion_id: str, progreso: float):
    """Actualiza el progreso de una inscripción (0.0 a 1.0)"""
    if not 0 <= progreso <= 1:
        raise HTTPException(status_code=400, detail="Progreso debe estar entre 0 y 1")
    
    completado = progreso >= 1.0
    
    result = mongo_db.inscripciones.update_one(
        {"_id": ObjectId(inscripcion_id)},
        {"$set": {"progreso": progreso, "completado": completado}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Obtener datos de la inscripción
    insc = mongo_db.inscripciones.find_one({"_id": ObjectId(inscripcion_id)})
    
    # Actualizar Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MATCH (c:Candidato {id: $candidato_email})-[r:INSCRITO_EN]->(cu:Curso {codigo: $curso_codigo})
            SET r.progreso = $progreso
            """,
            candidato_email=insc["candidato_email"],
            curso_codigo=insc["curso_codigo"],
            progreso=progreso
        )
        
        # Si completó el curso, crear relación COMPLETO
        if completado:
            session.run(
                """
                MATCH (c:Candidato {id: $candidato_email})
                MATCH (cu:Curso {codigo: $curso_codigo})
                MERGE (c)-[r:COMPLETO]->(cu)
                SET r.fecha = datetime()
                """,
                candidato_email=insc["candidato_email"],
                curso_codigo=insc["curso_codigo"]
            )
    
    return {"progreso": progreso, "completado": completado}

@app.post("/inscripciones/{inscripcion_id}/rendir-examen")
async def rendir_examen(inscripcion_id: str):
    """
    Genera una nota aleatoria entre 1 y 10 para una inscripción completada.
    - Solo permite sacar nota igual o mayor a la anterior
    - Aprueba con nota >= 4
    - Si aprueba, agrega las skills del curso a MongoDB
    """
    import random
    
    # Verificar que la inscripción existe
    try:
        inscripcion = mongo_db.inscripciones.find_one({"_id": ObjectId(inscripcion_id)})
    except:
        raise HTTPException(status_code=400, detail="ID de inscripción inválido")
    
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Verificar que el curso está completado (progreso = 1.0)
    if inscripcion.get("progreso", 0) < 1.0:
        raise HTTPException(
            status_code=400, 
            detail="Debes completar el curso (100%) antes de rendir el examen"
        )
    
    # Obtener nota anterior (si existe)
    nota_anterior = inscripcion.get("nota_examen", 0)
    
    # Generar nota aleatoria entre la nota anterior y 10 (no puede sacar menos)
    nota = random.randint(nota_anterior, 10)
    
    # Determinar si aprobó (nota >= 4)
    aprobado = nota >= 4
    estado_examen = "Aprobado" if aprobado else "Reprobado"
    
    # Actualizar en MongoDB
    result = mongo_db.inscripciones.update_one(
        {"_id": ObjectId(inscripcion_id)},
        {
            "$set": {
                "nota_examen": nota,
                "fecha_examen": datetime.utcnow(),
                "aprobado": aprobado
            }
        }
    )
    
    # Si aprobó, agregar las skills del curso al candidato
    if aprobado:
        # Obtener el curso para ver qué skills otorga
        curso = mongo_db.cursos.find_one({"codigo": inscripcion["curso_codigo"]})
        
        if curso and "skills" in curso:
            candidato_email = inscripcion["candidato_email"]
            skills_curso = curso["skills"]
            
            # Agregar skills al perfil del candidato usando $addToSet (evita duplicados)
            if skills_curso:
                mongo_db.perfiles.update_one(
                    {"email": candidato_email},
                    {
                        "$addToSet": {"skills": {"$each": skills_curso}},
                        "$setOnInsert": {
                            "created_at": datetime.utcnow()
                        }
                    },
                    upsert=True
                )
                
                # También agregar en Neo4j
                with neo4j_driver.session() as session:
                    for skill_nombre in skills_curso:
                        session.run(
                            """
                            MERGE (c:Usuario {email: $email})
                            MERGE (s:Skill {nombre: $skill})
                            MERGE (c)-[:TIENE_SKILL]->(s)
                            """,
                            email=candidato_email,
                            skill=skill_nombre
                        )
                
                # Invalidar cache del perfil
                redis_client.delete(f"perfil:{candidato_email}")
                
                mensaje_skills = f" ¡Ganaste {len(skills_curso)} nueva(s) skill(s): {', '.join(skills_curso)}!"
            else:
                mensaje_skills = ""
        else:
            mensaje_skills = ""
    else:
        mensaje_skills = ""
    
    mensaje_nota = f"Nota anterior: {nota_anterior}/10 → Nueva nota: {nota}/10" if nota_anterior > 0 else f"Primera nota: {nota}/10"
    
    return {
        "inscripcion_id": inscripcion_id,
        "nota": nota,
        "nota_anterior": nota_anterior,
        "aprobado": aprobado,
        "estado": estado_examen,
        "mensaje": f"{mensaje_nota} - {estado_examen}! ✨{mensaje_skills}"
    }

@app.put("/inscripciones/{inscripcion_id}/calificar")
async def calificar_inscripcion(inscripcion_id: str, calificacion: float):
    """Asigna una calificación final (0-100)"""
    if not 0 <= calificacion <= 100:
        raise HTTPException(status_code=400, detail="Calificación debe estar entre 0 y 100")
    
    result = mongo_db.inscripciones.update_one(
        {"_id": ObjectId(inscripcion_id)},
        {"$set": {"calificacion": calificacion, "completado": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Obtener inscripción para actualizar Neo4j
    insc = mongo_db.inscripciones.find_one({"_id": ObjectId(inscripcion_id)})
    
    with neo4j_driver.session() as session:
        session.run(
            """
            MATCH (c:Candidato {id: $candidato_email})-[r:COMPLETO]->(cu:Curso {codigo: $curso_codigo})
            SET r.calificacion = $calificacion
            """,
            candidato_email=insc["candidato_email"],
            curso_codigo=insc["curso_codigo"],
            calificacion=calificacion
        )
    
    return {"calificacion": calificacion, "completado": True}

@app.delete("/inscripciones/{inscripcion_id}")
async def abandonar_curso(inscripcion_id: str):
    """Elimina una inscripción (desinscribirse de un curso)"""
    # Obtener datos antes de eliminar
    insc = mongo_db.inscripciones.find_one({"_id": ObjectId(inscripcion_id)})
    
    if not insc:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Eliminar de MongoDB
    result = mongo_db.inscripciones.delete_one({"_id": ObjectId(inscripcion_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="No se pudo eliminar la inscripción")
    
    # Eliminar relaciones en Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MATCH (c:Candidato {id: $candidato_email})-[r:INSCRITO_EN|COMPLETO]->(cu:Curso {codigo: $curso_codigo})
            DELETE r
            """,
            candidato_email=insc["candidato_email"],
            curso_codigo=insc["curso_codigo"]
        )
    
    return {"message": "Inscripción eliminada exitosamente"}

@app.get("/candidatos/{email}/cursos")
async def obtener_cursos_candidato(email: str):
    """Ver todos los cursos de un candidato con progreso"""
    inscripciones_raw = list(mongo_db.inscripciones.find(
        {"candidato_email": email}
    ))
    
    # Convertir ObjectId a string y enriquecer con datos del curso
    inscripciones = []
    for insc in inscripciones_raw:
        insc_dict = {
            "_id": str(insc["_id"]),
            "candidato_email": insc["candidato_email"],
            "curso_codigo": insc["curso_codigo"],
            "fecha_inscripcion": insc.get("fecha_inscripcion"),
            "progreso": insc.get("progreso", 0.0),
            "calificacion": insc.get("calificacion"),
            "completado": insc.get("completado", False),
            "nota_examen": insc.get("nota_examen"),
            "fecha_examen": insc.get("fecha_examen")
        }
        
        curso = mongo_db.cursos.find_one(
            {"codigo": insc["curso_codigo"]},
            {"_id": 0, "nombre": 1, "duracion_horas": 1, "categoria": 1, "nivel": 1}
        )
        if curso:
            insc_dict["curso_nombre"] = curso.get("nombre", "Curso sin nombre")
            insc_dict["curso"] = curso
        
        inscripciones.append(insc_dict)
    
    return {
        "candidato_email": email,
        "total_cursos": len(inscripciones),
        "inscripciones": inscripciones
    }

# ==================== EMPRESAS ====================

@app.post("/empresas", status_code=201)
async def crear_empresa(empresa: Empresa):
    """Registra una nueva empresa"""
    empresa_dict = empresa.dict()
    
    try:
        result = mongo_db.empresas.insert_one(empresa_dict)
    except Exception as e:
        if "duplicate key" in str(e):
            raise HTTPException(status_code=400, detail="CUIT ya registrado")
        raise
    
    # Crear nodo en Neo4j
    with neo4j_driver.session() as session:
        session.run(
            """
            MERGE (e:Empresa {id: $cuit, nombre: $nombre})
            SET e.sector = $sector, e.tamaño = $tamaño
            """,
            cuit=empresa.cuit,
            nombre=empresa.nombre,
            sector=empresa.sector,
            tamaño=empresa.tamaño
        )
    
    return {"id": str(result.inserted_id), "cuit": empresa.cuit}

@app.get("/empresas")
async def listar_empresas():
    """Lista todas las empresas"""
    empresas = list(mongo_db.empresas.find({}, {"_id": 0}))
    return {"total": len(empresas), "empresas": empresas}

# ==================== BÚSQUEDA DE CANDIDATOS POR SKILLS ====================

@app.get("/candidatos/buscar-por-skills")
async def buscar_candidatos_por_skills(skills: str):
    """
    Busca candidatos que tengan los skills especificados.
    Parámetro skills: string con skills separados por comas (ej: "Python,React,Docker")
    """
    if not skills:
        raise HTTPException(status_code=400, detail="Debes especificar al menos un skill")
    
    # Convertir string a lista
    skills_list = [s.strip() for s in skills.split(",") if s.strip()]
    
    if not skills_list:
        raise HTTPException(status_code=400, detail="Debes especificar al menos un skill válido")
    
    try:
        # Buscar en Neo4j candidatos que tienen los skills
        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (c:Usuario)-[:TIENE_SKILL]->(s:Skill)
                WHERE s.nombre IN $skills AND c.rol = 'candidato'
                WITH c, COLLECT(s.nombre) AS skills_matched, COUNT(s) AS match_count
                RETURN c.email AS email, 
                       c.nombre AS nombre, 
                       skills_matched,
                       match_count,
                       (match_count * 100.0 / $total_skills) AS match_percentage
                ORDER BY match_count DESC
                LIMIT 50
                """,
                skills=skills_list,
                total_skills=len(skills_list)
            )
            
            candidatos = []
            for record in result:
                candidatos.append({
                    "email": record["email"],
                    "nombre": record["nombre"],
                    "skills_matched": record["skills_matched"],
                    "match_count": record["match_count"],
                    "match_percentage": round(record["match_percentage"], 1)
                })
            
            return {
                "skills_buscados": skills_list,
                "candidatos_encontrados": len(candidatos),
                "candidatos": candidatos
            }
    except Exception as e:
        # Si Neo4j falla, buscar en PostgreSQL (sin matching de skills)
        print(f"⚠️ Error en Neo4j, buscando en PostgreSQL: {e}")
        cursor = postgres_conn.cursor()
        cursor.execute(
            """
            SELECT email, nombre, rol 
            FROM usuarios 
            WHERE rol = 'candidato'
            LIMIT 50
            """
        )
        resultados = cursor.fetchall()
        cursor.close()
        
        candidatos = [
            {
                "email": row[0],
                "nombre": row[1],
                "skills_matched": [],
                "match_count": 0,
                "match_percentage": 0
            }
            for row in resultados
        ]
        
        return {
            "skills_buscados": skills_list,
            "candidatos_encontrados": len(candidatos),
            "candidatos": candidatos,
            "nota": "Búsqueda básica (Neo4j no disponible)"
        }

# ==================== OFERTAS LABORALES ====================

@app.post("/ofertas", status_code=201)
async def publicar_oferta(oferta: OfertaLaboral):
    """Publica una nueva oferta laboral"""
    oferta_dict = oferta.dict()
    
    # Procesar requisitos: convertir string separado por comas en array
    if oferta_dict.get("requisitos"):
        skills = [skill.strip() for skill in oferta_dict["requisitos"].split(",") if skill.strip()]
        oferta_dict["skills_requeridos"] = skills
    else:
        oferta_dict["skills_requeridos"] = []
    
    oferta_dict["fecha_publicacion"] = oferta_dict["fecha_publicacion"].isoformat()
    
    result = mongo_db.ofertas.insert_one(oferta_dict)
    oferta_id = str(result.inserted_id)
    
    # Sincronizar con Neo4j (solo si está disponible)
    try:
        with neo4j_driver.session() as session:
            # Crear nodo de oferta
            session.run(
                """
                CREATE (of:Oferta {
                    id: $oferta_id,
                    titulo: $titulo,
                    modalidad: $modalidad,
                    ubicacion: $ubicacion
                })
                """,
                oferta_id=oferta_id,
                titulo=oferta.titulo,
                modalidad=oferta.modalidad,
                ubicacion=oferta.ubicacion or "No especificado"
            )
            
            # Conectar con empresa
            session.run(
                """
                MATCH (e:Usuario {email: $empresa_email})
                MATCH (of:Oferta {id: $oferta_id})
                MERGE (e)-[:PUBLICA]->(of)
                """,
                empresa_email=oferta.empresa,
                oferta_id=oferta_id
            )
            
            # Conectar con skills requeridos
            for skill in oferta_dict["skills_requeridos"]:
                session.run(
                    """
                    MERGE (s:Skill {nombre: $skill})
                    WITH s
                    MATCH (of:Oferta {id: $oferta_id})
                    MERGE (of)-[:REQUIERE]->(s)
                    """,
                    skill=skill,
                    oferta_id=oferta_id
                )
    except Exception as e:
        print(f"⚠️ Error al sincronizar con Neo4j: {e}")
        # Continuar sin bloquear la creación de la oferta
    
    return {"id": oferta_id, "mensaje": "Oferta publicada exitosamente"}

@app.get("/ofertas")
async def listar_ofertas(modalidad: str = None, ubicacion: str = None, estado: str = None):
    """Lista ofertas activas con filtros opcionales"""
    filtro = {}
    
    # Si no se especifica estado, por defecto mostrar solo las abiertas
    if estado is None:
        filtro["estado"] = "abierta"
    else:
        filtro["estado"] = estado
    
    if modalidad:
        filtro["modalidad"] = modalidad
    if ubicacion:
        filtro["ubicacion"] = ubicacion
    
    ofertas_raw = list(mongo_db.ofertas.find(filtro).limit(50))
    
    # Convertir ObjectId a string para cada oferta
    ofertas = []
    for oferta in ofertas_raw:
        oferta["id"] = str(oferta["_id"])
        del oferta["_id"]
        ofertas.append(oferta)
    
    return {"total": len(ofertas), "ofertas": ofertas}

@app.get("/ofertas/{oferta_id}")
async def obtener_oferta(oferta_id: str):
    """Detalle de una oferta específica"""
    try:
        oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
    except:
        raise HTTPException(status_code=404, detail="ID de oferta inválido")
    
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    # Convertir ObjectId a string
    oferta["id"] = str(oferta["_id"])
    del oferta["_id"]
    
    return oferta

@app.put("/ofertas/{oferta_id}")
async def editar_oferta(oferta_id: str, data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    """
    Editar una oferta laboral (solo la empresa que la creó o admin)
    """
    # Verificar que el usuario es empresa o admin
    if current_user["rol"] not in ["empresa", "admin"]:
        raise HTTPException(status_code=403, detail="Solo las empresas pueden editar ofertas")
    
    # Verificar que la oferta existe
    try:
        oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
    except:
        raise HTTPException(status_code=404, detail="ID de oferta inválido")
    
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    # Verificar que la empresa es la dueña de la oferta (o es admin)
    if current_user["rol"] != "admin" and oferta.get("empresa") != current_user["email"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar esta oferta")
    
    # Campos editables
    campos_editables = ["titulo", "descripcion", "requisitos", "salario", "ubicacion", 
                        "modalidad", "tipo_contrato", "estado"]
    
    actualizacion = {}
    for campo in campos_editables:
        if campo in data:
            actualizacion[campo] = data[campo]
    
    if not actualizacion:
        raise HTTPException(status_code=400, detail="No se especificaron campos para actualizar")
    
    # Si se actualizó requisitos, procesar para crear skills_requeridos
    if "requisitos" in actualizacion:
        skills = [skill.strip() for skill in actualizacion["requisitos"].split(",") if skill.strip()]
        actualizacion["skills_requeridos"] = skills
    
    # Actualizar en MongoDB
    mongo_db.ofertas.update_one(
        {"_id": ObjectId(oferta_id)},
        {"$set": actualizacion}
    )
    
    # Obtener oferta actualizada
    oferta_actualizada = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
    oferta_actualizada["id"] = str(oferta_actualizada["_id"])
    del oferta_actualizada["_id"]
    
    return {"success": True, "mensaje": "Oferta actualizada exitosamente", "oferta": oferta_actualizada}

@app.post("/ofertas/{oferta_id}/aplicar")
async def aplicar_a_oferta(oferta_id: str, data: dict = Body(...)):
    """Candidato aplica a una oferta"""
    candidato_email = data.get("candidato_email")
    if not candidato_email:
        raise HTTPException(status_code=400, detail="Email del candidato es requerido")
    
    # Verificar que la oferta existe
    try:
        oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
        if not oferta:
            raise HTTPException(status_code=404, detail="Oferta no encontrada")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ID de oferta inválido: {str(e)}")
    
    # Verificar si ya aplicó a esta oferta
    cursor = postgres_conn.cursor()
    cursor.execute(
        """
        SELECT id FROM aplicaciones 
        WHERE candidato_email = %s AND oferta_id = %s
        """,
        (candidato_email, oferta_id)
    )
    aplicacion_existente = cursor.fetchone()
    cursor.close()
    
    if aplicacion_existente:
        raise HTTPException(status_code=400, detail="Ya aplicaste a esta oferta")
    
    try:
        # Crear aplicación en PostgreSQL
        cursor = postgres_conn.cursor()
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
        cursor.close()
        
        # Registrar evento en MongoDB (auditoría)
        try:
            mongo_db.historial_cambios.insert_one({
                "tipo": "aplicacion_creada",
                "candidato_email": candidato_email,
                "oferta_id": oferta_id,
                "aplicacion_id": str(aplicacion_id),
                "timestamp": datetime.utcnow()
            })
        except Exception as e:
            print(f"⚠️ Error al registrar evento: {e}")
        
        # Crear relación en Neo4j (no bloquear si falla)
        try:
            with neo4j_driver.session() as session:
                session.run(
                    """
                    MERGE (c:Candidato {email: $candidato_email})
                    ON CREATE SET c.email = $candidato_email
                    WITH c
                    MERGE (of:Oferta {id: $oferta_id})
                    ON CREATE SET of.id = $oferta_id
                    MERGE (c)-[r:APLICA_A]->(of)
                    SET r.estado = 'Pendiente', r.fecha = datetime()
                    """,
                    candidato_email=candidato_email,
                    oferta_id=oferta_id
                )
        except Exception as e:
            print(f"⚠️ Error al crear relación en Neo4j: {e}")
        
        return {"aplicacion_id": str(aplicacion_id), "estado": "Pendiente"}
    except Exception as e:
        postgres_conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear aplicación: {str(e)}")

@app.get("/candidatos/{email}/aplicaciones")
async def obtener_aplicaciones_candidato(email: str):
    """Obtiene todas las aplicaciones de un candidato"""
    cursor = postgres_conn.cursor()
    cursor.execute(
        """
        SELECT id, oferta_id, estado, fecha_aplicacion 
        FROM aplicaciones 
        WHERE candidato_email = %s
        ORDER BY fecha_aplicacion DESC
        """,
        (email,)
    )
    
    aplicaciones = []
    for row in cursor.fetchall():
        app_id, oferta_id, estado, fecha = row
        
        # Obtener detalles de la oferta desde MongoDB
        try:
            oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
            oferta_info = {
                "titulo": oferta.get("titulo", "Oferta no encontrada"),
                "empresa": oferta.get("empresa", ""),
                "ubicacion": oferta.get("ubicacion", ""),
                "modalidad": oferta.get("modalidad", "")
            } if oferta else {"titulo": "Oferta no encontrada"}
        except:
            oferta_info = {"titulo": "Oferta no encontrada"}
        
        aplicaciones.append({
            "id": str(app_id),
            "oferta_id": oferta_id,
            "estado": estado,
            "fecha_aplicacion": str(fecha),
            "oferta": oferta_info
        })
    
    cursor.close()
    return {"total": len(aplicaciones), "aplicaciones": aplicaciones}

@app.get("/ofertas/{oferta_id}/matches")
async def matching_oferta(oferta_id: str):
    """Busca candidatos que matcheen con una oferta usando Neo4j"""
    # Obtener skills requeridos de la oferta
    try:
        oferta = mongo_db.ofertas.find_one({"_id": ObjectId(oferta_id)})
    except:
        raise HTTPException(status_code=404, detail="ID de oferta inválido")
    
    if not oferta:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    skills_requeridos = oferta.get("skills_requeridos", [])
    
    if not skills_requeridos:
        return {
            "oferta_id": oferta_id,
            "titulo": oferta["titulo"],
            "skills_requeridos": [],
            "candidatos_encontrados": 0,
            "candidatos": []
        }
    
    # Query Neo4j usando TIENE_SKILL (case-insensitive)
    try:
        with neo4j_driver.session() as session:
            result = session.run(
                """
                MATCH (c:Usuario)-[:TIENE_SKILL]->(s:Skill)
                WHERE ANY(skill IN $skills WHERE toLower(s.nombre) = toLower(skill))
                WITH c, COLLECT(DISTINCT s.nombre) AS skills_matched, COUNT(DISTINCT s) AS match_count
                WHERE match_count > 0
                RETURN c.email AS email, 
                       c.nombre AS nombre,
                       skills_matched,
                       match_count,
                       (match_count * 100.0 / $total_skills) AS match_percentage
                ORDER BY match_count DESC
                LIMIT 20
                """,
                skills=skills_requeridos,
                total_skills=len(skills_requeridos)
            )
            
            candidatos = []
            for record in result:
                # Obtener info adicional del candidato desde MongoDB
                candidato_mongo = mongo_db.perfiles.find_one({"email": record["email"]})
                
                candidatos.append({
                    "email": record["email"],
                    "nombre": record["nombre"],
                    "seniority": candidato_mongo.get("seniority", "N/A") if candidato_mongo else "N/A",
                    "skills_matched": record["skills_matched"],
                    "match_skills": record["match_count"],
                    "match_percentage": round(record["match_percentage"], 1)
                })
    except Exception as e:
        print(f"⚠️ Error en Neo4j, fallback a búsqueda básica: {e}")
        # Fallback: buscar candidatos en PostgreSQL
        candidatos = []
    
    return {
        "oferta_id": oferta_id,
        "titulo": oferta["titulo"],
        "skills_requeridos": skills_requeridos,
        "candidatos_encontrados": len(candidatos),
        "candidatos": candidatos
    }


@app.get("/candidatos/{email}/aplicaciones")
async def obtener_aplicaciones_candidato(email: str):
    """Ver todas las aplicaciones de un candidato"""
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, oferta_id, estado, fecha_aplicacion
            FROM aplicaciones
            WHERE candidato_email = %s
            ORDER BY fecha_aplicacion DESC
            """,
            (email,)
        )
        aplicaciones = cursor.fetchall()
    
    # Enriquecer con datos de la oferta
    result = []
    for aplic in aplicaciones:
        oferta = mongo_db.ofertas.find_one(
            {"_id": ObjectId(aplic[1])},
            {"_id": 0, "titulo": 1, "empresa_id": 1, "modalidad": 1}
        )
        result.append({
            "id": str(aplic[0]),
            "estado": aplic[2],
            "fecha": aplic[3].isoformat(),
            "oferta": oferta
        })
    
    return {"candidato_email": email, "total_aplicaciones": len(result), "aplicaciones": result}


# ==================== ENTREVISTAS ====================

@app.post("/entrevistas", status_code=201)
async def crear_entrevista(entrevista: Entrevista):
    """
    Crear una nueva entrevista programada
    TODO: Descomentar require_recruiter cuando frontend implemente login
    """
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO entrevistas (
                proceso_id, tipo, fecha, entrevistador, 
                duracion_minutos, notas, puntaje, estado
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                entrevista.proceso_id,
                entrevista.tipo,
                entrevista.fecha,
                entrevista.entrevistador,
                entrevista.duracion_minutos,
                entrevista.notas,
                entrevista.puntaje,
                "Programada"
            )
        )
        id = cursor.fetchone()[0]
        postgres_conn.commit()
    
    return {
        "id": str(id),
        "estado": "Programada",
        "mensaje": "Entrevista agendada exitosamente"
    }


@app.get("/entrevistas/{entrevista_id}")
async def obtener_entrevista(entrevista_id: str):
    """Obtener detalles de una entrevista específica"""
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, proceso_id, tipo, fecha, entrevistador,
                   duracion_minutos, notas, puntaje, estado
            FROM entrevistas
            WHERE id = %s
            """,
            (entrevista_id,)
        )
        entrevista = cursor.fetchone()
    
    if not entrevista:
        raise HTTPException(status_code=404, detail="Entrevista no encontrada")
    
    return {
        "id": str(entrevista[0]),
        "proceso_id": str(entrevista[1]),
        "tipo": entrevista[2],
        "fecha": entrevista[3].isoformat(),
        "entrevistador": entrevista[4],
        "duracion_minutos": entrevista[5],
        "notas": entrevista[6],
        "puntaje": entrevista[7],
        "estado": entrevista[8]
    }


@app.get("/procesos/{proceso_id}/entrevistas")
async def listar_entrevistas_proceso(proceso_id: str):
    """Ver todas las entrevistas de un proceso"""
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, tipo, fecha, entrevistador, duracion_minutos,
                   notas, puntaje, estado
            FROM entrevistas
            WHERE proceso_id = %s
            ORDER BY fecha DESC
            """,
            (proceso_id,)
        )
        entrevistas = cursor.fetchall()
    
    return {
        "proceso_id": proceso_id,
        "total": len(entrevistas),
        "entrevistas": [
            {
                "id": str(e[0]),
                "tipo": e[1],
                "fecha": e[2].isoformat(),
                "entrevistador": e[3],
                "duracion_minutos": e[4],
                "notas": e[5],
                "puntaje": e[6],
                "estado": e[7]
            }
            for e in entrevistas
        ]
    }


@app.put("/entrevistas/{entrevista_id}")
async def actualizar_entrevista(
    entrevista_id: str,
    estado: str = Body(...),
    puntaje: Optional[int] = Body(None),
    notas: Optional[str] = Body(None)
):
    """Actualizar estado, puntaje o notas de una entrevista"""
    with postgres_conn.cursor() as cursor:
        # Construir query dinámicamente
        updates = ["estado = %s"]
        params = [estado]
        
        if puntaje is not None:
            updates.append("puntaje = %s")
            params.append(puntaje)
        
        if notas is not None:
            updates.append("notas = %s")
            params.append(notas)
        
        params.append(entrevista_id)
        
        cursor.execute(
            f"""
            UPDATE entrevistas
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id
            """,
            params
        )
        result = cursor.fetchone()
        postgres_conn.commit()
    
    if not result:
        raise HTTPException(status_code=404, detail="Entrevista no encontrada")
    
    return {"id": str(result[0]), "mensaje": "Entrevista actualizada"}


@app.get("/candidatos/{email}/entrevistas")
async def listar_entrevistas_candidato(email: str):
    """Ver todas las entrevistas de un candidato"""
    with postgres_conn.cursor() as cursor:
        # Buscar el candidato_id en PostgreSQL
        cursor.execute(
            "SELECT id FROM candidatos WHERE email = %s",
            (email,)
        )
        candidato = cursor.fetchone()
        
        if not candidato:
            raise HTTPException(status_code=404, detail="Candidato no encontrado")
        
        candidato_id = candidato[0]
        
        # Buscar entrevistas a través de procesos
        cursor.execute(
            """
            SELECT e.id, e.tipo, e.fecha, e.entrevistador,
                   e.duracion_minutos, e.puntaje, e.estado, p.puesto
            FROM entrevistas e
            JOIN procesos p ON e.proceso_id = p.id
            WHERE p.candidato_id = %s
            ORDER BY e.fecha DESC
            """,
            (str(candidato_id),)
        )
        entrevistas = cursor.fetchall()
    
    return {
        "candidato_email": email,
        "total_entrevistas": len(entrevistas),
        "entrevistas": [
            {
                "id": str(e[0]),
                "tipo": e[1],
                "fecha": e[2].isoformat(),
                "entrevistador": e[3],
                "duracion_minutos": e[4],
                "puntaje": e[5],
                "estado": e[6],
                "puesto": e[7]
            }
            for e in entrevistas
        ]
    }


# ==================== EVALUACIONES TÉCNICAS ====================

@app.post("/evaluaciones", status_code=201)
async def crear_evaluacion(evaluacion: EvaluacionTecnica):
    """
    Crear una nueva evaluación técnica para un proceso
    TODO: Descomentar require_recruiter cuando frontend implemente login
    """
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO evaluaciones (
                proceso_id, tipo, plataforma, resultado, puntaje, feedback
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                evaluacion.proceso_id,
                evaluacion.tipo,
                evaluacion.plataforma,
                evaluacion.resultado,
                evaluacion.puntaje,
                evaluacion.feedback
            )
        )
        id = cursor.fetchone()[0]
        postgres_conn.commit()
    
    return {
        "id": str(id),
        "mensaje": "Evaluación técnica registrada exitosamente"
    }


@app.get("/evaluaciones/{evaluacion_id}")
async def obtener_evaluacion(evaluacion_id: str):
    """Obtener detalles de una evaluación específica"""
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, proceso_id, tipo, plataforma, resultado, puntaje, feedback
            FROM evaluaciones
            WHERE id = %s
            """,
            (evaluacion_id,)
        )
        evaluacion = cursor.fetchone()
    
    if not evaluacion:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    
    return {
        "id": str(evaluacion[0]),
        "proceso_id": str(evaluacion[1]),
        "tipo": evaluacion[2],
        "plataforma": evaluacion[3],
        "resultado": evaluacion[4],
        "puntaje": evaluacion[5],
        "feedback": evaluacion[6]
    }


@app.get("/procesos/{proceso_id}/evaluaciones")
async def listar_evaluaciones_proceso(proceso_id: str):
    """Ver todas las evaluaciones de un proceso"""
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, tipo, plataforma, resultado, puntaje, feedback
            FROM evaluaciones
            WHERE proceso_id = %s
            ORDER BY id DESC
            """,
            (proceso_id,)
        )
        evaluaciones = cursor.fetchall()
    
    return {
        "proceso_id": proceso_id,
        "total": len(evaluaciones),
        "evaluaciones": [
            {
                "id": str(e[0]),
                "tipo": e[1],
                "plataforma": e[2],
                "resultado": e[3],
                "puntaje": e[4],
                "feedback": e[5]
            }
            for e in evaluaciones
        ]
    }


@app.get("/candidatos/{email}/evaluaciones")
async def listar_evaluaciones_candidato(email: str):
    """Ver todas las evaluaciones técnicas de un candidato"""
    with postgres_conn.cursor() as cursor:
        # Buscar el candidato_id en PostgreSQL
        cursor.execute(
            "SELECT id FROM candidatos WHERE email = %s",
            (email,)
        )
        candidato = cursor.fetchone()
        
        if not candidato:
            raise HTTPException(status_code=404, detail="Candidato no encontrado")
        
        candidato_id = candidato[0]
        
        # Buscar evaluaciones a través de procesos
        cursor.execute(
            """
            SELECT ev.id, ev.tipo, ev.plataforma, ev.resultado, 
                   ev.puntaje, ev.feedback, p.puesto
            FROM evaluaciones ev
            JOIN procesos p ON ev.proceso_id = p.id
            WHERE p.candidato_id = %s
            ORDER BY ev.id DESC
            """,
            (str(candidato_id),)
        )
        evaluaciones = cursor.fetchall()
    
    # Calcular promedio de puntajes
    promedio = sum(e[4] for e in evaluaciones if e[4]) / len(evaluaciones) if evaluaciones else 0
    
    return {
        "candidato_email": email,
        "total_evaluaciones": len(evaluaciones),
        "promedio_puntaje": round(promedio, 2),
        "evaluaciones": [
            {
                "id": str(e[0]),
                "tipo": e[1],
                "plataforma": e[2],
                "resultado": e[3],
                "puntaje": e[4],
                "feedback": e[5],
                "puesto": e[6]
            }
            for e in evaluaciones
        ]
    }


@app.put("/evaluaciones/{evaluacion_id}")
async def actualizar_evaluacion(
    evaluacion_id: str,
    resultado: str = Body(...),
    puntaje: float = Body(...),
    feedback: str = Body(...)
):
    """Actualizar los resultados de una evaluación"""
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            UPDATE evaluaciones
            SET resultado = %s, puntaje = %s, feedback = %s
            WHERE id = %s
            RETURNING id
            """,
            (resultado, puntaje, feedback, evaluacion_id)
        )
        result = cursor.fetchone()
        postgres_conn.commit()
    
    if not result:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    
    return {"id": str(result[0]), "mensaje": "Evaluación actualizada"}


# ==================== AUTENTICACIÓN ====================

@app.post("/register", status_code=201)
async def registrar_usuario(
    email: str = Body(...),
    password: str = Body(...),
    nombre: str = Body(...),
    rol: str = Body("candidato")
):
    """Registrar un nuevo usuario"""
    # Validar rol - NO permitir crear admins desde registro público
    if rol not in ["candidato", "empresa"]:
        raise HTTPException(status_code=400, detail="Rol inválido")
    
    # Verificar que no exista el usuario
    cursor = postgres_conn.cursor()
    cursor.execute("SELECT email FROM usuarios WHERE email = %s", (email,))
    if cursor.fetchone():
        cursor.close()
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Crear usuario
    password_hash = hash_password(password)
    cursor.execute(
        """
        INSERT INTO usuarios (email, password_hash, rol, nombre)
        VALUES (%s, %s, %s, %s)
        RETURNING id, email, rol, nombre
        """,
        (email, password_hash, rol, nombre)
    )
    usuario = cursor.fetchone()
    postgres_conn.commit()
    
    # Si es candidato, crear perfil en MongoDB y sincronizar
    if rol == "candidato":
        candidato_dict = {
            "email": email,
            "nombre": nombre,
            "skills": [],
            "seniority": None,
            "experiencia": "",
            "educacion": "",
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Guardar en MongoDB
        result_mongo = mongo_db.perfiles.insert_one(candidato_dict)
        candidato_dict["_id"] = str(result_mongo.inserted_id)
        
        # Sincronizar con PostgreSQL y Neo4j
        try:
            await sincronizar_candidato_creado(candidato_dict)
        except Exception as sync_error:
            print(f"⚠️ Error en sincronización durante registro: {sync_error}")
    
    cursor.close()
    
    # Generar token
    token = generar_token_jwt(email, rol)
    
    return {
        "id": str(usuario[0]),
        "email": usuario[1],
        "rol": usuario[2],
        "nombre": usuario[3],
        "access_token": token,
        "token_type": "bearer"
    }


@app.post("/login")
async def login(email: str = Body(...), password: str = Body(...)):
    """Iniciar sesión y obtener token JWT"""
    # Buscar usuario
    cursor = postgres_conn.cursor()
    cursor.execute(
        "SELECT email, password_hash, rol, nombre FROM usuarios WHERE email = %s",
        (email,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Verificar contraseña
    if not verificar_password(password, usuario[1]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    # Generar token
    token = generar_token_jwt(usuario[0], usuario[2])
    
    return {
        "email": usuario[0],
        "rol": usuario[2],
        "nombre": usuario[3],
        "access_token": token,
        "token_type": "bearer"
    }


@app.get("/me")
async def obtener_usuario_actual(current_user: dict = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    cursor = postgres_conn.cursor()
    cursor.execute(
        "SELECT email, rol, nombre, created_at FROM usuarios WHERE email = %s",
        (current_user["email"],)
    )
    usuario = cursor.fetchone()
    cursor.close()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {
        "email": usuario[0],
        "rol": usuario[1],
        "nombre": usuario[2],
        "created_at": usuario[3].isoformat()
    }