from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import HttpResponse
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

# Original unbound admin login method
_default_admin_login = admin.site.login


def get_client_ip(request):
    """
    Safely resolves client IP respecting reverse proxies (HIGH-04).
    When behind NUM_PROXIES proxies, takes the appropriate right-most address appended by proxy.
    """
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    remote_addr = request.META.get('REMOTE_ADDR', '127.0.0.1')
    if not xff:
        return remote_addr
    addrs = [a.strip() for a in xff.split(',') if a.strip()]
    if not addrs:
        return remote_addr
    num_proxies = getattr(settings, 'NUM_PROXIES', 1)
    if num_proxies > 0:
        return addrs[-min(num_proxies, len(addrs))]
    return remote_addr


def rate_limited_admin_login(request, extra_context=None):
    """
    HIGH-04: Protects Django Admin against credential stuffing and brute-force attacks.
    - Limits rapid bursts (max 10 requests / min).
    - Locks out IP after 5 consecutive failed login attempts for 15 minutes.
    - Automatically resets failure count upon successful authentication.
    """
    client_ip = get_client_ip(request)
    burst_key = f"admin_burst_{client_ip}"
    fail_key = f"admin_fail_{client_ip}"

    # 1. Burst rate limiting
    burst_count = cache.get(burst_key, 0)
    if burst_count >= 10:
        logger.warning("Admin login burst limit exceeded for IP: %s", client_ip)
        return HttpResponse("Too many admin requests. Please slow down.", status=429)
    cache.set(burst_key, burst_count + 1, timeout=60)

    # 2. Lockout check on failed credentials
    fail_count = cache.get(fail_key, 0)
    if fail_count >= 5:
        logger.warning("Admin login locked out due to failed attempts for IP: %s", client_ip)
        return HttpResponse("Admin login locked due to multiple failed attempts. Please try again in 15 minutes.", status=429)

    response = _default_admin_login(request, extra_context=extra_context)

    # Django admin login returns 302 redirect upon successful authentication,
    # or re-renders the login template (status 200) with errors on failure.
    if request.method == 'POST':
        if response.status_code == 302:
            cache.delete(fail_key)
            logger.info("Successful admin login from IP: %s", client_ip)
        else:
            new_fails = fail_count + 1
            cache.set(fail_key, new_fails, timeout=900)
            logger.warning("Failed admin login attempt (%d/5) from IP: %s", new_fails, client_ip)

    return response


# Hook the security-wrapped login view
admin.site.login = rate_limited_admin_login

admin_path = getattr(settings, 'DJANGO_ADMIN_URL', 'admin/').strip('/') + '/'

urlpatterns = [
    path(admin_path, admin.site.urls),
    path('api/', include('core.urls')),
]
