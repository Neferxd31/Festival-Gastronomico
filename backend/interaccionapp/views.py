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