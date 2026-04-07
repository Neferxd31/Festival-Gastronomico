from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport import requests
import json
import os

# Función para manejar el login de Google
@csrf_exempt
def google_auth_receiver(request):
    if request.method == "POST":
        data = json.loads(request.body)
        token = data.get("token")
        
        try:
            # Validamos el token con Google
            # Usamos el CLIENT_ID que ya tienes en el .env
            client_id = os.getenv("GOOGLE_CLIENT_ID")
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)

            # Si llega aquí, el usuario es real. 
            # idinfo contiene: email, name, picture, etc.
            print(f"Usuario autenticado: {idinfo['email']}")
            
            return JsonResponse({
                "status": "success",
                "user": {
                    "email": idinfo["email"],
                    "name": idinfo["name"],
                    "picture": idinfo["picture"]
                }
            })
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)

    return JsonResponse({"status": "error"}, status=405)

# Rutas del proyecto
urlpatterns = [
    path('admin/', admin.site.create_user if hasattr(admin.site, 'create_user') else admin.site.urls),
    path('api/google-login/', google_auth_receiver), # <--- Este es el puente
]