"""
Pruebas unitarias - Festival
HU-11: Publicar resultados
HU-12: Establecer estado del festival
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from festivalapp.models import Festival
from usuarioapp.models import Usuario, Administrador
from usuarioapp.utils import generar_token


def _crear_admin(email="admin@test.com", password="Admin123"):
    """Crea un administrador y retorna (usuario, token)."""
    usuario = Usuario.objects.create(nombre="Admin Test", email=email)
    admin = Administrador(usuario=usuario, password_hash="")
    admin.set_password(password)
    token = generar_token(usuario)
    return usuario, token


class FestivalActivoTests(TestCase):
    """GET /api/festivales/activo/ — público."""

    def setUp(self):
        self.client = APIClient()

    def test_festival_activo_retorna_404_si_no_existe(self):
        res = self.client.get("/api/festivales/activo/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_festival_activo_retorna_el_mas_reciente(self):
        Festival.objects.create(nombre="Viejo", estado="CERRADO")
        nuevo = Festival.objects.create(nombre="Nuevo", estado="ABIERTO")

        res = self.client.get("/api/festivales/activo/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["id"], nuevo.id)
        self.assertEqual(res.json()["estado"], "ABIERTO")
        self.assertFalse(res.json()["resultados_publicados"])


class CambiarEstadoFestivalTests(TestCase):
    """
    HU-12 — PATCH /api/festivales/<id>/estado/
    Escenarios: abrir/cerrar, estado inválido, ya en ese estado,
    reset de resultados al reabrir.
    """

    def setUp(self):
        self.client = APIClient()
        _, self.token = _crear_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.festival = Festival.objects.create(nombre="FG 2026", estado="CERRADO")

    def _url(self, fid=None):
        return f"/api/festivales/{fid or self.festival.id}/estado/"

    def test_cambia_de_cerrado_a_abierto(self):
        res = self.client.patch(self._url(), {"estado": "ABIERTO"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.festival.refresh_from_db()
        self.assertEqual(self.festival.estado, "ABIERTO")

    def test_cambia_de_abierto_a_cerrado(self):
        self.festival.estado = "ABIERTO"
        self.festival.save()

        res = self.client.patch(self._url(), {"estado": "CERRADO"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.festival.refresh_from_db()
        self.assertEqual(self.festival.estado, "CERRADO")

    def test_estado_invalido_retorna_400(self):
        res = self.client.patch(self._url(), {"estado": "PAUSADO"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mismo_estado_no_es_error_pero_informa(self):
        res = self.client.patch(self._url(), {"estado": "CERRADO"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("ya se encontraba", res.json()["mensaje"])

    def test_festival_inexistente_retorna_404(self):
        res = self.client.patch(self._url(fid=999), {"estado": "ABIERTO"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_abrir_resetea_resultados_publicados(self):
        self.festival.resultados_publicados = True
        self.festival.save()

        self.client.patch(self._url(), {"estado": "ABIERTO"}, format="json")

        self.festival.refresh_from_db()
        self.assertFalse(self.festival.resultados_publicados)

    def test_sin_token_retorna_401(self):
        self.client.credentials()
        res = self.client.patch(self._url(), {"estado": "ABIERTO"}, format="json")
        # DRF retorna 403 cuando no hay credenciales y IsAuthenticated falla
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))


class PublicarResultadosTests(TestCase):
    """
    HU-11 — PATCH /api/festivales/<id>/publicar-resultados/
    CA: solo cuando el festival esté CERRADO; idempotente.
    """

    def setUp(self):
        self.client = APIClient()
        _, self.token = _crear_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.festival = Festival.objects.create(nombre="FG 2026", estado="CERRADO")

    def _url(self, fid=None):
        return f"/api/festivales/{fid or self.festival.id}/publicar-resultados/"

    def test_publica_resultados_con_festival_cerrado(self):
        res = self.client.patch(self._url())

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.festival.refresh_from_db()
        self.assertTrue(self.festival.resultados_publicados)

    def test_no_publica_si_festival_abierto(self):
        self.festival.estado = "ABIERTO"
        self.festival.save()

        res = self.client.patch(self._url())

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.festival.refresh_from_db()
        self.assertFalse(self.festival.resultados_publicados)

    def test_publicar_dos_veces_es_idempotente(self):
        self.client.patch(self._url())
        res = self.client.patch(self._url())

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.json()["resultados_publicados"])

    def test_festival_inexistente_retorna_404(self):
        res = self.client.patch(self._url(fid=999))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_sin_token_retorna_401(self):
        self.client.credentials()
        res = self.client.patch(self._url())
        # DRF retorna 403 cuando no hay credenciales y IsAuthenticated falla
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
