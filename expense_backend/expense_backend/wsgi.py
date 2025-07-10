import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_backend.settings')

application = get_wsgi_application()

# ✅ Run admin promotion logic
try:
    from expense_app.promote_admin import run
    run()
except Exception as e:
    print(f"⚠️ promote_admin failed: {e}")
