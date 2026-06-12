import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# 1. Cargar variables de entorno del archivo .env
load_dotenv()

# Directorio base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# 2. SEGURIDAD Y ENTORNO
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-clave-temporal')
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# ALLOWED_HOSTS — incluye automáticamente el dominio que Railway inyecta
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')
RAILWAY_PUBLIC_DOMAIN = os.getenv('RAILWAY_PUBLIC_DOMAIN')
if RAILWAY_PUBLIC_DOMAIN:
    ALLOWED_HOSTS.append(RAILWAY_PUBLIC_DOMAIN)
# Permitir cualquier subdominio *.up.railway.app por comodidad
ALLOWED_HOSTS.append('.up.railway.app')

# CSRF para Railway (necesario si el admin se usa en producción)
CSRF_TRUSTED_ORIGINS = [
    'https://*.up.railway.app',
]
extra_csrf = os.getenv('CSRF_TRUSTED_ORIGINS', '')
if extra_csrf:
    CSRF_TRUSTED_ORIGINS += [o.strip() for o in extra_csrf.split(',') if o.strip()]

# 3. RUTAS
ROOT_URLCONF = 'config.urls'

# 4. APLICACIONES
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'rest_framework',
    'corsheaders',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'usuarioapp',
    'festivalapp',
    'restauranteapp',
    'interaccionapp',
    'resultadoapp',
]

# 5. MIDDLEWARE (orden importante: CORS arriba, WhiteNoise justo después de Security)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 6. BASE DE DATOS — SSL solo si la URL no es local
DATABASE_URL = os.getenv('DATABASE_URL', '')
_ssl_require = not (
    DATABASE_URL.startswith('sqlite')
    or 'localhost' in DATABASE_URL
    or '127.0.0.1' in DATABASE_URL
)
DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
        ssl_require=_ssl_require,
    )
}

# 7. CORS — restringido por entorno
# Si CORS_ALLOWED_ORIGINS está definido, solo esos dominios pueden llamar a la API.
# Si no, en DEBUG se permite todo (para desarrollo local).
_cors_env = os.getenv('CORS_ALLOWED_ORIGINS', '').strip()
if _cors_env:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_env.split(',') if o.strip()]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

# 8. GOOGLE AUTH
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID') or os.getenv('VITE_GOOGLE_CLIENT_ID')

# 9. PLANTILLAS
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# 10. ARCHIVOS ESTÁTICOS (WhiteNoise para servirlos en producción)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 11. DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "usuarioapp.authentication.AdminJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# 12. Brevo
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_NAME = "Festival Gastronómico OTP"
BREVO_SENDER_EMAIL = "festivalgastronomicopat@gmail.com"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# 13. Seguridad detrás del proxy de Railway (HTTPS)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# 14. Override de DB para pruebas: SQLite en memoria (rápido y aislado)
import sys
if 'test' in sys.argv or os.getenv('USE_TEST_DB') == '1':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
