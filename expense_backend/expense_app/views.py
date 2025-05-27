from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models.functions import TruncDate

from django.db import transaction as db_transaction
from django.contrib.auth import logout
from django.db.models import Sum, F, FloatField
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes  # ✅ this is the missing one
from django.utils.timezone import datetime,now,make_aware
from datetime import date
import json

from .models import *
from .serializers import *
from .permissions import *

from dateutil import parser


# Authentication View

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny]) 
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_profile_picture(request):
    user = request.user

    if 'profile_picture' in request.FILES:
        user.profile_picture = request.FILES['profile_picture']

    # Optional: handle name and email too
    if 'name' in request.data:
        user.first_name = request.data['name']
    if 'email' in request.data:
        user.email = request.data['email']

    user.save()

    return Response({
        'name': user.first_name,
        'email': user.email,
        'profile_picture': request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else '',
    })



@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def user_profile(request):
    user = request.user

    if request.method == 'GET':
        return Response({
            'name': user.first_name,
            'email': user.email,
            'profile_picture': request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else '',
        })

    elif request.method == 'PUT':
        user.first_name = request.data.get('name', user.first_name)
        user.email = request.data.get('email', user.email)

        if request.data.get('password'):
            user.set_password(request.data['password'])

        if 'profile_picture' in request.FILES:
            user.profile_picture = request.FILES['profile_picture']

        user.save()

        return Response({'detail': 'Profile updated successfully'})



@api_view(['POST'])
@authentication_classes([])  
@permission_classes([AllowAny])  
def user_login(request):
    serializer = MyTokenObtainPairSerializer(data=request.data)
    if serializer.is_valid():
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    try:
        refresh_token = request.data["refresh_token"]
        token = RefreshToken(refresh_token)
        token.blacklist()  # blacklist the refresh token
        logout(request)
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# class MyTokenObtainPairView(TokenObtainPairView):
#      serializer_class = MyTokenObtainPairSerializer

