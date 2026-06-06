from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from usuarioapp.authentication import AdminJWTAuthentication
from .models import Restaurante, Plato
from .serializers import RestauranteSerializer, CrearRestauranteSerializer, EditarRestauranteSerializer
from festivalapp.models import Festival


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def listar_restaurantes(request):
    """Lista todos los restaurantes habilitados (público)."""
    restaurantes = Restaurante.objects.filter(habilitado=True, eliminado=False).select_related('plato')
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
@authentication_classes([])
@permission_classes([AllowAny])
def detalle_restaurante(request, pk):
    """Devuelve la información completa de un restaurante habilitado (público)."""
    try:
        restaurante = Restaurante.objects.select_related('plato').get(pk=pk, habilitado=True, eliminado=False)
    except Restaurante.DoesNotExist:
        return Response({'detail': 'Restaurante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = RestauranteSerializer(restaurante)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def listar_todos_restaurantes(request):
    """Lista todos los restaurantes (habilitados y deshabilitados) para el admin."""
    restaurantes = Restaurante.objects.filter(
        eliminado=False
    ).select_related('plato')
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

    if restaurante.eliminado:
        return Response(
            {"error": "No se puede modificar un participante eliminado."},
            status=status.HTTP_400_BAD_REQUEST
        )

    restaurante.habilitado = not restaurante.habilitado
    restaurante.save()
    return Response({'habilitado': restaurante.habilitado})


@api_view(['DELETE'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def eliminar_restaurante(request, pk):
    try:
        restaurante = Restaurante.objects.get(pk=pk, eliminado=False)

        restaurante.eliminado = True
        restaurante.fecha_eliminacion = timezone.now()
        restaurante.save()

        return Response({
            "mensaje": f'Participante "{restaurante.nombre}" enviado a papelera.'
        }, status=200)

    except Restaurante.DoesNotExist:
        return Response({
            "error": "Participante no encontrado."
        }, status=404)


@api_view(['GET'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def restaurantes_eliminados(request):
    restaurantes = Restaurante.objects.filter(
        eliminado=True
    ).select_related('plato')

    serializer = RestauranteSerializer(restaurantes, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def restaurar_restaurante(request, pk):
    try:
        restaurante = Restaurante.objects.get(
            pk=pk,
            eliminado=True
        )

        restaurante.eliminado = False
        restaurante.fecha_eliminacion = None
        restaurante.save()

        return Response({
            "mensaje": "Participante restaurado"
        })

    except Restaurante.DoesNotExist:
        return Response({
            "error": "No encontrado"
        }, status=404)


@api_view(['PUT'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def editar_restaurante(request, pk):
    """Edita un restaurante existente y su plato estrella (solo admin)."""
    try:
        restaurante = Restaurante.objects.select_related('plato').get(pk=pk, eliminado=False)
    except Restaurante.DoesNotExist:
        return Response({'detail': 'Restaurante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = EditarRestauranteSerializer(data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    with transaction.atomic():
        for campo in ('nombre', 'descripcion', 'direccion', 'contacto', 'video_url'):
            if campo in data:
                setattr(restaurante, campo, data[campo])

        redes = restaurante.redes_sociales or {}
        for red in ('instagram', 'facebook', 'tiktok'):
            if red in data:
                if data[red]:
                    redes[red] = data[red]
                else:
                    redes.pop(red, None)
        restaurante.redes_sociales = redes if redes else None
        restaurante.save()

        campos_plato = {
            'plato_nombre':      'nombre',
            'plato_descripcion': 'descripcion',
            'plato_imagen_url':  'imagen_url',
        }
        plato_data = {v: data[k] for k, v in campos_plato.items() if k in data}
        if plato_data:
            try:
                plato_obj = restaurante.plato
                for attr, val in plato_data.items():
                    setattr(plato_obj, attr, val)
                plato_obj.save()
            except Plato.DoesNotExist:
                Plato.objects.create(restaurante=restaurante, **plato_data)

    return Response(RestauranteSerializer(restaurante).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def estadisticas_votos(request):
    """Retorna estadísticas de votos por restaurante (solo admin)."""
    restaurantes = (
        Restaurante.objects
        .filter(eliminado=False)
        .select_related('plato')
        .annotate(votos_count=Count('votos'))
        .order_by('-votos_count')
    )

    total_votos = sum(r.votos_count for r in restaurantes)

    data = []
    for r in restaurantes:
        porcentaje = round((r.votos_count / total_votos) * 100, 1) if total_votos > 0 else 0
        data.append({
            'id': r.id,
            'nombre': r.nombre,
            'plato_nombre': r.plato.nombre if hasattr(r, 'plato') and r.plato else None,
            'plato_imagen': r.plato.imagen_url if hasattr(r, 'plato') and r.plato else None,
            'votos': r.votos_count,
            'porcentaje': porcentaje,
            'habilitado': r.habilitado,
        })

    return Response({
        'total_votos': total_votos,
        'restaurantes': data,
        'timestamp': timezone.now().isoformat(),
    })


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def resultados_publicos(request):
    """Retorna el ranking público de votos por restaurante."""
    restaurantes = (
        Restaurante.objects
        .filter(eliminado=False, habilitado=True)
        .select_related('plato')
        .annotate(votos_count=Count('votos'))
        .order_by('-votos_count')
    )

    total_votos = sum(r.votos_count for r in restaurantes)

    data = []
    for r in restaurantes:
        porcentaje = round((r.votos_count / total_votos) * 100, 1) if total_votos > 0 else 0
        data.append({
            'id': r.id,
            'nombre': r.nombre,
            'plato_nombre': r.plato.nombre if hasattr(r, 'plato') and r.plato else None,
            'plato_imagen': r.plato.imagen_url if hasattr(r, 'plato') and r.plato else None,
            'votos': r.votos_count,
            'porcentaje': porcentaje,
        })

    return Response({
        'total_votos': total_votos,
        'restaurantes': data,
    })