from django.urls import path
from . import views

urlpatterns = [
    path('<int:restaurante_id>/votar/', views.votar_restaurante, name='votar-restaurante'),
    path('<int:restaurante_id>/eliminar-voto/', views.eliminar_voto, name='eliminar-voto'),
    path('<int:restaurante_id>/verificar-voto/', views.verificar_voto, name='verificar-voto'),
]