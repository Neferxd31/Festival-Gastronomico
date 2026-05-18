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

    try:
        votante = Votante.objects.get(usuario=usuario)
    except Votante.DoesNotExist:
        return Response(
            {"detail": "Solo los votantes pueden votar."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        restaurante = Restaurante.objects.get(id=restaurante_id, habilitado=True, eliminado=False)
    except Restaurante.DoesNotExist:
        return Response(
            {"detail": "Restaurante no encontrado o no disponible."},
            status=status.HTTP_404_NOT_FOUND
        )

    if Voto.objects.filter(usuario=votante, restaurante=restaurante).exists():
        return Response(
            {"detail": "Ya votaste por este restaurante."},
            status=status.HTTP_400_BAD_REQUEST
        )

    Voto.objects.create(usuario=votante, restaurante=restaurante)

    restaurante.votos_total += 1
    restaurante.save()

    return Response(
        {"mensaje": f"Voto registrado para {restaurante.nombre}."},
        status=status.HTTP_201_CREATED
    )


@api_view(['DELETE'])
@authentication_classes([VotanteJWTAuthentication])
@permission_classes([])
def eliminar_voto(request, restaurante_id):
    usuario = request.user

    try:
        votante = Votante.objects.get(usuario=usuario)
    except Votante.DoesNotExist:
        return Response(
            {"detail": "Solo los votantes pueden realizar esta acción."},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        restaurante = Restaurante.objects.get(id=restaurante_id)
    except Restaurante.DoesNotExist:
        return Response(
            {"detail": "Restaurante no encontrado."},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        voto = Voto.objects.get(usuario=votante, restaurante=restaurante)
    except Voto.DoesNotExist:
        return Response(
            {"detail": "No tienes un voto registrado para este restaurante."},
            status=status.HTTP_404_NOT_FOUND
        )

    voto.delete()

    if restaurante.votos_total > 0:
        restaurante.votos_total -= 1
        restaurante.save()

    return Response(
        {"mensaje": f"Voto eliminado para {restaurante.nombre}."},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@authentication_classes([VotanteJWTAuthentication])
@permission_classes([])
def verificar_voto(request, restaurante_id):
    usuario = request.user

    try:
        votante = Votante.objects.get(usuario=usuario)
    except Votante.DoesNotExist:
        return Response({"votado": False})

    existe = Voto.objects.filter(
        usuario=votante,
        restaurante_id=restaurante_id
    ).exists()

    return Response({"votado": existe})