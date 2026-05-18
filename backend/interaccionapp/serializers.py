from rest_framework import serializers
from .models import Comentario

class ComentarioSerializer(serializers.ModelSerializer):
    # Usamos un SerializerMethodField para controlar dinámicamente el nombre
    usuario_nombre = serializers.SerializerMethodField()
    usuario_foto = serializers.URLField(source='usuario.foto_url', read_only=True)
    usuario_email = serializers.EmailField(source='usuario.usuario.email', read_only=True)

    class Meta:
        model = Comentario
        fields = ['id', 'restaurante', 'usuario', 'usuario_nombre', 'usuario_foto', 'usuario_email', 'contenido', 'created_at']
        read_only_fields = ['id', 'restaurante', 'usuario', 'created_at']

    # Esta función buscará el nombre del usuario de manera inteligente y segura
    def get_usuario_nombre(self, obj):
        user_django = obj.usuario.usuario # Accedemos al usuario de Django a través de Votante
        
        # Verificamos dinámicamente qué campo de nombre existe en tu modelo personalizado
        if hasattr(user_django, 'nombre') and user_django.nombre:
            return user_django.nombre
        elif hasattr(user_django, 'first_name') and user_django.first_name:
            return user_django.first_name
        elif hasattr(user_django, 'username') and user_django.username:
            return user_django.username
            
        # Si no tiene ninguno de los anteriores, usamos la primera parte de su email
        if hasattr(user_django, 'email') and user_django.email:
            return user_django.email.split('@')[0]
            
        return 'Usuario'