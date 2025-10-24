from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class Candidato(BaseModel):
    nombre: str
    email: EmailStr
    seniority: Optional[str] = None
    skills: List[str] = []
    cursos: List[dict] = []

class Proceso(BaseModel):
    candidato_id: str
    puesto: str
    estado: str
    feedback: Optional[str] = None
    notas_confidenciales: Optional[str] = None  # Solo visible para RRHH/admin
    updated_at: Optional[datetime] = None

class MatchingRequest(BaseModel):
    puesto: str
    skills_requeridos: List[str]
    seniority_minimo: Optional[str] = None

class Curso(BaseModel):
    codigo: str
    nombre: str
    descripcion: str
    duracion_horas: int
    categoria: str  # Backend, Frontend, DevOps
    nivel: str  # Principiante, Intermedio, Avanzado
    recursos: List[str]  # URLs a videos/PDFs
    instructor: str
    skills: List[str] = []  # Skills que otorga al aprobar el curso

class Inscripcion(BaseModel):
    candidato_email: EmailStr
    curso_codigo: str
    fecha_inscripcion: datetime = datetime.now()
    progreso: float = 0.0  # 0.0 a 1.0
    calificacion: Optional[float] = None  # 0-100
    completado: bool = False

class Empresa(BaseModel):
    nombre: str
    cuit: str
    sector: str  # Tech, Finanzas, Salud
    tamaño: str  # Startup, PyME, Corporación
    descripcion: str
    logo_url: Optional[str] = None

class OfertaLaboral(BaseModel):
    titulo: str
    empresa: str  # Email de la empresa
    descripcion: str
    requisitos: Optional[str] = None  # String con requisitos separados por comas
    skills_requeridos: Optional[List[str]] = []  # Array de skills (generado desde requisitos)
    salario: Optional[float] = None
    ubicacion: Optional[str] = None
    modalidad: str = "presencial"  # presencial, remoto, hibrido
    tipo_contrato: str = "full-time"  # full-time, part-time, freelance, contrato, pasantia
    estado: str = "abierta"  # abierta, cerrada, pausada
    fecha_publicacion: datetime = datetime.now()
    seniority_minimo: Optional[str] = None  # junior, semi-senior, senior

class Entrevista(BaseModel):
    proceso_id: str
    tipo: str  # técnica, HR, cultural
    fecha: datetime
    entrevistador: str
    duracion_minutos: int
    notas: str
    puntaje: Optional[int] = None  # 1-5

class EvaluacionTecnica(BaseModel):
    proceso_id: str
    tipo: str  # coding, live, take-home
    plataforma: str  # HackerRank, Codility
    resultado: str
    puntaje: float
    feedback: str

class Usuario(BaseModel):
    email: EmailStr
    password_hash: str
    rol: str  # admin, recruiter, candidato

class SolicitudConexion(BaseModel):
    remitente_email: EmailStr
    destinatario_email: EmailStr
    mensaje: Optional[str] = None
    estado: str = "pendiente"  # pendiente, aceptada, rechazada
    fecha_solicitud: datetime = datetime.now()