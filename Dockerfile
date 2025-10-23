# syntax=docker/dockerfile:1.6

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/opt/talentum

WORKDIR ${APP_HOME}

# Instalar dependencias directamente
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi==0.111.0 \
    "uvicorn[standard]==0.30.1" \
    pydantic==2.7.4 \
    python-dotenv==1.0.1 \
    pymongo==4.7.2 \
    redis==5.0.4 \
    psycopg2-binary==2.9.9 \
    neo4j==5.19.0 \
    "python-jose[cryptography]==3.3.0" \
    "passlib[bcrypt]==1.7.4"

COPY . .

ENV MONGO_URI=mongodb://mongo:27017/talentum \
    POSTGRES_DSN=postgresql://postgres:postgres@postgres:5432/talentum \
    NEO4J_URI=bolt://neo4j:7687 \
    REDIS_URL=redis://redis:6379/0

EXPOSE 8080

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]