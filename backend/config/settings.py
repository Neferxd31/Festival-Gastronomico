import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# 1. Cargar variables de entorno del archivo .env
load_dotenv()

# Directorio base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# 2. SEGURIDAD Y ENTORNO
# Se recomienda tener SECRET_KEY, DEBUG y ALLOWED_HOSTS en el .env
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-clave-temporal')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# Convertimos la cadena de ALLOWED_HOSTS en una lista
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',')

# 3. DEFINICIÓN DE RUTAS (Importante para evitar el error ROOT_URLCONF)
ROOT_URLCONF = 'config.urls'

# 4. APLICACIONES INSTALADAS
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
    'corsheaders',  # Habilita la comunicación con React
]

# 5. MIDDLEWARES (El orden es fundamental para CORS)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Debe ir justo aquí
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware', # Comentado si usas @csrf_exempt
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 6. CONFIGURACIÓN DE BASE DE DATOS (Railway / PostgreSQL)
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        ssl_require=True
    )
}

# 7. CONFIGURACIÓN DE CORS (Para resolver bloqueos con Vite/React)
# En desarrollo, esto permite que cualquier origen se conecte
CORS_ALLOW_ALL_ORIGINS = True 

# 8. GOOGLE AUTH CONFIG
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

# 9. PLANTILLAS Y OTROS BÁSICOS
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

STATIC_URL = 'static/'
# Google Auth Settings
GOOGLE_CLIENT_ID = os.getenv("VITE_GOOGLE_CLIENT_ID") 

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "usuarioapp.authentication.AdminJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

#Settings para Brevo 
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_NAME = "Festival Gastronómico OTP"
BREVO_SENDER_EMAIL = "festivalgastronomicopat@gmail.com"
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'