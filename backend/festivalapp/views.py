from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Festival


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def listar_festivales(request):
    """Lista todos los festivales disponibles."""
    festivales = Festival.objects.all().values('id', 'nombre', 'estado')
    return Response(list(festivales))


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def obtener_festival_activo(request):
    """
    Retorna el festival más reciente con su estado completo.
    Usado por el frontend público y el panel admin para conocer el estado actual.
    """
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
@permission_classes([IsAuthenticated])
def cambiar_estado_festival(request, pk):
    """
    Cambia el estado del festival a ABIERTO o CERRADO.
    Solo accesible por administradores autenticados.
    Escenario 5: Si ocurre un error, no se aplica ningún cambio parcial.
    """
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

    # Solo se guarda si el estado realmente cambia (evita escrituras innecesarias)
    if festival.estado == nuevo_estado:
        return Response({
            'id': festival.id,
            'nombre': festival.nombre,
            'estado': festival.estado,
            'mensaje': 'El festival ya se encontraba en ese estado.',
        })

    festival.estado = nuevo_estado
    festival.save(update_fields=['estado'])  # Escenario 5: atómico, solo guarda este campo

    return Response({
        'id': festival.id,
        'nombre': festival.nombre,
        'estado': festival.estado,
        'mensaje': f'Festival actualizado a {festival.get_estado_display()} correctamente.',
    })