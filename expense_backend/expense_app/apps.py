# expense_app/apps.py
from django.apps import AppConfig

class ExpenseAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expense_app'

    def ready(self):
        from . import promote_admin
        promote_admin.run()
