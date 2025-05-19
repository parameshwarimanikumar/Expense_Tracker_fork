from django.urls import path
from django.conf.urls.static import static
from . import views  # Ensure views is imported

urlpatterns = [
    # Authentication
    path('register/', views.register_user, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    
    # Roles
    path('roles/', views.role_list_create, name='role-list-create'),
    path('roles/<int:pk>/', views.role_detail, name='role-detail'),
    
    # Categories
    path('categories/', views.category_list_create, name='category-list-create'),
    path('categories/<int:pk>/', views.category_detail, name='category-detail'),
    
    # Items
    path('items/', views.item_list_create, name='item-list-create'),
    path('items/<int:pk>/', views.item_detail, name='item-detail'),
    path('items/<int:item_id>/price-history/', views.item_price_history, name='item-price-history'),
    
    # Expenses
    path('expenses/', views.expense_list_create, name='expense-list-create'),
    path('expenses/<int:pk>/', views.expense_detail, name='expense-detail'),
    path('expenses/mydata/', views.my_expenses, name='my_expenses'),

    # Orders
    path('orders/', views.order_list_create, name='order-list-create'),
    path('orders/<int:pk>/', views.order_detail, name='order-detail'),

    path('orders/<int:order_id>/delete/', views.delete_order, name='delete_order'),

    # Order Items
    path("order-items/", views.order_item_list, name="order-item-list"),
    path("order-items/<int:pk>/", views.order_item_detail, name="order-item-detail"),

    # Transactions
    path('transactions/', views.transaction_list_create, name='transaction-list-create'),
    path('transactions/<int:pk>/', views.transaction_detail, name='transaction-detail'),
    
    # Notifications
    path('notifications/', views.notification_list, name='notification-list'),
    path('notifications/<int:pk>/', views.notification_detail, name='notification-detail'),

    # Daily total of regular and others
    path('daily-summary/', views.daily_combined_totals, name='daily-summary'),

    # Recent Data
    path('order-summary/', views.daily_orderitem_summary, name='order-summary'),

    path('orders-by-date/', views.orders_by_date, name='orders-by-date'),

    path('orders/delete-by-date/', views.delete_orders_by_date_user, name='delete-orders-by-date'),

    path('orders/grouped-by-date/', views.order_items_grouped_by_date, name='order-items-grouped-by-date'),
    path('orders/available-dates/', views.available_dates, name='available-dates'),
]
