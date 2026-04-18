from django.contrib import admin
from django.urls import path, include
from loginClient import google_login, update_cedula

urlpatterns = [
    path("admin/",              admin.site.urls),
    path("api/google-login/",   google_login),
    path("api/update-cedula/",  update_cedula),
    path("api/usuarios/",       include("usuarioapp.urls")),
]
