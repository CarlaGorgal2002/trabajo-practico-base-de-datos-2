db = db.getSiblingDB("talentum");

// Colección existente de perfiles
db.createCollection("perfiles");
db.perfiles.createIndex({ email: 1 }, { unique: true });

db.perfiles.updateOne(
  { email: "ada@talentum.plus" },
  {
    $set: {
      nombre: "Ada Lovelace",
      seniority: "Senior",
      skills: ["Python", "Data Science", "Machine Learning"],  // Array en lugar de string
      cursos: [{ codigo: "ML101", progreso: 0.8 }]
    }
  },
  { upsert: true }
);

// NUEVO: Colección de cursos
db.createCollection("cursos");
db.cursos.createIndex({ codigo: 1 }, { unique: true });

db.cursos.insertOne({
  codigo: "PY101",
  nombre: "Python para Data Science",
  descripcion: "Fundamentos de Python aplicados a análisis de datos",
  duracion_horas: 40,
  categoria: "Backend",
  nivel: "Intermedio",
  recursos: ["https://video.com/py101", "https://pdf.com/py101.pdf"],
  instructor: "Guido van Rossum",
  skills: ["Python", "Data Science", "Pandas", "NumPy"]
});

// NUEVO: Colección de inscripciones
db.createCollection("inscripciones");
db.inscripciones.createIndex({ candidato_email: 1, curso_codigo: 1 }, { unique: true });

// NUEVO: Colección de empresas
db.createCollection("empresas");
db.empresas.createIndex({ cuit: 1 }, { unique: true });

db.empresas.insertOne({
  nombre: "TechCorp SA",
  cuit: "30-12345678-9",
  sector: "Tech",
  tamaño: "Corporación",
  descripcion: "Empresa líder en soluciones cloud",
  logo_url: "https://techcorp.com/logo.png"
});

// NUEVO: Colección de ofertas laborales
db.createCollection("ofertas");
db.ofertas.createIndex({ empresa_id: 1 });

db.ofertas.insertOne({
  titulo: "Senior Backend Developer",
  empresa_id: "techcorp",
  descripcion: "Buscamos dev con experiencia en microservicios",
  skills_requeridos: ["python", "docker", "kubernetes"],
  seniority_minimo: "Semi-Senior",
  modalidad: "Remoto",
  salario_min: 3000,
  salario_max: 5000,
  ubicacion: "Argentina",
  estado: "Activa",
  fecha_publicacion: new Date()
});

// NUEVO: Colección de historial de cambios
db.createCollection("historial_cambios");
db.historial_cambios.createIndex({ candidato_email: 1, timestamp: -1 });