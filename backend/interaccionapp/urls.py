from django.urls import path
from . import views

urlpatterns = [
    path('<int:restaurante_id>/votar/', views.votar_restaurante, name='votar-restaurante'),
]