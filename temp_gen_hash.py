import bcrypt
import psycopg2

# Generar hash
password = "Admin2025!"
hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
print(f"Hash generado: {hash}")

# Conectar a PostgreSQL
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="talentum",
    user="postgres",
    password="postgres"
)

cursor = conn.cursor()

# Actualizar admin
cursor.execute(
    "UPDATE usuarios SET password_hash = %s WHERE email = 'admin@talentum.plus'",
    (hash,)
)
conn.commit()

print(f"✅ Admin actualizado con nuevo hash")

# Verificar
cursor.execute("SELECT email, password_hash FROM usuarios WHERE email = 'admin@talentum.plus'")
result = cursor.fetchone()
print(f"Verificación - Email: {result[0]}")
print(f"Hash guardado: {result[1][:40]}...")

cursor.close()
conn.close()
