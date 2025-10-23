from src.database import mongo_db, neo4j_driver, redis_client, postgres_conn
import json
from typing import List, Dict

async def sincronizar_candidato_creado(candidato: dict):
    """
    Cuando se crea un candidato en MongoDB, sincroniza con Neo4j, Redis y PostgreSQL
    """
    email = candidato["email"]
    nombre = candidato["nombre"]
    skills = candidato.get("skills", [])
    seniority = candidato.get("seniority", "Junior")
    
    # 1. Sincronizar con Neo4j (crear nodo + relaciones)
    with neo4j_driver.session() as session:
        # Crear nodo Candidato
        session.run(
            """
            MERGE (c:Candidato {id: $email})
            SET c.nombre = $nombre, c.seniority = $seniority, c.activo = true
            """,
            email=email,
            nombre=nombre,
            seniority=seniority
        )
        
        # Crear relaciones con Skills
        for skill in skills:
            session.run(
                """
                MERGE (s:Skill {nombre: $skill})
                WITH s
                MATCH (c:Candidato {id: $email})
                MERGE (c)-[:DOMINA]->(s)
                """,
                skill=skill,
                email=email
            )
    
    # 2. Crear entrada en PostgreSQL para tracking
    with postgres_conn.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO candidatos (nombre, email, seniority)
            VALUES (%s, %s, %s)
            ON CONFLICT (email) DO UPDATE 
            SET nombre = EXCLUDED.nombre, seniority = EXCLUDED.seniority
            """,
            (nombre, email, seniority)
        )
        postgres_conn.commit()
    
    # 3. Cachear perfil en Redis
    redis_client.setex(
        f"perfil:{email}",
        3600,
        json.dumps({
            "nombre": nombre,
            "seniority": seniority,
            "skills": skills
        })
    )
    
    print(f"✅ Candidato {email} sincronizado en Neo4j, PostgreSQL y Redis")


async def sincronizar_candidato_actualizado(email: str, cambios: dict):
    """
    Cuando se actualiza un candidato en MongoDB, propaga cambios
    """
    # 1. Actualizar Neo4j si cambió seniority o skills
    if "seniority" in cambios or "skills" in cambios:
        with neo4j_driver.session() as session:
            if "seniority" in cambios:
                session.run(
                    "MATCH (c:Candidato {id: $email}) SET c.seniority = $seniority",
                    email=email,
                    seniority=cambios["seniority"]
                )
            
            if "skills" in cambios:
                # Eliminar skills antiguos
                session.run(
                    "MATCH (c:Candidato {id: $email})-[r:DOMINA]->(:Skill) DELETE r",
                    email=email
                )
                # Agregar nuevos
                for skill in cambios["skills"]:
                    session.run(
                        """
                        MERGE (s:Skill {nombre: $skill})
                        WITH s
                        MATCH (c:Candidato {id: $email})
                        MERGE (c)-[:DOMINA]->(s)
                        """,
                        skill=skill,
                        email=email
                    )
    
    # 2. Invalidar caché
    redis_client.delete(f"perfil:{email}")
    redis_client.delete(f"recomendaciones:{email}")
    
    print(f"✅ Candidato {email} actualizado y caché invalidado")


async def sincronizar_proceso_creado(proceso: dict):
    """
    Cuando se crea un proceso en PostgreSQL, actualiza Neo4j
    """
    candidato_id = proceso["candidato_id"]
    puesto = proceso["puesto"]
    estado = proceso["estado"]
    
    # Crear relación en Neo4j: (Candidato)-[:POSTULA_A]->(Rol)
    with neo4j_driver.session() as session:
        session.run(
            """
            MERGE (r:Rol {nombre: $puesto})
            WITH r
            MATCH (c:Candidato {id: $candidato_id})
            MERGE (c)-[rel:POSTULA_A]->(r)
            SET rel.estado = $estado, rel.fecha = datetime()
            """,
            puesto=puesto,
            candidato_id=candidato_id,
            estado=estado
        )
    
    # Invalidar caché del candidato
    redis_client.delete(f"perfil:{candidato_id}")
    
    print(f"✅ Proceso para {candidato_id} en rol {puesto} registrado en Neo4j")


async def matching_automatico(puesto: str, skills_requeridos: List[str]) -> List[Dict]:
    """
    Busca candidatos que matcheen con un puesto (usando Neo4j)
    """
    with neo4j_driver.session() as session:
        result = session.run(
            """
            MATCH (c:Candidato)-[:DOMINA]->(s:Skill)
            WHERE s.nombre IN $skills AND c.activo = true
            WITH c, COUNT(s) AS match_count
            WHERE match_count >= $min_match
            RETURN c.id AS email, c.nombre AS nombre, c.seniority AS seniority, 
                   match_count
            ORDER BY match_count DESC
            LIMIT 10
            """,
            skills=skills_requeridos,
            min_match=len(skills_requeridos) // 2  # Al menos 50% de match
        )
        
        candidatos = [
            {
                "email": record["email"],
                "nombre": record["nombre"],
                "seniority": record["seniority"],
                "match_skills": record["match_count"],
                "match_percentage": (record["match_count"] / len(skills_requeridos)) * 100
            }
            for record in result
        ]
        
        # Cachear resultado del matching
        cache_key = f"matching:{puesto}:{'-'.join(sorted(skills_requeridos))}"
        redis_client.setex(cache_key, 600, json.dumps(candidatos))
        
        print(f"✅ Matching para {puesto}: {len(candidatos)} candidatos encontrados")
        return candidatos


async def registrar_interaccion_mentor(candidato_id: str, mentor_id: str, tipo: str):
    """
    Registra interacciones de mentoring en Neo4j
    """
    with neo4j_driver.session() as session:
        session.run(
            """
            MATCH (c:Candidato {id: $candidato_id})
            MERGE (m:Mentor {id: $mentor_id})
            MERGE (c)-[r:MENTOREADO_POR]->(m)
            SET r.tipo = $tipo, r.ultima_interaccion = datetime()
            """,
            candidato_id=candidato_id,
            mentor_id=mentor_id,
            tipo=tipo
        )
    
    print(f"✅ Interacción de mentoring registrada: {candidato_id} <- {mentor_id}")