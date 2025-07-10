# Add this only temporarily to auto-create a superuser
import os
from django.contrib.auth import get_user_model
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_backend.settings')
application = get_wsgi_application()

User = get_user_model()
email = "paramesh@email.com"
password = "admin123"

if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password)
