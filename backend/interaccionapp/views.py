from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from restauranteapp.models import Restaurante
from usuarioapp.models import Votante
from .models import Comentario
from .serializers import ComentarioSerializer

@api_view(['POST'])
@permission_classes([AllowAny]) 
def agregar_comentario(request, restaurante_id):
    restaurante = get_object_or_404(Restaurante, pk=restaurante_id)
    
    email_usuario = request.data.get('usuario_email')
    if not email_usuario:
        return Response({"error": "El email del usuario es requerido"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Buscamos al Votante usando el email del Usuario relacionado (usando doble guion bajo)
        votante = Votante.objects.get(usuario__email=email_usuario)
    except Votante.DoesNotExist:
        return Response(
            {"error": "Usuario no registrado. Por favor, inicia sesión de nuevo."}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ComentarioSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(restaurante=restaurante, usuario=votante)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    
    print("🚨 ERRORES DEL SERIALIZADOR:", serializer.errors)    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# 👇 Y también en la función de eliminar
@api_view(['DELETE'])
@permission_classes([AllowAny]) 
def eliminar_comentario(request, comentario_id):
    comentario = get_object_or_404(Comentario, pk=comentario_id)
    comentario.delete()
    return Response({"mensaje": "Comentario eliminado"}, status=status.HTTP_204_NO_CONTENT)
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

    cedula = request.data.get('cedula', '').strip()
    if not cedula:
        return Response(
            {"detail": "La cédula es requerida para votar."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if votante.cedula and votante.cedula != cedula:
        return Response(
            {"detail": "La cédula no coincide con la registrada."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Después
    if not votante.cedula:
        if Votante.objects.filter(cedula=cedula).exists():
            return Response(
                {"detail": "Esta cédula ya está registrada por otro usuario."},
                status=status.HTTP_400_BAD_REQUEST
            )
        votante.cedula = cedula
        votante.save()

    try:
        restaurante = Restaurante.objects.get(id=restaurante_id, habilitado=True, eliminado=False)
    except Restaurante.DoesNotExist:
        return Response(
            {"detail": "Restaurante no encontrado o no disponible."},
            status=status.HTTP_404_NOT_FOUND
        )

    if Voto.objects.filter(usuario=votante).exists():
        return Response(
            {"detail": "Ya usaste tu voto. Solo se permite votar por un restaurante."},
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
        return Response({"ya_voto": False})

    voto = Voto.objects.filter(usuario=votante).first()

    if not voto:
        return Response({"ya_voto": False, "cedula": votante.cedula or None, "has_cedula": bool(votante.cedula)})

    return Response({
        "ya_voto": True,
        "voto_en_este": voto.restaurante_id == restaurante_id,
        "cedula": votante.cedula or None,
        "has_cedula": bool(votante.cedula)
    })