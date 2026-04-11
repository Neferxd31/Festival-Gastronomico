from django.db import models
from festivalapp.models import Festival


class Restaurante(models.Model):
    festival = models.ForeignKey(
        Festival,
        on_delete=models.CASCADE,
        related_name="restaurantes"
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField()
    direccion = models.CharField(max_length=255)
    contacto = models.CharField(max_length=100, null=True, blank=True)
    redes_sociales = models.JSONField(null=True, blank=True)
    video_url = models.TextField(null=True, blank=True)
    habilitado = models.BooleanField(default=True)

    votos_total = models.IntegerField(default=0)
    comentarios_total = models.IntegerField(default=0)
    porcentaje_votos = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True
    )
    timestamp = models.DateTimeField(auto_now=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "restaurante"

    def __str__(self):
        return self.nombre


class Plato(models.Model):
    restaurante = models.OneToOneField(
        Restaurante,
        on_delete=models.CASCADE,
        related_name="plato"
    )
    nombre = models.CharField(max_length=150)
    descripcion = models.TextField(null=True, blank=True)
    imagen_url = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "plato"

    def __str__(self):
        return f"{self.nombre} - {self.restaurante.nombre}"