from rest_framework import serializers
from .models import Usuario, Administrador


class LoginAdminSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        # Escenario 3: campos vacíos — DRF los valida automáticamente antes de llegar aquí

        # Escenario 2: verificar que el usuario existe
        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Credenciales inválidas."}
            )

        # Escenario 2: verificar que tiene perfil de administrador
        try:
            admin = usuario.perfil_administrador
        except Administrador.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Credenciales inválidas."}
            )

        # Escenario 2: verificar contraseña
        if not admin.check_password(password):
            raise serializers.ValidationError(
                {"detail": "Credenciales inválidas."}
            )

        # Inyectamos los objetos validados para usarlos en la vista
        attrs["usuario"] = usuario
        attrs["administrador"] = admin
        return attrs