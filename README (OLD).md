# Cómo ejecutar Talentum+

## Prerrequisitos
1. Instalar Docker Desktop y asegurarse de que esté en ejecución.
2. Abrir una terminal en la carpeta del proyecto (`c:\Users\Napero\Desktop\pussy\talentum-plus`).

## Crear red compartida
```powershell
docker network create talentum-net
```

## Levantar bases de datos
```powershell
docker run -d --name mongo --network talentum-net -p 27017:27017 mongo:7
docker run -d --name redis --network talentum-net -p 6379:6379 redis:7
docker run -d --name postgres --network talentum-net -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=talentum -p 5431:5432 postgres:16
docker run -d --name neo4j --network talentum-net -e NEO4J_AUTH=neo4j/neo4j1234 -p 7474:7474 -p 7687:7687 neo4j:5
```

## Construir la imagen de la app
```powershell
docker build -t talentum-plus .
```

## Ejecutar la app conectada a la red
```powershell
docker run --rm --name talentum-plus --network talentum-net -p 8080:8080 talentum-plus
```

## Verificar API
Abrir http://localhost:8080 y comprobar la respuesta HTML.

## Acceso a las bases de datos
- **MongoDB**: `mongodb://localhost:27017` (GUI sugerida: MongoDB Compass).
- **Redis**: `redis://localhost:6379/0` (GUI: RedisInsight).
- **PostgreSQL**: `postgresql://postgres:postgres@localhost:5431/talentum` (GUI: pgAdmin o DBeaver).
- **Neo4j**: Navegador web en http://localhost:7474 (usuario `neo4j`, password `neo4j1234`). Bolt: `bolt://localhost:7687`.

## Detener servicios
```powershell
docker stop talentum-plus mongo redis postgres neo4j
docker network rm talentum-net
```