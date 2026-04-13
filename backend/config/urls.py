from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
import json

# Función para manejar el login de Google
@csrf_exempt
def google_auth_receiver(request):
    if request.method == "POST":
        data = json.loads(request.body)
        token = data.get("token")

        try:
            # Verificamos el access_token consultando el endpoint de Google
            response = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )

            if response.status_code != 200:
                return JsonResponse({"status": "error", "message": "Token inválido"}, status=400)

            idinfo = response.json()
            print(f"Usuario autenticado: {idinfo['email']}")

            return JsonResponse({
                "status": "success",
                "user": {
                    "email": idinfo["email"],
                    "name": idinfo.get("name", ""),
                    "picture": idinfo.get("picture", "")
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