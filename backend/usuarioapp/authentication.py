from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .utils import verificar_token
from .models import Usuario, Administrador


class AdminJWTAuthentication(BaseAuthentication):
    """
    Autenticación JWT personalizada para administradores.
    Busca el token en el header: Authorization: Bearer <token>
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return None  # No intenta autenticar — deja pasar a otras clases

        token = auth_header.split(" ")[1]

        try:
            payload = verificar_token(token)
        except ValueError as e:
            raise AuthenticationFailed(str(e))

        # Verificar que el usuario y su perfil admin existen
        try:
            usuario = Usuario.objects.select_related(
                "perfil_administrador"
            ).get(id=payload["user_id"])
            _ = usuario.perfil_administrador  # confirma que es admin
        except (Usuario.DoesNotExist, Administrador.DoesNotExist):
            raise AuthenticationFailed("Usuario no encontrado o sin permisos.")

        return (usuario, token)