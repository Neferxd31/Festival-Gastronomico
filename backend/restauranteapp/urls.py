from django.urls import path
from . import views

urlpatterns = [
    path('',           views.listar_restaurantes,       name='restaurantes-publico'),
    path('admin/',     views.listar_todos_restaurantes, name='restaurantes-admin'),
    path('crear/',     views.crear_restaurante,         name='restaurantes-crear'),
    path('<int:pk>/toggle/', views.toggle_restaurante,  name='restaurantes-toggle'),
]
