from django.contrib import admin
from .models import *
from django.contrib.auth.admin import UserAdmin

class CustomUserAdmin(UserAdmin):
    list_display = ('id', 'email', 'username', 'role', 'is_staff', 'profile_picture')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('username', 'role', 'profile_picture')}),
        ('Permissions', {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'role', 'profile_picture', 'password1', 'password2'),
        }),
    )


class CustomRole(admin.ModelAdmin):
    list_display = ('id','role_name', 'description')

class CustomCategory(admin.ModelAdmin):
    list_display = ('id','created_user','created_date','updated_date')

class CustomItem(admin.ModelAdmin):
    list_display = ('id','category','created_user','item_name','item_price','created_date','updated_date')

class CustomItemPriceHistory(admin.ModelAdmin):
    list_display = ('id','item','price','date')
 
admin.site.register(User, CustomUserAdmin)
admin.site.register(Role, CustomRole)
admin.site.register(Category, CustomCategory)
admin.site.register(Item,CustomItem)
admin.site.register(ItemPriceHistory, CustomItemPriceHistory)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_user', 'calculated_price', 'created_date', 'updated_date')
    search_fields = ('created_user__username', 'id')
    list_filter = ('created_date', 'updated_date')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'item', 'count', 'added_date')
    search_fields = ('order__id', 'item__item_name')
    list_filter = ('added_date',)

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'date', 'description', 'expense_type', 'amount', 'is_verified', 'is_refunded', 'created_date', 'updated_date')
    search_fields = ('user__username', 'description', 'expense_type')
    list_filter = ('expense_type', 'created_date', 'is_verified', 'is_refunded')

@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ('id', 'expense', 'uploaded_date')
    search_fields = ('expense__id',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_price', 'status', 'from_date', 'to_date', 'created_date')
    search_fields = ('user__username', 'status')
    list_filter = ('status', 'created_date')

@admin.register(TransactionOrder)
class TransactionOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'expense', 'order_id', 'created_date')
    search_fields = ('transaction__id', 'expense__id', 'order_id__id')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'recipient', 'expense', 'message', 'is_read', 'created_date')
    search_fields = ('user__username', 'recipient__username', 'message')
    list_filter = ('is_read', 'created_date')
