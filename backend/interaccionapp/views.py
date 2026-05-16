from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status

from usuarioapp.authentication import AdminJWTAuthentication
from usuarioapp.models import Votante
from restauranteapp.models import Restaurante
from .models import Voto
from usuarioapp.authentication import VotanteJWTAuthentication


@api_view(['POST'])
@authentication_classes([VotanteJWTAuthentication])
@permission_classes([])
def votar_restaurante(request, restaurante_id):
    usuario = request.user

    # Verificar que el usuario autenticado es un Votante
    try:
        votante = Votante.objects.get(usuario=usuario)
    except Votante.DoesNotExist:
        return Response(
            {"detail": "Solo los votantes pueden votar."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Verificar que el restaurante existe y está habilitado
    try:
        restaurante = Restaurante.objects.get(id=restaurante_id, habilitado=True, eliminado=False)
    except Restaurante.DoesNotExist:
        return Response(
            {"detail": "Restaurante no encontrado o no disponible."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Verificar que no haya votado ya por este restaurante
    if Voto.objects.filter(usuario=votante, restaurante=restaurante).exists():
        return Response(
            {"detail": "Ya votaste por este restaurante."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Registrar el voto
    Voto.objects.create(usuario=votante, restaurante=restaurante)

    # Actualizar el contador en el restaurante
    restaurante.votos_total += 1
    restaurante.save()

    return Response(
        {"mensaje": f"Voto registrado para {restaurante.nombre}."},
        status=status.HTTP_201_CREATED
    )