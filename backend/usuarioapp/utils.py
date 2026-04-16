import jwt
import datetime
from django.conf import settings


def generar_token(usuario):
    """Genera un JWT firmado con los datos del administrador."""
    payload = {
        "user_id": usuario.id,
        "email": usuario.email,
        "nombre": usuario.nombre,
        "rol": "administrador",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
        "iat": datetime.datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token


def verificar_token(token):
    """Decodifica y valida el JWT. Retorna el payload o lanza excepción."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("El token ha expirado.")
    except jwt.InvalidTokenError:
        raise ValueError("Token inválido.")