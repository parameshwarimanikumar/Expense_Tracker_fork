from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from expense_app.views import home_view

urlpatterns = [
    path('', home_view),  # 👈 this handles "/"
    path('admin/', admin.site.urls),
    path('api/', include('expense_app.urls')),  # Or whatever your app is
]

# Add this line to serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
