from django.db import models
from usuarioapp.models import Votante
from restauranteapp.models import Restaurante


class Voto(models.Model):
    usuario = models.ForeignKey(
        Votante,
        on_delete=models.CASCADE,
        related_name="votos"
    )
    restaurante = models.ForeignKey(
        Restaurante,
        on_delete=models.CASCADE,
        related_name="votos"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "voto"
        constraints = [
            models.UniqueConstraint(
                fields=["usuario", "restaurante"],
                name="unique_voto_usuario_restaurante"
            )
        ]

    def __str__(self):
        return f"{self.usuario} -> {self.restaurante}"


class Comentario(models.Model):
    usuario = models.ForeignKey(
        Votante,
        on_delete=models.CASCADE,
        related_name="comentarios"
    )
    restaurante = models.ForeignKey(
        Restaurante,
        on_delete=models.CASCADE,
        related_name="comentarios"
    )
    contenido = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comentario"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Comentario de {self.usuario} en {self.restaurante}"