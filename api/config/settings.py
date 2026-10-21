from pathlib import Path
import os
import sys
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

# ------------------------------------------------------------------------------
# 1. CORE DJANGO SETTINGS
# ------------------------------------------------------------------------------
# In production, set DJANGO_DEBUG=False
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

DEFAULT_DEV_SECRET = 'django-insecure-lw-2ccog109jl^*dhsiibg2%y6*#p9-*7f+_m@7j2*hxjba$i@'
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', DEFAULT_DEV_SECRET)

raw_allowed_hosts = os.getenv('DJANGO_ALLOWED_HOSTS', '*' if DEBUG else '')
if raw_allowed_hosts:
    ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*'] if DEBUG else []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'corsheaders',
    'rest_framework',
    # Local apps
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ------------------------------------------------------------------------------
# 2. DATABASE CONFIGURATION (PostgreSQL)
# ------------------------------------------------------------------------------
DB_NAME = os.getenv('DB_NAME', 'detty_luxe_db')
DB_USER = os.getenv('DB_USER', 'micoliser')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', '')
DB_PORT = os.getenv('DB_PORT', '')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# ------------------------------------------------------------------------------
# 3. PAYMENT GATEWAYS & FRONTEND INTEGRATION
# ------------------------------------------------------------------------------
PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY', '')
PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY', '')
FLUTTERWAVE_SECRET_KEY = os.getenv('FLUTTERWAVE_SECRET_KEY', '')
FLUTTERWAVE_PUBLIC_KEY = os.getenv('FLUTTERWAVE_PUBLIC_KEY', '')
FLUTTERWAVE_SECRET_HASH = os.getenv('FLUTTERWAVE_SECRET_HASH', 'test_secret' if DEBUG else '')
FRONTEND_BASE_URL = os.getenv('FRONTEND_BASE_URL', 'http://localhost:3000' if DEBUG else '')

# Reservation temporary seat hold window in minutes before automatic cancellation (default: 30)
BOOKING_HOLD_TIMEOUT_MINUTES = int(os.getenv('BOOKING_HOLD_TIMEOUT_MINUTES', 30))

# ------------------------------------------------------------------------------
# 4. CORS & CSRF CONFIGURATION
# ------------------------------------------------------------------------------
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOW_CREDENTIALS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOW_CREDENTIALS = True
    raw_cors = os.getenv('CORS_ALLOWED_ORIGINS', '')
    allowed_cors = [origin.strip() for origin in raw_cors.split(',') if origin.strip()]
    if FRONTEND_BASE_URL and FRONTEND_BASE_URL not in allowed_cors:
        allowed_cors.append(FRONTEND_BASE_URL)
    CORS_ALLOWED_ORIGINS = allowed_cors

    # Populate CSRF trusted origins for production
    csrf_origins = []
    if FRONTEND_BASE_URL:
        csrf_origins.append(FRONTEND_BASE_URL)
    for host in ALLOWED_HOSTS:
        if host and host != '*':
            csrf_origins.append(f"https://{host}")
    CSRF_TRUSTED_ORIGINS = csrf_origins

# ------------------------------------------------------------------------------
# 5. EMAIL CONFIGURATION
# Dynamically configured email backend:
# In local development (DEBUG=True), defaults to console.EmailBackend (prints directly to terminal).
# In production (DEBUG=False), uses smtp.EmailBackend to send real emails via SMTP.
EMAIL_BACKEND = os.getenv(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend' if DEBUG else 'django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT')) if os.getenv('EMAIL_PORT') else None
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', '').lower() in ('true', '1', 'yes')
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', '').lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL')
SERVER_EMAIL = DEFAULT_FROM_EMAIL

EMAIL_ENABLED = os.getenv('EMAIL_ENABLED', '').lower() in ('true', '1', 'yes')
EMAIL_DEBUG = os.getenv('EMAIL_DEBUG', '').lower() in ('true', '1', 'yes')
EMAIL_SENDER_NAME = os.getenv('EMAIL_SENDER_NAME')

INTERNAL_NOTIFICATION_EMAILS = [
    e.strip() for e in os.getenv('INTERNAL_NOTIFICATION_EMAILS', '').split(',') if e.strip()
]

