from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "tu-secreto-super-seguro-cambiar-en-produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def hash_password(password: str) -> str:
    """Hashea una contraseña con bcrypt"""
    # Truncar a 72 bytes para evitar error de bcrypt
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')

def verificar_password(password: str, password_hash: str) -> bool:
    """Verifica que una contraseña coincida con su hash"""
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.checkpw(password_bytes, password_hash.encode('utf-8'))

def generar_token_jwt(email: str, rol: str) -> str:
    """Genera un JWT con email y rol"""
    expira = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": email,
        "rol": rol,
        "exp": expira
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(token: str = Depends(oauth2_scheme)):
    """Verifica un JWT y retorna el payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        rol: str = payload.get("rol")
        
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        return {"email": email, "rol": rol}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado o inválido"
        )

def get_current_user(token_data: dict = Depends(verificar_token)):
    """Dependencia para obtener el usuario actual"""
    return token_data

def require_admin(current_user: dict = Depends(get_current_user)):
    """Requiere que el usuario tenga rol admin"""
    if current_user["rol"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de administrador"
        )
    return current_user

def require_recruiter(current_user: dict = Depends(get_current_user)):
    """Requiere que el usuario tenga rol admin o recruiter"""
    if current_user["rol"] not in ["admin", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de reclutador o administrador"
        )
    return current_user