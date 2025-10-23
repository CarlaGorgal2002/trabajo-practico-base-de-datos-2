import os
from pymongo import MongoClient
import redis
import psycopg2
from neo4j import GraphDatabase

# MongoDB
mongo_client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017/talentum"))
mongo_db = mongo_client.talentum

# Redis
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

# PostgreSQL
postgres_conn = psycopg2.connect(os.getenv("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5431/talentum"))

# Neo4j
neo4j_driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI", "bolt://localhost:7687"),
    auth=("neo4j", "neo4j1234")
)