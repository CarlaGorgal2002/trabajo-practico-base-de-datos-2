# TPO 1: Plataforma Integral de Gestión de Talento IT

## Contexto General

Talentum+ es una startup tecnológica de base latinoamericana que está creciendo rápidamente y necesita escalar su plataforma para gestionar todos los aspectos del ciclo de vida del talento IT: desde la atracción y reclutamiento, hasta el desarrollo y retención de profesionales.

Durante la pandemia, Talentum+ desarrolló una solución básica para publicar búsquedas laborales, pero con el crecimiento de la demanda, inversores internacionales han apostado por un rediseño completo del sistema. La nueva plataforma debe integrar reclutamiento, formación, evaluación, relaciones laborales y datos en tiempo real, con un enfoque fuertemente distribuido y centrado en la escalabilidad, personalización y trazabilidad del perfil de cada talento.

Talentum+ está buscando un equipo de ingeniería full-stack especializado en arquitecturas distribuidas. Recibieron un desafío: construir el nuevo núcleo de la plataforma, capaz de gestionar miles de candidatos, búsquedas y procesos de desarrollo profesional en simultáneo.

Van a trabajar en un entorno de alta exigencia técnica, donde los datos son heterogéneos, relacionales, dinámicos y, en muchos casos, confidenciales.

### Requisitos del Sistema

Se les exige un sistema:
* Escalable horizontalmente
* Altamente disponible
* Optimizado por tipo de dato
* Capaz de integrar analítica y relaciones sociales

La empresa trabaja con stack moderno, y cada tipo de dato debe estar almacenado en el motor más adecuado, lo que exige una arquitectura multimodelo y desacoplada.

Además, se espera que puedan anticiparse a casos reales del negocio: recomendaciones automáticas, dashboards por empresa, segmentación por habilidades, mentoring en red y visualización de trayectorias.

## Consejos para el Grupo

* Pregúntense qué información conviene guardar en qué tipo de base de datos.
* Piensen las relaciones: ¿Qué usuarios se vinculan? ¿Qué entidad recomienda a cuál?.
* No duden en modelar casos no explícitos (por ejemplo: historial de rechazos, cursos obligatorios, métricas de éxito).
* Tomen decisiones de diseño fundamentadas en el tipo de modelo y sus ventajas.
* Definan cómo garantizan alta disponibilidad y cómo cada tecnología responde ante el crecimiento de la plataforma.

## Requerimientos Funcionales

1.  **Modelo de Candidatos y Empleados:**
    * Datos personales, experiencia, skills técnicos y soft, historial de procesos de selección, entrevistas y evaluaciones.
    * Historial de cambios y evolución en su perfil.

2.  **Publicación de Búsquedas y Matching Inteligente:**
    * Empresas publican posiciones con requisitos.
    * Matching automático con candidatos según nivel de afinidad, y lógica de recomendación.

3.  **Seguimiento de Procesos de Selección:**
    * Estados: preselección, entrevista, técnica, propuesta, rechazo.
    * Registro de entrevistas, feedback y notas confidenciales (seguridad y privacidad).

4.  **Gestión de Capacitación y Certificaciones:**
    * Catálogo de cursos con videos, PDFs, clases.
    * Registro de inscripciones, progreso y calificaciones.

5.  **Sistema de Recomendaciones:**
    * Basado en intereses, cursos tomados y redes de contacto.

6.  **Infraestructura y Escalabilidad:**
    * Base para candidatos y ofertas.
    * Relaciones entre usuarios, mentores y equipos.
    * Cacheo y sesiones.
    * Almacenar objetos de evaluación y perfiles persistentes complejos.

## Objetivo Final

Desarrollar una propuesta integral que conecte los modelos de BD elegidos y presentar la propuesta a Talentum+.