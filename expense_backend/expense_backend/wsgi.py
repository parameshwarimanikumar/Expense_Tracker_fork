"""
WSGI config for expense_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_backend.settings')

application = get_wsgi_application()

# ✅ Auto-promote admin during deployment (once per container start)
try:
    from expense_app.promote_admin import run
    run()
except Exception as e:
    print(f"⚠️ Could not promote admin: {e}")
