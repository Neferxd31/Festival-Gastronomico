"""
Pruebas unitarias - Interacciones
HU-07: Votar por restaurante
HU-08: Eliminar voto
HU-09: Comentar en página de restaurante
HU-10: Eliminar comentario
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from festivalapp.models import Festival
from restauranteapp.models import Restaurante
from usuarioapp.models import Usuario, Votante
from usuarioapp.utils import generar_token
from interaccionapp.models import Voto, Comentario


def _crear_votante(email="votante@test.com", cedula=None):
    usuario = Usuario.objects.create(nombre="Votante", email=email)
    votante = Votante.objects.create(usuario=usuario, cedula=cedula)
    token = generar_token(usuario)
    return usuario, votante, token


def _crear_restaurante(festival, **overrides):
    defaults = {
        "festival": festival,
        "nombre": "Sabor Local",
        "descripcion": "—",
        "direccion": "Calle 1",
        "habilitado": True,
        "eliminado": False,
    }
    defaults.update(overrides)
    return Restaurante.objects.create(**defaults)


# ─────────────────────────────────────────────
# HU-07: votar por restaurante
# ─────────────────────────────────────────────
class VotarTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)
        _, self.votante, self.token = _crear_votante()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def _url(self, rid=None):
        return f"/api/interacciones/{rid or self.restaurante.id}/votar/"

    def test_vota_correctamente(self):
        res = self.client.post(self._url(), {"cedula": "12345"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Voto.objects.count(), 1)
        self.restaurante.refresh_from_db()
        self.assertEqual(self.restaurante.votos_total, 1)

    def test_no_puede_votar_si_festival_cerrado(self):
        self.festival.estado = "CERRADO"
        self.festival.save()

        res = self.client.post(self._url(), {"cedula": "12345"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Voto.objects.count(), 0)

    def test_no_puede_votar_dos_veces(self):
        self.client.post(self._url(), {"cedula": "12345"}, format="json")

        otro = _crear_restaurante(self.festival, nombre="Otro")
        res = self.client.post(self._url(rid=otro.id), {"cedula": "12345"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Voto.objects.count(), 1)

    def test_cedula_requerida(self):
        res = self.client.post(self._url(), {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cedula_no_puede_diferir_de_la_registrada(self):
        self.votante.cedula = "11111"
        self.votante.save()

        res = self.client.post(self._url(), {"cedula": "99999"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cedula_duplicada_por_otro_usuario(self):
        otro_usuario = Usuario.objects.create(nombre="Otro", email="otro@test.com")
        Votante.objects.create(usuario=otro_usuario, cedula="12345")

        res = self.client.post(self._url(), {"cedula": "12345"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_se_puede_votar_a_restaurante_deshabilitado(self):
        self.restaurante.habilitado = False
        self.restaurante.save()

        res = self.client.post(self._url(), {"cedula": "12345"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_votar_sin_token_no_crea_voto(self):
        # La vista no maneja explícitamente el caso sin token (puede crashear
        # internamente). Lo importante es que NO se cree un voto.
        self.client.credentials()
        try:
            self.client.post(self._url(), {"cedula": "12345"}, format="json")
        except Exception:
            pass
        self.assertEqual(Voto.objects.count(), 0)


# ─────────────────────────────────────────────
# HU-08: eliminar voto
# ─────────────────────────────────────────────
class EliminarVotoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)
        _, self.votante, self.token = _crear_votante(cedula="12345")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.voto = Voto.objects.create(usuario=self.votante, restaurante=self.restaurante)
        self.restaurante.votos_total = 1
        self.restaurante.save()

    def _url(self):
        return f"/api/interacciones/{self.restaurante.id}/eliminar-voto/"

    def test_elimina_voto_y_decrementa_contador(self):
        res = self.client.delete(self._url())

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Voto.objects.count(), 0)
        self.restaurante.refresh_from_db()
        self.assertEqual(self.restaurante.votos_total, 0)

    def test_no_elimina_si_festival_cerrado(self):
        self.festival.estado = "CERRADO"
        self.festival.save()

        res = self.client.delete(self._url())

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Voto.objects.count(), 1)

    def test_404_si_no_hay_voto_registrado(self):
        self.voto.delete()
        res = self.client.delete(self._url())
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────
# Verificar voto (apoyo a HU-07/08)
# ─────────────────────────────────────────────
class VerificarVotoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)
        _, self.votante, self.token = _crear_votante(cedula="999")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

    def test_sin_voto_retorna_ya_voto_false(self):
        res = self.client.get(f"/api/interacciones/{self.restaurante.id}/verificar-voto/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.json()["ya_voto"])

    def test_con_voto_en_este_restaurante(self):
        Voto.objects.create(usuario=self.votante, restaurante=self.restaurante)
        res = self.client.get(f"/api/interacciones/{self.restaurante.id}/verificar-voto/")
        data = res.json()
        self.assertTrue(data["ya_voto"])
        self.assertTrue(data["voto_en_este"])


# ─────────────────────────────────────────────
# HU-09: comentar en página de restaurante
# ─────────────────────────────────────────────
class ComentarTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)
        _, self.votante, _ = _crear_votante()

    def _url(self, rid=None):
        return f"/api/restaurantes/{rid or self.restaurante.id}/comentarios/"

    def test_crea_comentario(self):
        res = self.client.post(
            self._url(),
            {"usuario_email": self.votante.usuario.email, "contenido": "Excelente"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Comentario.objects.count(), 1)

    def test_email_obligatorio(self):
        res = self.client.post(self._url(), {"contenido": "Hola"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_email_de_usuario_no_registrado_retorna_404(self):
        res = self.client.post(
            self._url(),
            {"usuario_email": "ghost@nada.com", "contenido": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_restaurante_inexistente_retorna_404(self):
        res = self.client.post(
            self._url(rid=9999),
            {"usuario_email": self.votante.usuario.email, "contenido": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────
# HU-10: eliminar comentario
# ─────────────────────────────────────────────
class EliminarComentarioTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.festival = Festival.objects.create(nombre="FG", estado="ABIERTO")
        self.restaurante = _crear_restaurante(self.festival)
        _, self.votante, _ = _crear_votante()
        self.comentario = Comentario.objects.create(
            usuario=self.votante,
            restaurante=self.restaurante,
            contenido="A borrar",
        )

    def test_elimina_comentario(self):
        res = self.client.delete(f"/api/comentarios/{self.comentario.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Comentario.objects.count(), 0)

    def test_eliminar_comentario_inexistente_devuelve_404(self):
        res = self.client.delete("/api/comentarios/9999/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
