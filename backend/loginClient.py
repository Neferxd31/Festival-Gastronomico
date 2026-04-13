from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport import requests
import json

# Reemplaza con tu Client ID de Google
GOOGLE_CLIENT_ID = "847544839508-fv07o4ss37vld92jd034qkta3so8bdde.apps.googleusercontent.com"

@csrf_exempt
def google_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        token = data.get('token')

        try:
            # Validar el token con Google
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

            # Si el token es válido, idinfo tiene los datos del usuario
            # Aquí podrías buscar al usuario en tu DB o crearlo
            user_data = {
                "email": idinfo['email'],
                "name": idinfo['name'],
                "picture": idinfo['picture']
            }

            return JsonResponse({"status": "success", "user": user_data})

        except ValueError:
            return JsonResponse({"status": "error", "message": "Token inválido"}, status=400)

    return JsonResponse({"status": "error"}, status=405)