# Role Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def role_list_create(request):
    if request.method == 'GET':
        roles = Role.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = RoleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def role_detail(request, pk):
    try:
        role = Role.objects.get(pk=pk)
    except Role.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = RoleSerializer(role)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = RoleSerializer(role, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        role.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Category Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def category_list_create(request):
    if request.method == 'GET':
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.role or request.user.role.role_name.lower() != 'admin':
            return Response({'error': 'Only admin can create categories'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['created_user'] = request.user.id
        serializer = CategorySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def category_detail(request, pk):
    category = get_object_or_404(Category, pk=pk)

    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Item Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def item_list_create(request):
    if request.method == 'GET':
        items = Item.objects.all()
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.role or request.user.role.role_name.lower() != 'admin':
            return Response({'error': 'Only admin can create items'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        data['created_user'] = request.user.id
        serializer = ItemSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def item_detail(request, pk):
    try:
        item = Item.objects.get(pk=pk)
    except Item.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ItemSerializer(item)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Item Price Track

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def item_price_history(request, item_id):
    try:
        item = Item.objects.get(pk=item_id)
        history = ItemPriceHistory.objects.filter(item=item).order_by('-date')
        serializer = ItemPriceHistorySerializer(history, many=True)
        return Response(serializer.data)
    except Item.DoesNotExist:
        return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

# Expense Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def expense_list_create(request):
    if request.method == 'GET':
        expenses = Expense.objects.all().order_by('-date')
        serializer = ExpenseSerializer(expenses, many=True, context={'request': request})
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ExpenseSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            # Return validation errors if any
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with db_transaction.atomic():
                # 1) Save the expense itself
                expense = serializer.save(user=request.user)

                # 2) Notify all admins
                admins = User.objects.filter(role__role_name__iexact="admin")
                for admin in admins:
                    Notification.objects.create(
                        user=request.user,
                        recipient=admin,
                        message=(
                            f"{request.user.username} submitted an expense "
                            f"₹{expense.amount} on {expense.date}"
                        ),
                        is_read=False
                    )

                # 3) Create a corresponding Order
                Order.objects.create(
                    created_user=request.user,
                    calculated_price=expense.amount
                )

                # 4) Create a corresponding Transaction
                transaction = Transaction.objects.create(
                    user=request.user,
                    total_price=expense.amount,
                    status="Pending",
                    from_date=timezone.now(),
                    to_date=timezone.now()
                )

                # 5) Link them in TransactionOrder
                TransactionOrder.objects.create(
                    transaction=transaction,
                    expense=expense,
                    order_id=Order.objects.get(created_user=request.user, calculated_price=expense.amount)
                )

                # 6) Save uploaded bill file (if any) into Expense.bill
                if 'bill' in request.FILES:
                    expense.bill = request.FILES['bill']
                    expense.save()

                # 7) Return the fully serialized expense (including bill_url)
                out_serializer = ExpenseSerializer(
                    expense,
                    context={'request': request}
                )
                return Response(out_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as exc:
            # Catch any unexpected errors
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_expenses(request):
    user_expenses = Expense.objects.filter(user=request.user)
    serializer = ExpenseSerializer(user_expenses, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail(request, pk):
    # 1) Fetch or 404
    expense = get_object_or_404(Expense, pk=pk)

    # 2) GET
    if request.method == 'GET':
        serializer = ExpenseSerializer(expense, context={'request': request})
        return Response(serializer.data)

    # 3) PUT (edit)
    elif request.method == 'PUT':
        data = request.data
        user = request.user

        # Optional: enforce only admin can change verification/refund
        if ('is_verified' in data or 'is_refunded' in data) and (
            not user.role or user.role.role_name.lower() != 'admin'
        ):
            return Response(
                {"error": "Only admin can update verification or refund status."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            with db_transaction.atomic():
                # — Update simple fields —
                expense.description  = data.get('description', expense.description)
                expense.expense_type = data.get('expense_type', expense.expense_type)
                expense.amount       = data.get('amount', expense.amount)

                if 'is_verified' in data:
                    expense.is_verified = data['is_verified']
                if 'is_refunded' in data:
                    expense.is_refunded = data['is_refunded']

                # — NEW: handle bill file replacement —
                if 'bill' in request.FILES:
                    expense.bill = request.FILES['bill']

                expense.save()

                # Optional: send notification when admin verifies
                if data.get('is_verified') is True:
                    Notification.objects.create(
                        user=request.user,
                        recipient=expense.user,
                        message=(
                            f"Your expense of ₹{expense.amount}"
                            f" on {expense.date} has been verified"
                        ),
                        is_read=False
                    )

                # — Recalculate or recreate associated Order/Transaction as you did before —
                order = (
                    Order.objects.filter(created_user=user)
                    .order_by('-created_date')
                    .first()
                )
                if not order:
                    order = Order.objects.create(
                        created_user=user,
                        calculated_price=expense.amount
                    )
                else:
                    order.calculated_price = expense.amount
                    order.save()

                transaction_order, created = TransactionOrder.objects.get_or_create(
                    expense=expense,
                    defaults={'order_id': order}
                )
                if not created:
                    transaction_order.order_id = order
                    transaction_order.save()

                txn = transaction_order.transaction
                if txn:
                    txn.total_price = expense.amount
                    txn.status = 'Completed' if expense.is_refunded else 'Pending'
                    txn.save()

                # — Return the updated expense, including new bill_url —
                out_serializer = ExpenseSerializer(
                    expense,
                    context={'request': request}
                )
                return Response(out_serializer.data, status=status.HTTP_200_OK)

        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # 4) DELETE
    else:
        if expense.user != request.user and (
            not request.user.role or
            request.user.role.role_name.lower() != 'admin'
        ):
            return Response(
                {"error": "You do not have permission to delete this expense."},
                status=status.HTTP_403_FORBIDDEN
            )
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Order Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_list_create(request):
    if request.method == 'GET':
        if request.user.role and request.user.role.role_name.lower() == 'admin':
            orders = Order.objects.all()
        else:
            orders = Order.objects.filter(created_user=request.user)
        
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        try:
            with db_transaction.atomic():
                # Create the order first
                order = Order.objects.create(
                    created_user=request.user,
                    calculated_price=0  # Will be updated after items are added
                )

                # Create order items
                order_items = []
                for item_data in request.data.get('order_items', []):

                    # raw_date = item_data.get('added_date')
                    # if raw_date:
                    #     try:
                            
                    #         added_date = parser.isoparse(raw_date)
                    #         if timezone.is_naive(added_date):
                    #             added_date = timezone.make_aware(added_date)
                    #     except Exception:
                    #         added_date = timezone.now()
                    # else:
                    #     added_date = timezone.now()
                    

                    raw_date = item_data.get('added_date')

                    if raw_date:
                        try:
                            added_date = parser.isoparse(raw_date)

                            # If the parsed date is naive (no timezone), make it aware
                            if timezone.is_naive(added_date):
                                added_date = timezone.make_aware(added_date)

                        except Exception as e:
                            print(f"Invalid added_date format: {raw_date} — Error: {e}")
                            return Response({'error': f'Invalid date format: {raw_date}'}, status=400)

                    else:
                        return Response({'error': 'Missing added_date for one of the items.'}, status=400)



                    order_item = OrderItem.objects.create(
                        order=order,
                        item_id=item_data.get('item'),
                        count=item_data.get('count', 1),
                        # added_date=timezone.now()
                        added_date=added_date
                    )
                    order_items.append(order_item)

                # Update the order total
                order.update_total_price()
                
                serializer = OrderSerializer(order)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    
    elif request.method == 'PUT':

        try:
            with db_transaction.atomic():
                # Get existing items to compare
                existing_items = {item.id: item for item in order.orderitem_set.all()}
                updated_ids = []
                
                # Process each item in request
                for item_data in request.data.get('order_items', []):
                    item_id = item_data.get('id')
                    
                    if item_id and item_id in existing_items:
                        # Update existing item
                        item = existing_items[item_id]
                        item.count = item_data.get('count', item.count)
                        item.added_date = timezone.now() 
                        item.save()
                        updated_ids.append(item_id)
                    else:
                        # Create new item
                        OrderItem.objects.create(
                            order=order,
                            item_id=item_data.get('item'),
                            count=item_data.get('count', 1),
                            added_date=timezone.now()
                        )
                
                # Delete items not in request
                for item_id, item in existing_items.items():
                    if item_id not in updated_ids:
                        item.delete()
                
                # Update order total
                order.update_total_price()
                order.save()
                
                return Response(OrderSerializer(order).data)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        if order.added_date != timezone.now().date():
            return Response({'error': 'Only today\'s orders can be deleted.'}, status=403)
        order.delete()
        return Response({'message': 'Order deleted successfully'}, status=204)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    
#order Item
@api_view(['GET', 'POST'])
def order_item_list(request):
    """List all order items or create a new order item."""
    if request.method == "GET":
        order_items = OrderItem.objects.all()
        serializer = OrderItemSerializer(order_items, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = OrderItemSerializer(data=request.data)
        if serializer.is_valid():
            validated = serializer.validated_data

            order_id = request.data.get("order")
            item_id = request.data.get("item")

            if not order_id or not item_id:
                return Response({"error": "Missing order or item ID"}, status=400)

            order = get_object_or_404(Order, id=order_id)
            item = get_object_or_404(Item, id=item_id)
            count = validated.get("count", 1)
            added_date = validated.get("added_date", timezone.now())

            order_item = OrderItem.objects.create(
                order=order,
                item=item,
                count=count,
                added_date=added_date
            )
            order.update_total_price()

            return Response(OrderItemSerializer(order_item).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET','PUT','DELETE'])
@permission_classes([IsAuthenticated])
def order_item_detail(request, pk):
    order_item = get_object_or_404(OrderItem, id=pk)
    
    # Prevent editing if not today's entry
    if request.method in ['PUT', 'DELETE']:
        if order_item.added_date.date() != timezone.now().date():
            return Response(
                {"error": "Only today's records can be edited or deleted"},
                status=status.HTTP_403_FORBIDDEN
            )
    
    if request.method == "GET":
        serializer = OrderItemSerializer(order_item)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = OrderItemSerializer(order_item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            order_item.order.update_total_price() 
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        order = order_item.order
        order_item.delete()
        order.update_total_price()
        return Response({"message": "OrderItem deleted"}, status=status.HTTP_204_NO_CONTENT)
    
# Transaction Views

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def transaction_list_create(request):
    if request.method == 'GET':
        transactions = Transaction.objects.filter(user=request.user)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        data['user'] = request.user.id
        serializer = TransactionSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsOwnerOrAdmin])
def transaction_detail(request, pk):
    transaction = get_object_or_404(Transaction, pk=pk)
    
    if request.method == 'GET':
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TransactionSerializer(transaction, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# Notification Views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notification_list(request):
    notifications = Notification.objects.filter(recipient=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def notification_detail(request, pk):
    notification = get_object_or_404(Notification, pk=pk, recipient=request.user)

    if request.method == 'GET':
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

# Daily total

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_combined_totals(request):

    orderitem_totals = (
        OrderItem.objects
        .annotate(date=TruncDate('added_date'))
        .values('date')
        .annotate(order_total=Sum(F('item__item_price') * F('count')))
        .order_by('date')
    )
    print("Regular expense",orderitem_totals)

    expense_totals = (
        TransactionOrder.objects
        .filter(expense__isnull=False)
        .annotate(date=TruncDate('created_date'))
        .values('date')
        .annotate(expense_total=Sum('expense__amount'))  
        .order_by('date')
    )

    print("Regular expense",expense_totals)

    # === Merge Both Results ===
    totals_by_date = {}

    for entry in orderitem_totals:
        date_str = entry['date'].strftime('%Y-%m-%d')
        totals_by_date.setdefault(date_str, {'order_total': 0, 'expense_total': 0})
        totals_by_date[date_str]['order_total'] = entry['order_total']

    for entry in expense_totals:
        date_str = entry['date'].strftime('%Y-%m-%d')
        totals_by_date.setdefault(date_str, {'order_total': 0, 'expense_total': 0})
        totals_by_date[date_str]['expense_total'] = entry['expense_total']

    # Convert to list for response
    result = [
        {
            'date': date,
            'order_total': round(values['order_total'] or 0, 2),
            'expense_total': round(values['expense_total'] or 0, 2),
            'combined_total': round((values['order_total'] or 0) + (values['expense_total'] or 0), 2)
        }
        for date, values in sorted(totals_by_date.items())
    ]

    return Response(result)


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def daily_orderitem_summary(request):
#     # Only include orders with calculated_price > 0
#     orderitems = OrderItem.objects.filter(
#         order__calculated_price__gt=0
#     ).annotate(
#         order_date=F('added_date__date'),
#         username=F('order__created_user__username'),
#     )

#     summary = {}
#     for item in orderitems:
#         date_str = item.added_date.date().isoformat()
#         user = item.order.created_user.username

#         key = (date_str, user)
#         if key not in summary:
#             summary[key] = {
#                 "date": date_str,
#                 "user": user,
#                 "total_count": 0,
#                 "total_amount": 0.0,
#             }

#         summary[key]["total_count"] += item.count
#         summary[key]["total_amount"] += item.item.item_price * item.count

#     # Sort by most recent date
#     response_data = sorted(summary.values(), key=lambda x: (x['date'], x['user']), reverse=True)
#     return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_orderitem_summary(request):
    orderitems = OrderItem.objects.filter(
        order__calculated_price__gt=0
    ).annotate(
        order_date=F('added_date__date'),
        username=F('order__created_user__username'),
    )

    summary = {}
    for item in orderitems:
        date_str = item.added_date.date().isoformat()
        user = item.order.created_user.username
        key = (date_str, user)

        if key not in summary:
            summary[key] = {
                "date": date_str,
                "user": user,
                "total_count": 0,
                "total_amount": 0.0,
                "order_id": item.order.id  # ✅ include order ID here
            }

        summary[key]["total_count"] += item.count
        summary[key]["total_amount"] += item.item.item_price * item.count

    response_data = sorted(summary.values(), key=lambda x: (x['date'], x['user']), reverse=True)
    return Response(response_data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def orders_by_date(request):
    date = request.query_params.get('date')
    username = request.query_params.get('username')
    
    if not date or not username:
        return Response({'error': 'Date and username parameters are required'}, status=400)
    
    try:
        user = User.objects.get(username=username)
        order_items = OrderItem.objects.filter(
            added_date__date=date,
            order__created_user=user
        ).select_related('item', 'order') 

        serializer = OrderItemSerializer(order_items, many=True)
        return Response(serializer.data)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_orders_by_date_user(request):
    date = request.query_params.get('date')
    username = request.query_params.get('username')

    if not date or not username:
        return Response({'error': 'Missing date or username'}, status=400)

    try:
        orders_to_delete = Order.objects.filter(
            created_user__username=username,
            orderitem__added_date__date=date
        ).distinct()

        count = orders_to_delete.count()
        orders_to_delete.delete()

        return Response({'message': f'Deleted {count} order(s).'}, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_items_grouped_by_date(request):
    user = request.user
    is_admin = user.role and user.role.role_name.lower() == 'admin'

    if is_admin:
        order_items = OrderItem.objects.all()
    else:
        order_items = OrderItem.objects.filter(order__created_user=user)
    
    # Filters
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    month = request.query_params.get('month')
    
    if start_date:
        order_items = order_items.filter(added_date__gte=start_date)
    if end_date:
        order_items = order_items.filter(added_date__lte=end_date)
    

    if month:
        try:
            year = int(month[:4])
            month_num = int(month[5:])
            order_items = order_items.filter(added_date__year=year, added_date__month=month_num)
        except (ValueError, IndexError):
            pass
    
    # Pagination params with safe fallback
    try:
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
    except ValueError:
        page, page_size = 1, 10
    
    # Get distinct dates (descending)
    dates = order_items.dates('added_date', 'day').order_by('-added_date')
    total_count = dates.count()
    total_pages = (total_count + page_size - 1) // page_size
    
    start = (page - 1) * page_size
    end = start + page_size
    paginated_dates = dates[start:end]
    
    grouped_data = {}
    grand_total = 0
    
    for date in paginated_dates:
        date_str = date.strftime('%Y-%m-%d')
        items = order_items.filter(added_date__date=date).select_related('item')
        
        date_items = {}
        date_total = 0
        
        for item in items:
            if item.item.id not in date_items:
                date_items[item.item.id] = {
                    'item_id': item.item.id,
                    'item_name': item.item.item_name,
                    'price': float(item.item.item_price),
                    'count': 0,
                    'total': 0
                }
            
            date_items[item.item.id]['count'] += item.count
            item_total = item.count * item.item.item_price
            date_items[item.item.id]['total'] += item_total
            date_total += item_total
        
        grouped_data[date_str] = list(date_items.values())
        grand_total += date_total
    
    return Response({
        'results': grouped_data,
        'total_price': grand_total,
        'total_pages': total_pages,
        'current_page': page
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_dates(request):
    user = request.user
    is_admin = user.role and user.role.role_name.lower() == 'admin'

    if is_admin:
        dates = OrderItem.objects.dates('added_date', 'day').order_by('-added_date')
    else:
        dates = OrderItem.objects.filter(order__created_user=user).dates('added_date', 'day').order_by('-added_date')

    return Response([date.strftime('%Y-%m-%d') for date in dates])
