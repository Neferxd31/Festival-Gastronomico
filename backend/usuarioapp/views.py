from .serializers import LoginAdminSerializer
from .authentication import AdminJWTAuthentication
from .permissions import EsAdministrador
from .utils import generar_token
from .email_template import reset_password_template

import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import secrets

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    ResetPasswordSerializer,
    ResetPasswordTokenSerializer
)

class LoginAdminView(APIView):
    """
    POST /api/usuarios/login/
    Cubre escenarios 1, 2 y 3.
    """
    authentication_classes = []  # Login es público
    permission_classes = []

    def post(self, request):
        serializer = LoginAdminSerializer(data=request.data)

        # Escenario 3: campos vacíos → 400
        # Escenario 2: credenciales inválidas → 400
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        usuario = serializer.validated_data["usuario"]
        token = generar_token(usuario)

        # Escenario 1: login exitoso → 200
        return Response({
            "token": token,
            "usuario": {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "email": usuario.email,
                "rol": "administrador",
            },
            "mensaje": f"Bienvenido, {usuario.nombre}.",
        }, status=status.HTTP_200_OK)


class PanelAdminView(APIView):
    """
    GET /api/usuarios/panel/
    Escenario 5: panel con funcionalidades del administrador.
    Requiere token válido en header Authorization: Bearer <token>
    """
    authentication_classes = [AdminJWTAuthentication]
    permission_classes = [EsAdministrador]

    def get(self, request):
        usuario = request.user
        return Response({
            "usuario": {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "email": usuario.email,
                "rol": "administrador",
            },
            "funcionalidades": [
                {"id": 1, "nombre": "Gestionar restaurantes", "ruta": "/admin/restaurantes"},
                {"id": 2, "nombre": "Gestionar jurados",      "ruta": "/admin/jurados"},
                {"id": 3, "nombre": "Ver resultados",          "ruta": "/admin/resultados"},
                {"id": 4, "nombre": "Gestionar festival",      "ruta": "/admin/festival"},
                {"id": 5, "nombre": "Gestionar interacciones", "ruta": "/admin/interacciones"},
            ],
            "mensaje": f"Panel de administrador activo — {usuario.nombre}.",
        })
    
#---------------------VIEW para restablecer contraseña:------------------------------------

class ResetPasswordAPI(APIView):
    """
    POST /api/usuarios/reset-password/
    Paso 1: enviar código al correo
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        admin = serializer.context["admin"]
        email = serializer.validated_data["email"]

        # Generar código de 6 dígitos
        token = str(secrets.randbelow(900000) + 100000)

        admin.token_reset = token
        admin.token_reset_expiry = timezone.now() + timedelta(minutes=15)
        admin.save()

        # Configurar Brevo
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key["api-key"] = settings.BREVO_API_KEY

        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(
            sib_api_v3_sdk.ApiClient(configuration)
        )

        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email}],
            sender={
                "name": "Festival Gastronómico",
                "email": settings.BREVO_SENDER_EMAIL
            },
            subject="Recuperación de contraseña",
            html_content=reset_password_template(token)
        )

        try:
            api_instance.send_transac_email(send_smtp_email)
        except ApiException:
            return Response(
                {"detail": "No fue posible enviar el correo."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            "mensaje": "Se envió el código al correo."
        }, status=status.HTTP_200_OK)


class ConfirmResetPasswordAPI(APIView):
    """
    POST /api/usuarios/reset-password/confirm/
    Paso 2: validar código y cambiar contraseña
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        serializer = ResetPasswordTokenSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        admin = serializer.validated_data["admin"]
        new_password = serializer.validated_data["new_password"]

        # Cambiar contraseña
        admin.set_password(new_password)

        # Invalidar token
        admin.token_reset = None
        admin.token_reset_expiry = None
        admin.save()

        return Response({
            "mensaje": "Contraseña actualizada correctamente."
        }, status=status.HTTP_200_OK)
    
class LogoutView(APIView):
    """
    POST /api/usuarios/logout/
    Invalida la sesión del usuario (admin o votante).
    El cliente debe enviar Authorization: Bearer <token> para admin,
    o simplemente llamar al endpoint para limpiar la sesión de votante.
    """
    authentication_classes = [AdminJWTAuthentication]
    permission_classes = []  # Permitir también votantes sin token

    def post(self, request):
        # Si viene con token de admin, lo recibimos pero el logout
        # es stateless (JWT), así que solo confirmamos al cliente
        # que puede eliminar el token de su lado.
        return Response(
            {"mensaje": "Sesión cerrada correctamente."},
            status=status.HTTP_200_OK
        )