# ------------------------------------------------------------------------------
# 6. STRICT PRODUCTION SAFETY ENFORCEMENT
# ------------------------------------------------------------------------------
def validate_production_settings(
    secret_key=None,
    default_dev_secret=None,
    allowed_hosts=None,
    db_password=None,
    frontend_base_url=None,
    paystack_secret_key=None,
    paystack_public_key=None,
    flutterwave_secret_key=None,
    flutterwave_public_key=None,
    flutterwave_secret_hash=None,
):
    """
    Validates that all critical production credentials and security variables
    are provided and not insecure defaults. Raises ImproperlyConfigured if any fail.
    """
    sec_key = secret_key if secret_key is not None else SECRET_KEY
    dev_sec = default_dev_secret if default_dev_secret is not None else DEFAULT_DEV_SECRET
    hosts = allowed_hosts if allowed_hosts is not None else ALLOWED_HOSTS
    db_pass = db_password if db_password is not None else DB_PASSWORD
    front_url = frontend_base_url if frontend_base_url is not None else FRONTEND_BASE_URL
    ps_sec = paystack_secret_key if paystack_secret_key is not None else PAYSTACK_SECRET_KEY
    ps_pub = paystack_public_key if paystack_public_key is not None else PAYSTACK_PUBLIC_KEY
    flw_sec = flutterwave_secret_key if flutterwave_secret_key is not None else FLUTTERWAVE_SECRET_KEY
    flw_pub = flutterwave_public_key if flutterwave_public_key is not None else FLUTTERWAVE_PUBLIC_KEY
    flw_hash = flutterwave_secret_hash if flutterwave_secret_hash is not None else FLUTTERWAVE_SECRET_HASH

    errors = []

    # 1. Secret Key Check
    if not sec_key or sec_key == dev_sec or sec_key.startswith('django-insecure-') or len(sec_key) < 32:
        errors.append(
            "DJANGO_SECRET_KEY: Missing or using the default insecure key. A unique 50+ character secret key is required in production."
        )

    # 2. Allowed Hosts Check
    if not hosts or '*' in hosts:
        errors.append(
            "DJANGO_ALLOWED_HOSTS: Must be explicitly set to your production domains (comma-separated). Wildcard '*' is strictly forbidden in production."
        )

    # 3. Database Password Check
    if not db_pass:
        errors.append(
            "DB_PASSWORD: PostgreSQL password must be set in production."
        )

    # 4. Frontend Base URL Check
    if not front_url or not front_url.startswith('https://') or 'localhost' in front_url:
        errors.append(
            "FRONTEND_BASE_URL: Must be set to a valid production HTTPS URL (e.g. https://yourdomain.com), not localhost."
        )

    # 5. Paystack Keys Check
    if not ps_sec:
        errors.append("PAYSTACK_SECRET_KEY: Paystack Secret Key is missing.")
    if not ps_pub:
        errors.append("PAYSTACK_PUBLIC_KEY: Paystack Public Key is missing.")

    # 6. Flutterwave Keys Check
    if not flw_sec:
        errors.append("FLUTTERWAVE_SECRET_KEY: Flutterwave Secret Key is missing.")
    if not flw_pub:
        errors.append("FLUTTERWAVE_PUBLIC_KEY: Flutterwave Public Key is missing.")
    if not flw_hash or flw_hash == 'test_secret':
        errors.append("FLUTTERWAVE_SECRET_HASH: Flutterwave webhook Secret Hash is missing or using default 'test_secret'.")

    if errors:
        error_message = (
            "\n" + "=" * 80 + "\n"
            "🚨 CRITICAL PRODUCTION CONFIGURATION ERROR - STARTUP BLOCKED\n"
            "The application cannot start in production mode (DJANGO_DEBUG=False) with missing\n"
            "or insecure configuration. Fix the following environment variables in your environment:\n"
            + "=" * 80 + "\n"
            + "\n".join(f"  ❌ {err}" for err in errors)
            + "\n" + "=" * 80 + "\n"
        )
        raise ImproperlyConfigured(error_message)

    return True


# Run validation at startup when in production mode
if not DEBUG and 'test' not in sys.argv:
    validate_production_settings()
