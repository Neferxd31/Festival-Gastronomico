from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
import json


@csrf_exempt
def google_auth_receiver(request):
    if request.method == "POST":
        data = json.loads(request.body)
        token = data.get("token")
        try:
            response = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            if response.status_code != 200:
                return JsonResponse(
                    {"status": "error", "message": "Token inválido"}, status=400
                )
            idinfo = response.json()
            return JsonResponse({
                "status": "success",
                "user": {
                    "email": idinfo["email"],
                    "name": idinfo.get("name", ""),
                    "picture": idinfo.get("picture", ""),
                }
            })
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
    return JsonResponse({"status": "error"}, status=405)


urlpatterns = [
    path("admin/",              admin.site.urls),
    path("api/google-login/",   google_auth_receiver),
    path("api/usuarios/",       include("usuarioapp.urls")),  # ← nuevo
]