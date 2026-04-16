from datetime import timedelta
from django.utils import timezone

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


#-------------------Serializer de restablecer contraseña:--------------------------------------------
class ResetPasswordSerializer(serializers.Serializer):
    """
    Paso 1:
    Solicitar código al correo
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            usuario = Usuario.objects.get(email=value)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("El correo no está registrado.")

        try:
            admin = usuario.perfil_administrador
        except Administrador.DoesNotExist:
            raise serializers.ValidationError("El correo no pertenece a un administrador.")

        self.context["usuario"] = usuario
        self.context["admin"] = admin
        return value


class ResetPasswordTokenSerializer(serializers.Serializer):
    """
    Paso 2:
    Confirmar código + nueva contraseña
    """
    email = serializers.EmailField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        email = attrs.get("email")
        token = attrs.get("token")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Las contraseñas no coinciden."
            })

        try:
            usuario = Usuario.objects.get(email=email)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError({
                "detail": "Correo inválido."
            })

        try:
            admin = usuario.perfil_administrador
        except Administrador.DoesNotExist:
            raise serializers.ValidationError({
                "detail": "Usuario no autorizado."
            })

        if not admin.token_reset:
            raise serializers.ValidationError({
                "detail": "No existe solicitud de recuperación."
            })

        if admin.token_reset != token:
            raise serializers.ValidationError({
                "detail": "Código inválido."
            })

        if not admin.token_reset_expiry or admin.token_reset_expiry < timezone.now():
            raise serializers.ValidationError({
                "detail": "El código expiró."
            })

        attrs["usuario"] = usuario
        attrs["admin"] = admin
        return attrs