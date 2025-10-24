CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla existente de candidatos
CREATE TABLE IF NOT EXISTS candidatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    seniority TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla existente de procesos
CREATE TABLE IF NOT EXISTS procesos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_id TEXT NOT NULL,
    puesto TEXT NOT NULL,
    estado TEXT NOT NULL,
    feedback TEXT,
    feedback_encrypted BYTEA,  -- NUEVO: Feedback cifrado
    notas_confidenciales TEXT,  -- NUEVO: Notas solo para RRHH/admin
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- NUEVO: Tabla de aplicaciones a ofertas
CREATE TABLE IF NOT EXISTS aplicaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidato_email TEXT NOT NULL,
    oferta_id TEXT NOT NULL,  -- ObjectId de MongoDB (string)
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    fecha_aplicacion TIMESTAMPTZ DEFAULT now()
);

-- NUEVO: Tabla de entrevistas
CREATE TABLE IF NOT EXISTS entrevistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    fecha TIMESTAMPTZ NOT NULL,
    entrevistador TEXT NOT NULL,
    duracion_minutos INT,
    notas TEXT,
    puntaje INT CHECK (puntaje BETWEEN 1 AND 5)
);

-- NUEVO: Tabla de evaluaciones técnicas
CREATE TABLE IF NOT EXISTS evaluaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proceso_id UUID REFERENCES procesos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    plataforma TEXT,
    resultado TEXT,
    puntaje FLOAT,
    feedback TEXT
);

-- NUEVO: Tabla de usuarios (JWT)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'candidato', 'empresa')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Usuario administrador predefinido (NO se puede crear más desde el registro)
-- Email: admin@talentum.plus
-- Contraseña: Admin2025!
-- IMPORTANTE: Cambiar esta contraseña en producción
INSERT INTO usuarios (email, password_hash, nombre, rol)
VALUES (
    'admin@talentum.plus',
    '$2b$12$aQdTprXz5xe9xGO7LdDUwu2J1bJvIg/dI.1exbd2SxhxvLZSPwdX.',
    'Administrador del Sistema',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- Datos de ejemplo
INSERT INTO candidatos (nombre, email, seniority)
VALUES ('Ada Lovelace', 'ada@talentum.plus', 'Senior')
ON CONFLICT (email) DO NOTHING;

INSERT INTO procesos (candidato_id, puesto, estado, feedback)
VALUES ('ada@talentum.plus', 'Machine Learning Engineer', 'En revisión', 'Perfil destacado')
ON CONFLICT DO NOTHING;