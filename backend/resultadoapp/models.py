from django.db import models
from festivalapp.models import Festival
from restauranteapp.models import Restaurante


class Resultado(models.Model):
    festival = models.ForeignKey(
        Festival,
        on_delete=models.CASCADE,
        related_name="resultados"
    )
    restaurante = models.ForeignKey(
        Restaurante,
        on_delete=models.CASCADE,
        related_name="resultados"
    )
    posicion = models.PositiveSmallIntegerField()
    votos_totales = models.IntegerField(default=0)
    fecha_publicacion = models.DateTimeField()

    class Meta:
        db_table = "resultado"
        constraints = [
            models.UniqueConstraint(
                fields=["festival", "posicion"],
                name="unique_resultado_festival_posicion"
            ),
            models.UniqueConstraint(
                fields=["festival", "restaurante"],
                name="unique_resultado_festival_restaurante"
            )
        ]

    def __str__(self):
        return f"{self.festival} - {self.posicion} - {self.restaurante}"