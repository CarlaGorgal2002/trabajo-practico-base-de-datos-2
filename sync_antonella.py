"""Script para sincronizar el perfil de Antonella en todas las bases de datos"""
import asyncio
from src.database import mongo_db, postgres_conn, neo4j_driver
from src.events import sincronizar_candidato_creado
from datetime import datetime

async def sync_antonella():
    # Datos de Antonella desde la tabla usuarios
    email = "antonellafarfan@gmail.com"
    nombre = "Antonella Farfan"
    
    # Verificar si ya existe en MongoDB
    existing = mongo_db.perfiles.find_one({"email": email})
    if existing:
        print(f"✓ Antonella ya existe en MongoDB con ID: {existing['_id']}")
        candidato_dict = existing
        candidato_dict["_id"] = str(candidato_dict["_id"])
    else:
        # Crear perfil en MongoDB
        candidato_dict = {
            "email": email,
            "nombre": nombre,
            "skills": [],
            "seniority": None,
            "experiencia": "",
            "educacion": "",
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = mongo_db.perfiles.insert_one(candidato_dict)
        candidato_dict["_id"] = str(result.inserted_id)
        print(f"✓ Perfil creado en MongoDB con ID: {candidato_dict['_id']}")
    
    # Sincronizar con PostgreSQL y Neo4j
    try:
        await sincronizar_candidato_creado(candidato_dict)
        print("✓ Sincronización completada en PostgreSQL y Neo4j")
    except Exception as e:
        print(f"❌ Error en sincronización: {e}")
    
    # Verificar sincronización
    cursor = postgres_conn.cursor()
    cursor.execute("SELECT id, nombre, email FROM candidatos WHERE email = %s", (email,))
    candidato_pg = cursor.fetchone()
    cursor.close()
    
    if candidato_pg:
        print(f"✓ Candidato verificado en PostgreSQL: {candidato_pg}")
    else:
        print("❌ Candidato NO encontrado en PostgreSQL")

if __name__ == "__main__":
    asyncio.run(sync_antonella())
