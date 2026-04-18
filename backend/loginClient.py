from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport import requests
from django.db import connection, transaction 
import json
import os

GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '847544839508-fv07o4ss37vld92jd034qkta3so8bdde.apps.googleusercontent.com')

@csrf_exempt
def google_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        token = data.get('token')

        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

            email = idinfo.get('email')
            name = idinfo.get('name')
            foto_url = idinfo.get('picture', '')
            google_id = idinfo.get('sub') 

            with transaction.atomic():
                with connection.cursor() as cursor:
                    # --- TABLA USUARIO ---
                    cursor.execute("SELECT id FROM usuario WHERE email = %s", [email])
                    row_usuario = cursor.fetchone()

                    if row_usuario:
                        usuario_id = row_usuario[0]
                        cursor.execute("UPDATE usuario SET nombre = %s WHERE id = %s", [name, usuario_id])
                    else:
                        cursor.execute(
                            "INSERT INTO usuario (nombre, email, created_at) VALUES (%s, %s, NOW()) RETURNING id",
                            [name, email]
                        )
                        usuario_id = cursor.fetchone()[0]

                    # --- TABLA VOTANTE ---
                    # AHORA TAMBIÉN TRAEMOS LA CÉDULA PARA SABER SI YA EXISTE
                    cursor.execute("SELECT id, cedula FROM votante WHERE usuario_id = %s", [usuario_id])
                    row_votante = cursor.fetchone()

                    if row_votante:
                        votante_id = row_votante[0]
                        cedula_actual = row_votante[1] # Extraemos la cédula
                        cursor.execute(
                            "UPDATE votante SET foto_url = %s, google_id = %s WHERE id = %s", 
                            [foto_url, google_id, votante_id]
                        )
                        is_new = False
                    else:
                        cursor.execute(
                            "INSERT INTO votante (google_id, foto_url, usuario_id, created_at) VALUES (%s, %s, %s, NOW()) RETURNING id",
                            [google_id, foto_url, usuario_id]
                        )
                        votante_id = cursor.fetchone()[0]
                        cedula_actual = None # Como es nuevo, no tiene cédula
                        is_new = True

            # Preparamos los datos incluyendo si ya tiene cédula
            user_data = {
                "votante_id": votante_id,
                "usuario_id": usuario_id,
                "email": email,
                "name": name,
                "picture": foto_url,
                "has_cedula": cedula_actual is not None and cedula_actual != "", # Será True o False
                "is_new_user": is_new
            }

            return JsonResponse({"status": "success", "user": user_data})

        except Exception as e:
            print(f"\n❌ ERROR FATAL EN BASE DE DATOS: {e}\n")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse({"status": "error"}, status=405)


# --- NUEVA FUNCIÓN PARA GUARDAR LA CÉDULA ---
@csrf_exempt
def update_cedula(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            votante_id = data.get('votante_id')
            cedula = data.get('cedula')

            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE votante SET cedula = %s WHERE id = %s", 
                    [cedula, votante_id]
                )
            
            return JsonResponse({"status": "success", "message": "Cédula actualizada"})
        except Exception as e:
            print(f"\n❌ ERROR AL GUARDAR CÉDULA: {e}\n")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)
            
    return JsonResponse({"status": "error"}, status=405)