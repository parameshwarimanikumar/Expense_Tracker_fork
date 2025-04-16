from django.urls import path
from .views import *

urlpatterns = [
    # Authentication
    path('register/', register_user, name='register'),
    path('login/', user_login, name='login'),
    path('logout/', user_logout, name='logout'),
    
    # Roles
    path('roles/', role_list_create, name='role-list-create'),
    path('roles/<int:pk>/', role_detail, name='role-detail'),
    
    # Categories
    path('categories/', category_list_create, name='category-list-create'),
    path('categories/<int:pk>/', category_detail, name='category-detail'),
    
    # Items
    path('items/', item_list_create, name='item-list-create'),
    path('items/<int:pk>/', item_detail, name='item-detail'),
    path('items/<int:item_id>/price-history/', item_price_history, name='item-price-history'),
    
    # Expenses
    path('expenses/', expense_list_create, name='expense-list-create'),
    path('expenses/<int:pk>/', expense_detail, name='expense-detail'),
    
    # Orders
    path('orders/', order_list_create, name='order-list-create'),
    path('orders/<int:pk>/', order_detail, name='order-detail'),

    path('orders/<int:order_id>/delete/', delete_order, name='delete_order'),


    #oreder_items
    path("order-items/", order_item_list, name="order-item-list"),
    path("order-items/<int:pk>/", order_item_detail, name="order-item-detail"),

    #Transactions
    path('transactions/', transaction_list_create, name='transaction-list-create'),
    path('transactions/<int:pk>/', transaction_detail, name='transaction-detail'),
    
    # Notifications
    path('notifications/', notification_list, name='notification-list'),
    path('notifications/<int:pk>/', notification_detail, name='notification-detail'),

    #Dailt total of regular and others
    path('daily-summary/', daily_combined_totals, name='daily-summary'),

    # Recent Data
    path('order-summary/', daily_orderitem_summary, name='order-summary'),

    path('orders-by-date/', orders_by_date, name='orders-by-date'),

    path('orders/delete-by-date/', delete_orders_by_date_user, name='delete-orders-by-date'),

    

    path('orders/grouped-by-date/', order_items_grouped_by_date, name='order-items-grouped-by-date'),
    path('orders/available-dates/', available_dates, name='available-dates'),


]