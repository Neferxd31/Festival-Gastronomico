from django.urls import path
from . import views

urlpatterns = [
    path('', views.listar_festivales, name='festivales-listar'),
    path('activo/', views.obtener_festival_activo, name='festival-activo'),
    path('<int:pk>/estado/', views.cambiar_estado_festival, name='festival-estado'),
    path('<int:pk>/publicar-resultados/', views.publicar_resultados, name='festival-publicar-resultados'),
]