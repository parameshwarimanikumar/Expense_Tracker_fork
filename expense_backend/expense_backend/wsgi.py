import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_backend.settings')
application = get_wsgi_application()

# ✅ Auto-create superuser for Render (TEMP CODE)
from django.contrib.auth import get_user_model
User = get_user_model()

try:
    if not User.objects.filter(email="paramesh@email.com").exists():
        print("✅ Creating admin user...")
        User.objects.create_superuser(
            email="paramesh@email.com",
            password="admin123"
        )
    else:
        print("✅ Admin user already exists.")
except Exception as e:
    print("❌ Error creating admin user:", e)
