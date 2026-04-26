from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from usuarioapp.authentication import AdminJWTAuthentication
from .models import Restaurante, Plato
from .serializers import RestauranteSerializer, CrearRestauranteSerializer
from festivalapp.models import Festival


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def listar_restaurantes(request):
    """Lista todos los restaurantes habilitados (público)."""
    restaurantes = Restaurante.objects.filter(habilitado=True).select_related('plato')
    serializer = RestauranteSerializer(restaurantes, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def crear_restaurante(request):
    """Crea un restaurante junto con su plato estrella (solo admin)."""
    serializer = CrearRestauranteSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    # Verificar que el festival existe
    try:
        festival = Festival.objects.get(id=data['festival_id'])
    except Festival.DoesNotExist:
        return Response(
            {'festival_id': 'El festival indicado no existe.'},
            status=status.HTTP_404_NOT_FOUND
        )

    redes = {
        'instagram': data.get('instagram', ''),
        'facebook':  data.get('facebook', ''),
        'tiktok':    data.get('tiktok', ''),
    }
    # Elimina claves vacías para no guardar ruido
    redes = {k: v for k, v in redes.items() if v}

    with transaction.atomic():
        restaurante = Restaurante.objects.create(
            festival=festival,
            nombre=data['nombre'],
            descripcion=data['descripcion'],
            direccion=data['direccion'],
            contacto=data.get('contacto', ''),
            redes_sociales=redes if redes else None,
            video_url=data.get('video_url', '') or None,
        )

        Plato.objects.create(
            restaurante=restaurante,
            nombre=data['plato_nombre'],
            descripcion=data.get('plato_descripcion', '') or None,
            imagen_url=data.get('plato_imagen_url', '') or None,
        )

    resultado = RestauranteSerializer(restaurante)
    return Response(resultado.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def listar_todos_restaurantes(request):
    """Lista todos los restaurantes (habilitados y deshabilitados) para el admin."""
    restaurantes = Restaurante.objects.all().select_related('plato')
    serializer = RestauranteSerializer(restaurantes, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def toggle_restaurante(request, pk):
    """Habilita o deshabilita un restaurante."""
    try:
        restaurante = Restaurante.objects.get(pk=pk)
    except Restaurante.DoesNotExist:
        return Response({'detail': 'Restaurante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    restaurante.habilitado = not restaurante.habilitado
    restaurante.save()
    return Response({'habilitado': restaurante.habilitado})
