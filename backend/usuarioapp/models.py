from django.db import models
from django.contrib.auth.hashers import make_password, check_password  


class Usuario(models.Model):
    nombre = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Requerido por DRF para que IsAuthenticated funcione
    # con modelos que no heredan de AbstractUser
    is_authenticated = True

    class Meta:
        db_table = "usuario"

    def __str__(self):
        return f"{self.nombre} - {self.email}"


class Administrador(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="perfil_administrador"
    )
    password_hash = models.CharField(max_length=255)
    token_reset = models.CharField(max_length=255, null=True, blank=True)
    token_reset_expiry = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "administrador"

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)
        self.save()

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def __str__(self):
        return f"Administrador: {self.usuario.email}"


class Votante(models.Model):
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.CASCADE,
        related_name="perfil_votante"
    )
    cedula = models.CharField(max_length=20, unique=True, null=True, blank=True)
    google_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    foto_url = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "votante"

    def __str__(self):
        return f"Votante: {self.usuario.nombre}"