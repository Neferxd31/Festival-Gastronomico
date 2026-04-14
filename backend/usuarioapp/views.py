from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginAdminSerializer
from .authentication import AdminJWTAuthentication
from .permissions import EsAdministrador
from .utils import generar_token


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