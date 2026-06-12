"""
Ejecuta toda la suite de pruebas unitarias.
Uso: python run_tests.py
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['USE_TEST_DB'] = '1'

import django  # noqa: E402
django.setup()

from django.test.utils import get_runner
from django.conf import settings

TEST_MODULES = [
    'festivalapp.tests.test_festivalapp',
    'restauranteapp.tests.test_restauranteapp',
    'interaccionapp.tests.test_interaccionapp',
    'usuarioapp.tests.test_usuarioapp',
]

if __name__ == '__main__':
    # Inyectar 'test' para que settings detecte modo test y use SQLite
    sys.argv.insert(1, 'test')
    TestRunner = get_runner(settings)
    runner = TestRunner(verbosity=1, interactive=False)
    failures = runner.run_tests(TEST_MODULES)
    sys.exit(bool(failures))
