from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from usuarioapp.authentication import AdminJWTAuthentication
from .models import Festival


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def listar_festivales(request):
    festivales = Festival.objects.all().values('id', 'nombre', 'estado')
    return Response(list(festivales))


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def obtener_festival_activo(request):
    try:
        festival = Festival.objects.latest('created_at')
        return Response({
            'id': festival.id,
            'nombre': festival.nombre,
            'estado': festival.estado,
            'fecha_inicio': festival.fecha_inicio,
            'fecha_fin': festival.fecha_fin,
            'resultados_publicados': festival.resultados_publicados,
        })
    except Festival.DoesNotExist:
        return Response(
            {'error': 'No hay festival configurado.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PATCH'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def cambiar_estado_festival(request, pk):
    try:
        festival = Festival.objects.get(pk=pk)
    except Festival.DoesNotExist:
        return Response(
            {'error': 'Festival no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )

    nuevo_estado = request.data.get('estado')
    estados_validos = [choice[0] for choice in Festival.EstadoChoices.choices]
    if nuevo_estado not in estados_validos:
        return Response(
            {'error': f'Estado inválido. Use uno de: {estados_validos}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if festival.estado == nuevo_estado:
        return Response({
            'id': festival.id,
            'nombre': festival.nombre,
            'estado': festival.estado,
            'mensaje': 'El festival ya se encontraba en ese estado.',
        })

    festival.estado = nuevo_estado

    # Si se abre el festival, se resetean los resultados publicados
    if nuevo_estado == 'ABIERTO':
        festival.resultados_publicados = False
        festival.save(update_fields=['estado', 'resultados_publicados'])
    else:
        festival.save(update_fields=['estado'])

    return Response({
        'id': festival.id,
        'nombre': festival.nombre,
        'estado': festival.estado,
        'resultados_publicados': festival.resultados_publicados,
        'mensaje': f'Festival actualizado a {festival.get_estado_display()} correctamente.',
    })


@api_view(['PATCH'])
@authentication_classes([AdminJWTAuthentication])
@permission_classes([IsAuthenticated])
def publicar_resultados(request, pk):
    try:
        festival = Festival.objects.get(pk=pk)
    except Festival.DoesNotExist:
        return Response(
            {'error': 'Festival no encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if festival.estado == 'ABIERTO':
        return Response(
            {'error': 'No se pueden publicar los resultados mientras el festival está abierto. Cierra el festival primero.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if festival.resultados_publicados:
        return Response(
            {'mensaje': 'Los resultados ya estaban publicados.', 'resultados_publicados': True}
        )

    festival.resultados_publicados = True
    festival.save(update_fields=['resultados_publicados'])

    return Response({
        'mensaje': '✅ Resultados publicados exitosamente. El podio ya es visible para todos los usuarios.',
        'resultados_publicados': True,
    })