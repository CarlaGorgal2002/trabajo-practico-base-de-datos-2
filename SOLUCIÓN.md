# Propuesta de Arquitectura para Talentum+

## 1. Resumen Ejecutivo

Para construir el núcleo de la nueva plataforma **Talentum+**, se propone una arquitectura de **persistencia políglota**. Este enfoque consiste en utilizar múltiples bases de datos especializadas, seleccionando el motor más adecuado para cada tipo de dato y caso de uso.

Esta estrategia aborda directamente los requisitos clave del proyecto:

* **Escalabilidad horizontal**
* **Alta disponibilidad**
* **Optimizado por tipo de dato**

La integración entre estos componentes se realizará a través de una **arquitectura orientada a eventos**, garantizando un sistema desacoplado, resiliente y fácil de mantener.

---

## 2. Patrón de Arquitectura: Comunicación Orientada a Eventos

Para que las distintas bases de datos y servicios funcionen como un sistema cohesivo, utilizaremos un **bus de eventos** (como Apache Kafka o RabbitMQ).

**Funcionamiento:**
1.  **Publicación de Eventos**: Cuando un servicio realiza una acción importante (ej: el servicio de perfiles crea un nuevo candidato en MongoDB), publica un mensaje en el bus (ej: `evento: "CandidatoCreado"`).
2.  **Suscripción y Reacción**: Otros servicios (ej: el de recomendaciones) están suscritos a esos eventos. Al recibir el mensaje, actualizan sus propios datos (ej: agregan un nuevo nodo de `Candidato` en Neo4j).

Este patrón asegura que los servicios sean independientes y que el sistema pueda escalar cada componente por separado.

---

## 3. Selección de Tecnologías por Requerimiento

A continuación se detalla la tecnología recomendada para cada requisito funcional de la plataforma.

### 3.1. Perfiles, Búsquedas y Cursos (MongoDB)

* **Requisitos**:
    * Modelo de Candidatos y Empleados (datos personales, experiencia, skills, historial).
    * Publicación de Búsquedas Laborales.
    * Catálogo de Cursos y Capacitaciones.
* **Tecnología Recomendada**: **MongoDB** (Base de Datos Documental)
* **Justificación**:
    * **Esquema Flexible**: Los perfiles de los talentos IT y los requisitos de las búsquedas son increíblemente variados. El modelo de documentos de MongoDB permite que cada perfil tenga atributos diferentes (distintos `skills`, `certificaciones`, etc.) sin necesidad de una estructura rígida, lo cual es una característica clave de las bases de datos NoSQL.
    * **Agregación de Datos**: Almacenar toda la información de un candidato en un único documento facilita la creación de perfiles completos y la realización de consultas de agregación complejas (ej. "promedio de años de experiencia por skill").
    * **Escalabilidad**: MongoDB está diseñado para escalar horizontalmente (sharding), permitiendo distribuir la base de candidatos y ofertas a medida que la plataforma crezca.

---

### 3.2. Relaciones, Matching y Recomendaciones (Neo4j)

* **Requisitos**:
    * Matching automático con candidatos y lógica de recomendación.
    * Sistema de recomendaciones basado en intereses, cursos y redes de contacto.
    * Modelado de relaciones entre usuarios, mentores y equipos.
* **Tecnología Recomendada**: **Neo4j** (Base de Datos de Grafos)
* **Justificación**:
    * **Análisis de Conexiones**: La principal fortaleza de Neo4j es su capacidad para consultar relaciones complejas de manera eficiente, ideal para el motor de matching y recomendaciones.
    * **Rendimiento en Relaciones**: A diferencia de los `JOINs` en bases relacionales, recorrer relaciones en Neo4j tiene un costo constante, lo que garantiza un alto rendimiento.
    * **Modelo Intuitivo**: Permite un modelado natural del ecosistema: `(Candidato)-[:TIENE_SKILL]->(Skill)`, `(Candidato)-[:SIGUE]->(Mentor)`.

---

### 3.3. Caché y Sesiones (Redis)

* **Requisitos**:
    * Cacheo y sesiones para alta disponibilidad y rendimiento.
* **Tecnología Recomendada**: **Redis** (Base de Datos Clave-Valor en Memoria)
* **Justificación**:
    * **Velocidad**: Al operar en RAM, Redis ofrece latencias de submilisegundos, fundamental para una experiencia de usuario fluida. Se usará para almacenar datos de sesión y resultados de búsquedas frecuentes.
    * **Reducción de Carga**: Actúa como una primera capa de lectura rápida, reduciendo la carga sobre las bases de datos principales.
    * **Estructuras de Datos Avanzadas**: Se puede usar para funcionalidades en tiempo real, como rankings de skills (Sorted Sets) o colas de notificaciones (Lists).

---

### 3.4. Procesos de Selección y Datos Confidenciales (PostgreSQL)

* **Requisitos**:
    * Seguimiento de los estados del proceso de selección (preselección, entrevista, propuesta, rechazo).
    * Registro de feedback y notas confidenciales, garantizando seguridad y privacidad.
* **Tecnología Recomendada**: **PostgreSQL** (Base de Datos Relacional)
* **Justificación**:
    * **Consistencia Fuerte (ACID)**: El flujo de un proceso de selección es transaccional y no puede fallar a la mitad. Las bases de datos relacionales garantizan esto por diseño, ubicándose en el espectro **CA** (Consistencia y Disponibilidad) del teorema CAP para sistemas centralizados.
    * **Seguridad y Madurez**: PostgreSQL cuenta con un sistema de roles y permisos muy robusto, ideal para proteger la información confidencial.
    * **Integridad de Datos**: La naturaleza estructurada y las restricciones del modelo relacional aseguran que los datos del proceso de selección sean siempre coherentes y válidos.

---

## 4. Tabla Resumen de la Arquitectura

| Módulo/Funcionalidad | Tipo de Dato | Tecnología Recomendada | Justificación Clave |
| :--- | :--- | :--- | :--- |
| **Perfiles, Búsquedas, Cursos**| Documentos semi-estructurados| **MongoDB** | Flexibilidad de esquema y escalabilidad horizontal. |
| **Matching y Recomendaciones**| Relaciones y redes | **Neo4j** | Rendimiento superior en consultas de relaciones complejas.|
| **Caché, Sesiones, Tiempo Real**| Datos volátiles y rápidos | **Redis** | Velocidad en memoria para máxima performance. |
| **Procesos de Selección** | Datos transaccionales | **PostgreSQL** | Garantías ACID para integridad y seguridad. |