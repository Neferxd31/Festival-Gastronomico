"""
Pruebas unitarias - Restaurantes / Participantes
HU-01: Ver página restaurante
HU-03: Crear restaurante
HU-04: Editar participante
HU-05: Eliminar participante (soft delete)
HU-17: Habilitar / deshabilitar
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from festivalapp.models import Festival
from restauranteapp.models import Restaurante, Plato
from usuarioapp.models import Usuario, Administrador
from usuarioapp.utils import generar_token


def _crear_admin():
    usuario = Usuario.objects.create(nombre="Admin", email="admin@test.com")
    admin = Administrador(usuario=usuario, password_hash="")
    admin.set_password("Admin123")
    return usuario, generar_token(usuario)


def _crear_restaurante(festival, nombre="Sabor Local", habilitado=True, eliminado=False):
    r = Restaurante.objects.create(
        festival=festival,
        nombre=nombre,
        descripcion="Comida típica",
        direccion="Calle 1",
        habilitado=habilitado,
        eliminado=eliminado,
    )
    Plato.objects.create(restaurante=r, nombre="Plato Test")
    return r


# ─────────────────────────────────────────────
# HU-01: ver página restaurante (público)
# ─────────────────────────────────────────────
class ListarRestaurantesPublicoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")

    def test_lista_solo_habilitados_y_no_eliminados(self):
        _crear_restaurante(self.festival, "Visible")
        _crear_restaurante(self.festival, "Deshabilitado", habilitado=False)
        _crear_restaurante(self.festival, "Eliminado", eliminado=True)

        res = self.client.get("/api/restaurantes/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        nombres = [r["nombre"] for r in res.json()]
        self.assertEqual(nombres, ["Visible"])

    def test_endpoint_publico_sin_autenticacion(self):
        res = self.client.get("/api/restaurantes/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class DetalleRestauranteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)

    def test_detalle_retorna_informacion_completa(self):
        res = self.client.get(f"/api/restaurantes/{self.restaurante.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data["nombre"], self.restaurante.nombre)
        self.assertIn("plato", data)
        self.assertIn("comentarios", data)

    def test_detalle_404_si_no_existe(self):
        res = self.client.get("/api/restaurantes/9999/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_detalle_404_si_eliminado(self):
        self.restaurante.eliminado = True
        self.restaurante.save()
        res = self.client.get(f"/api/restaurantes/{self.restaurante.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────
# HU-03: crear restaurante (solo admin)
# ─────────────────────────────────────────────
class CrearRestauranteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, self.token = _crear_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")

    def _payload(self, **overrides):
        base = {
            "festival_id": self.festival.id,
            "nombre": "Nuevo Resto",
            "descripcion": "Descripción",
            "direccion": "Calle 5",
            "plato_nombre": "Plato Estrella",
        }
        base.update(overrides)
        return base

    def test_crea_restaurante_con_plato(self):
        res = self.client.post("/api/restaurantes/crear/", self._payload(), format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Restaurante.objects.count(), 1)
        self.assertEqual(Plato.objects.count(), 1)

    def test_campos_obligatorios_faltantes_devuelve_400(self):
        res = self.client.post("/api/restaurantes/crear/", {"nombre": "Solo"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_festival_inexistente_devuelve_404(self):
        res = self.client.post("/api/restaurantes/crear/", self._payload(festival_id=999), format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_redes_sociales_se_guardan(self):
        res = self.client.post(
            "/api/restaurantes/crear/",
            self._payload(instagram="@rest", facebook="restoFB"),
            format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        r = Restaurante.objects.first()
        self.assertEqual(r.redes_sociales.get("instagram"), "@rest")
        self.assertEqual(r.redes_sociales.get("facebook"), "restoFB")
        self.assertNotIn("tiktok", r.redes_sociales)

    def test_sin_token_no_permite_crear(self):
        self.client.credentials()
        res = self.client.post("/api/restaurantes/crear/", self._payload(), format="json")
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))


# ─────────────────────────────────────────────
# HU-04: editar participante
# ─────────────────────────────────────────────
class EditarRestauranteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, self.token = _crear_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)

    def test_edita_campos_basicos(self):
        res = self.client.put(
            f"/api/restaurantes/{self.restaurante.id}/editar/",
            {"nombre": "Nombre Nuevo", "descripcion": "Desc nueva"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.restaurante.refresh_from_db()
        self.assertEqual(self.restaurante.nombre, "Nombre Nuevo")

    def test_no_edita_si_eliminado(self):
        self.restaurante.eliminado = True
        self.restaurante.save()
        res = self.client.put(
            f"/api/restaurantes/{self.restaurante.id}/editar/",
            {"nombre": "X"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────
# HU-05: eliminar (soft delete) y restaurar
# ─────────────────────────────────────────────
class EliminarRestauranteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, self.token = _crear_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)

    def test_eliminar_es_soft_delete(self):
        res = self.client.delete(f"/api/restaurantes/{self.restaurante.id}/eliminar/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.restaurante.refresh_from_db()
        self.assertTrue(self.restaurante.eliminado)
        self.assertIsNotNone(self.restaurante.fecha_eliminacion)

    def test_eliminar_dos_veces_devuelve_404(self):
        self.client.delete(f"/api/restaurantes/{self.restaurante.id}/eliminar/")
        res = self.client.delete(f"/api/restaurantes/{self.restaurante.id}/eliminar/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_papelera_lista_eliminados(self):
        self.client.delete(f"/api/restaurantes/{self.restaurante.id}/eliminar/")
        res = self.client.get("/api/restaurantes/eliminados/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.json()), 1)

    def test_restaurar_quita_marca_eliminado(self):
        self.client.delete(f"/api/restaurantes/{self.restaurante.id}/eliminar/")
        res = self.client.patch(f"/api/restaurantes/{self.restaurante.id}/restaurar/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.restaurante.refresh_from_db()
        self.assertFalse(self.restaurante.eliminado)
        self.assertIsNone(self.restaurante.fecha_eliminacion)


# ─────────────────────────────────────────────
# HU-17: habilitar / deshabilitar
# ─────────────────────────────────────────────
class ToggleRestauranteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        _, self.token = _crear_admin()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)

    def test_toggle_invierte_estado_habilitado(self):
        res = self.client.patch(f"/api/restaurantes/{self.restaurante.id}/toggle/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.restaurante.refresh_from_db()
        self.assertFalse(self.restaurante.habilitado)

        # Segundo toggle vuelve a habilitar
        self.client.patch(f"/api/restaurantes/{self.restaurante.id}/toggle/")
        self.restaurante.refresh_from_db()
        self.assertTrue(self.restaurante.habilitado)

    def test_no_se_puede_toggle_eliminado(self):
        self.restaurante.eliminado = True
        self.restaurante.save()
        res = self.client.patch(f"/api/restaurantes/{self.restaurante.id}/toggle/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_toggle_404_si_no_existe(self):
        res = self.client.patch("/api/restaurantes/9999/toggle/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
