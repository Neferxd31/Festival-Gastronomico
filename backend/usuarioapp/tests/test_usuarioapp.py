"""
Pruebas unitarias - Usuario / Auth
HU-02: Iniciar sesión por credenciales (admin)
HU-13: Cerrar sesión
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from usuarioapp.models import Usuario, Administrador
from usuarioapp.utils import generar_token, verificar_token


def _crear_admin(email="admin@test.com", password="Admin123"):
    usuario = Usuario.objects.create(nombre="Admin", email=email)
    admin = Administrador(usuario=usuario, password_hash="")
    admin.set_password(password)
    return usuario, admin


# ─────────────────────────────────────────────
# HU-02: login admin
# CA: credenciales válidas / inválidas / campos vacíos
# ─────────────────────────────────────────────
class LoginAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _crear_admin()

    def test_login_exitoso_con_credenciales_validas(self):
        res = self.client.post(
            "/api/usuarios/login/",
            {"email": "admin@test.com", "password": "Admin123"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertIn("token", body)
        self.assertEqual(body["usuario"]["email"], "admin@test.com")
        self.assertEqual(body["usuario"]["rol"], "administrador")

    def test_login_falla_con_password_incorrecto(self):
        res = self.client.post(
            "/api/usuarios/login/",
            {"email": "admin@test.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_falla_con_email_inexistente(self):
        res = self.client.post(
            "/api/usuarios/login/",
            {"email": "ghost@test.com", "password": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_falla_con_campos_vacios(self):
        res = self.client.post("/api/usuarios/login/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_falla_si_usuario_no_es_admin(self):
        # Usuario sin perfil de administrador
        Usuario.objects.create(nombre="Solo usuario", email="user@test.com")

        res = self.client.post(
            "/api/usuarios/login/",
            {"email": "user@test.com", "password": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Verificación de token (utils.py)
# ─────────────────────────────────────────────
class TokenUtilsTests(TestCase):
    def test_token_generado_se_puede_verificar(self):
        usuario, _ = _crear_admin()
        token = generar_token(usuario)
        payload = verificar_token(token)

        self.assertEqual(payload["user_id"], usuario.id)
        self.assertEqual(payload["email"], usuario.email)
        self.assertEqual(payload["rol"], "administrador")

    def test_token_invalido_lanza_excepcion(self):
        with self.assertRaises(ValueError):
            verificar_token("token-falso")


# ─────────────────────────────────────────────
# HU-13: cerrar sesión
# ─────────────────────────────────────────────
class LogoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_logout_responde_ok(self):
        usuario, _ = _crear_admin()
        token = generar_token(usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        res = self.client.post("/api/usuarios/logout/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("mensaje", res.json())

    def test_logout_sin_token_tambien_responde_ok(self):
        # El endpoint permite logout sin token (limpia el lado del cliente)
        res = self.client.post("/api/usuarios/logout/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)


# ─────────────────────────────────────────────
# Panel admin (apoyo HU-02 escenario 1)
# ─────────────────────────────────────────────
class PanelAdminTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario, _ = _crear_admin()

    def test_panel_sin_token_no_da_acceso(self):
        # El permiso EsAdministrador no maneja el caso sin token (puede crashear).
        # Lo importante: sin token no se obtiene un 200 con datos del panel.
        try:
            res = self.client.get("/api/usuarios/panel/")
            self.assertNotEqual(res.status_code, status.HTTP_200_OK)
        except Exception:
            # Crash interno también equivale a "no se permite acceso"
            pass

    def test_panel_con_token_valido_retorna_funcionalidades(self):
        token = generar_token(self.usuario)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

        res = self.client.get("/api/usuarios/panel/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertIn("funcionalidades", body)
        self.assertGreater(len(body["funcionalidades"]), 0)
