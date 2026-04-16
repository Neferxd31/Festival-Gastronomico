from rest_framework.permissions import BasePermission
from .models import Administrador


class EsAdministrador(BasePermission):
    """Permite acceso solo si el usuario tiene perfil de Administrador."""
    message = "No tienes permisos para acceder a esta sección."

    def has_permission(self, request, view):
        if not request.user:
            return False
        try:
            _ = request.user.perfil_administrador
            return True
        except Administrador.DoesNotExist:
            return False