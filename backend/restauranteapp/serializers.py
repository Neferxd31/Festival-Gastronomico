from rest_framework import serializers
from .models import Restaurante, Plato


class PlatoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plato
        fields = ['id', 'nombre', 'descripcion', 'imagen_url']


class RestauranteSerializer(serializers.ModelSerializer):
    plato = PlatoSerializer(read_only=True)

    class Meta:
        model = Restaurante
        fields = [
            'id', 'festival', 'nombre', 'descripcion', 'direccion',
            'contacto', 'redes_sociales', 'video_url', 'habilitado',
            'created_at', 'plato'
        ]
        read_only_fields = ['id', 'created_at']


class CrearRestauranteSerializer(serializers.Serializer):
    # Campos del restaurante
    festival_id   = serializers.IntegerField()
    nombre        = serializers.CharField(max_length=150)
    descripcion   = serializers.CharField()
    direccion     = serializers.CharField(max_length=255)
    contacto      = serializers.CharField(max_length=100, required=False, allow_blank=True)
    video_url     = serializers.URLField(required=False, allow_blank=True)
    instagram     = serializers.CharField(required=False, allow_blank=True)
    facebook      = serializers.CharField(required=False, allow_blank=True)
    tiktok        = serializers.CharField(required=False, allow_blank=True)

    # Campos del plato
    plato_nombre      = serializers.CharField(max_length=150)
    plato_descripcion = serializers.CharField(required=False, allow_blank=True)
    plato_imagen_url  = serializers.URLField(required=False, allow_blank=True)
