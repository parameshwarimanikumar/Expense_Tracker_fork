# expense_app/promote_admin.py
from expense_app.models import User

def run():
    email = "paramesh@email.com"
    password = "paramesh12345"

    try:
        user = User.objects.get(email=email)
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        print(f"✅ Admin privileges granted to {email}")
    except User.DoesNotExist:
        print(f"❌ User {email} not found")
