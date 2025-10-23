// Constraints
CREATE CONSTRAINT candidato_id IF NOT EXISTS
FOR (c:Candidato) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT skill_nombre IF NOT EXISTS
FOR (s:Skill) REQUIRE s.nombre IS UNIQUE;

CREATE CONSTRAINT rol_nombre IF NOT EXISTS
FOR (r:Rol) REQUIRE r.nombre IS UNIQUE;

CREATE CONSTRAINT curso_codigo IF NOT EXISTS
FOR (cu:Curso) REQUIRE cu.codigo IS UNIQUE;

CREATE CONSTRAINT empresa_id IF NOT EXISTS
FOR (e:Empresa) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT oferta_id IF NOT EXISTS
FOR (o:Oferta) REQUIRE o.id IS UNIQUE;

// Datos de ejemplo
MERGE (c:Candidato {id: "ada@talentum.plus"})
  ON CREATE SET c.nombre = "Ada Lovelace", c.seniority = "Senior", c.activo = true;

MERGE (s1:Skill {nombre: "Machine Learning"});
MERGE (s2:Skill {nombre: "Python"});
MERGE (s3:Skill {nombre: "Data Science"});

MERGE (c)-[:DOMINA]->(s1);
MERGE (c)-[:DOMINA]->(s2);
MERGE (c)-[:DOMINA]->(s3);

MERGE (r:Rol {nombre: "ML Engineer"});
MERGE (r)-[:REQUIERE]->(s1);
MERGE (r)-[:REQUIERE]->(s2);

// NUEVO: Curso de ejemplo
MERGE (cu:Curso {codigo: "PY101", nombre: "Python para Data Science"});
MERGE (c)-[:INSCRITO_EN {progreso: 0.8}]->(cu);

// NUEVO: Empresa y oferta
MERGE (e:Empresa {id: "techcorp", nombre: "TechCorp SA"});
MERGE (of:Oferta {id: "backend-sr-001", titulo: "Senior Backend Developer"});
MERGE (e)-[:PUBLICA]->(of);
MERGE (of)-[:REQUIERE]->(s2);  // Requiere Python