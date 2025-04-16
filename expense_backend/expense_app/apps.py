from django.apps import AppConfig


class ExpenseAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'expense_app'
    
    def ready(self):
        import expense_app.signals