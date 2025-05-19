from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from django.db import transaction as db_transaction
from django.contrib.auth import logout
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.utils.timezone import datetime,now,make_aware
from datetime import date
import json

from .models import *
from .serializers import *
from .permissions import *


# Authentication View

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny]) 
@parser_classes([MultiPartParser, FormParser])  # ✅ add this
def register_user(request):
    serializer = UserSerializer(data=request.data, files=request.FILES)

    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': serializer.data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    logout(request)
    return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)

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
        expenses = Expense.objects.filter(user=request.user)
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        print(data)
        try:
            with db_transaction.atomic():
            
                expense = Expense.objects.create(
                    user=request.user,
                    date=data.get('date', timezone.now().date()),
                    description=data.get('description', ''),
                    expense_type=data.get('expense_type', 'Product'),
                    bill=data.get('bill'),
                    amount=data.get('amount', 0),
                )

                order = Order.objects.create(
                    created_user=request.user,
                    calculated_price = expense.amount
                    
                    )

                # ✅ Step 3: Create Transaction
                transaction = Transaction.objects.create(
                    user=request.user,
                    total_price=expense.amount,
                    status="Completed" if expense.is_refunded else "Pending",
                    from_date=timezone.now(),
                    to_date=timezone.now()
                )

                # ✅ Step 4: Create TransactionOrder
                TransactionOrder.objects.create(
                    transaction=transaction,
                    expense=expense,
                    order_id=order
                )

                # ✅ Step 5: Create Bill if uploaded
                if 'bill' in request.FILES:
                    Bill.objects.create(expense=expense)

            return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ✅ RETRIEVE, UPDATE & DELETE Expense
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def expense_detail(request, pk):
    try:
        expense = Expense.objects.get(pk=pk, user=request.user)
    except Expense.DoesNotExist:
        return Response({"error": "Expense not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ExpenseSerializer(expense).data)

    elif request.method == 'PUT':
        data = request.data
        try:
            with db_transaction.atomic():
                expense.description = data.get('description', expense.description)
                expense.expense_type = data.get('expense_type', expense.expense_type)
                expense.amount = data.get('amount', expense.amount)
                
                if 'is_verified' in data:
                    expense.is_verified = data['is_verified']
                if 'is_refunded' in data:
                    expense.is_refunded = data['is_refunded']

                expense.save()
                # ✅ Step 2: Find the most recent order or create a new one
                order = Order.objects.filter(created_user=request.user).order_by('-created_date').first()

                if not order:
                    # If no order exists, create a new one
                    order = Order.objects.create(
                        created_user=request.user,
                        calculated_price=expense.amount  # ✅ Ensure calculated_price is set
                    )
                else:
                    # If an order exists, update its price
                    order.calculated_price = expense.amount
                    order.save()

                # ✅ Step 3: Update TransactionOrder
                transaction_order, created = TransactionOrder.objects.get_or_create(
                    expense=expense,
                    defaults={"order_id": order}
                )

                if not created:
                    transaction_order.order_id = order
                    transaction_order.save()

                # ✅ Step 4: Update Transaction
                transaction_obj = transaction_order.transaction if transaction_order else None
                if transaction_obj:
                    transaction_obj.total_price = expense.amount
                    transaction_obj.save()

                return Response(ExpenseSerializer(expense).data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        data = request.data
        order_items = data.get('order_items', [])

        # Step 1: Fetch or create today's order for the user
        today = date.today()
        order = Order.objects.filter(
            created_user=request.user,
            created_date__date=today
        ).first()

        if not order:
            order = Order.objects.create(
                created_user=request.user,
                calculated_price=0
            )

        # Step 2: Prepare key = (item_id, added_date.date()) for existing OrderItems
        existing_order_items = OrderItem.objects.filter(order=order)
        existing_items_map = {
            (oi.item_id, oi.added_date.date()): oi for oi in existing_order_items
        }

        for item_data in order_items:
            item_id = item_data.get('item')
            count = item_data.get('count', 1)

            # Handle added_date
            added_date_str = item_data.get('added_date')
            if added_date_str:
                try:
                    added_datetime = make_aware(datetime.strptime(added_date_str, "%Y-%m-%d"))
                except ValueError:
                    return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
            else:
                added_datetime = now()

            added_date_key = added_datetime.date()
            key = (item_id, added_date_key)

            if key in existing_items_map:
                # Update existing OrderItem's count
                existing_item = existing_items_map[key]
                existing_item.count = count
                existing_item.added_date = added_datetime  # Update date in case of correction
                existing_item.save()
            else:
                # Create new OrderItem
                OrderItem.objects.create(
                    order=order,
                    item_id=item_id,
                    count=count,
                    added_date=added_datetime
                )

        order.update_total_price()

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOwnerOrAdmin])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        order_serializer = OrderSerializer(order)
        order_items = OrderItem.objects.filter(order=order)
        items_serializer = OrderItemSerializer(order_items, many=True)
        
        response_data = order_serializer.data
        response_data['order_items'] = items_serializer.data
        return Response(response_data)
    
#order Item
@csrf_exempt
def order_item_list(request):
    """List all order items or create a new order item."""
    if request.method == "GET":
        order_items = OrderItem.objects.all().values("id", "order", "item", "count", "added_date")
        return JsonResponse(list(order_items), safe=False)

    elif request.method == "POST":
        data = json.loads(request.body)
        order = get_object_or_404(Order, id=data["order"])
        item = get_object_or_404(Item, id=data["item"])
        count = data.get("count", 1)

        order_item = OrderItem.objects.create(order=order, item=item, count=count)
        order.update_total_price() 

        return JsonResponse(
            {
                "id": order_item.id,
                "order": order_item.order.id,
                "item": order_item.item.id,
                "count": order_item.count,
                "added_date": order_item.added_date
            },
            status=201
        )

@csrf_exempt
def order_item_detail(request, pk):
    """Retrieve, update, or delete an order item."""
    order_item = get_object_or_404(OrderItem, id=pk)

    if request.method == "GET":
        return JsonResponse(
            {
                "id": order_item.id,
                "order": order_item.order.id,
                "item": order_item.item.id,
                "count": order_item.count,
                "added_date": order_item.added_date
            }
        )

    elif request.method == "PUT":
        data = json.loads(request.body)
        order_item.count = data.get("count", order_item.count)
        order_item.save()

        order_item.order.update_total_price()  # Update Order total price

        return JsonResponse(
            {
                "id": order_item.id,
                "order": order_item.order.id,
                "item": order_item.item.id,
                "count": order_item.count,
                "added_date": order_item.added_date
            }
        )

    elif request.method == "DELETE":
        order = order_item.order
        order_item.delete()
        order.update_total_price()  # Update Order total price
        return JsonResponse({"message": "OrderItem deleted"}, status=204)
    
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





