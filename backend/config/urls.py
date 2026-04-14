from django.contrib import admin
from django.urls import path
from loginClient import google_login, update_cedula  # <-- Importamos la nueva función

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/google-login/', google_login, name='google_login'),
    path('api/update-cedula/', update_cedula, name='update_cedula'), # <-- Nueva ruta
]