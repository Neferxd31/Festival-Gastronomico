from django.urls import path
from . import views

urlpatterns = [
    # Comentarios
    path('restaurantes/<int:restaurante_id>/comentarios/', views.agregar_comentario, name='agregar-comentario'),
    path('comentarios/<int:comentario_id>/', views.eliminar_comentario, name='eliminar-comentario'),

    # Votos
    path('<int:restaurante_id>/votar/', views.votar_restaurante, name='votar-restaurante'),
    path('<int:restaurante_id>/eliminar-voto/', views.eliminar_voto, name='eliminar-voto'),
    path('<int:restaurante_id>/verificar-voto/', views.verificar_voto, name='verificar-voto'),
]