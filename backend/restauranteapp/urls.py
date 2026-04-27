from django.urls import path
from . import views

urlpatterns = [
    path('',                    views.listar_restaurantes,       name='restaurantes-publico'),
    path('admin/',              views.listar_todos_restaurantes, name='restaurantes-admin'),
    path('crear/',              views.crear_restaurante,         name='restaurantes-crear'),
    path('<int:pk>/',           views.detalle_restaurante,       name='restaurantes-detalle'),
    path('<int:pk>/toggle/',    views.toggle_restaurante,        name='restaurantes-toggle'),
    path('<int:pk>/eliminar/', views.eliminar_restaurante, name='restaurantes-eliminar'),

]
