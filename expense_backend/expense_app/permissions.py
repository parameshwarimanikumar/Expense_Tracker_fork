from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.role_name.lower() == 'admin' if request.user.role else False

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role and request.user.role.role_name.lower() == 'admin':
            return True
        return obj.user == request.user
    
class IsNotificationRecipient(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.recipient == request.user
