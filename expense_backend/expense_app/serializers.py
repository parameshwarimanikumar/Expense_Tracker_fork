from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.hashers import make_password
from rest_framework.exceptions import AuthenticationFailed


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'created_date', 'updated_date']
    
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'


class ItemPriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemPriceHistory
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    bill_url = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = [
            'id', 'user', 'date', 'description', 'expense_type',
            'bill', 'bill_url', 'amount', 'is_verified', 'is_refunded',
            'created_date', 'updated_date'
        ]
        read_only_fields = [
            'user', 'is_verified', 'is_refunded', 'created_date', 'updated_date'
        ]

    def get_bill_url(self, obj):
        request = self.context.get('request')
        if obj.bill and request:
            return request.build_absolute_uri(obj.bill.url)
        elif obj.bill:
            return obj.bill.url  # fallback: relative URL if no request
        return None

    def update(self, instance, validated_data):
        user = self.context['request'].user
        if 'is_verified' in validated_data or 'is_refunded' in validated_data:
            if not user.role or user.role.role_name.lower() != 'admin':
                raise serializers.ValidationError({'error': 'Only admin can update verification status'})
        return super().update(instance, validated_data)


class BillSerializer(serializers.ModelSerializer):
    bill_url = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = ['id', 'user', 'file', 'uploaded_date', 'bill_url']
        read_only_fields = ['uploaded_date', 'user']

    def get_bill_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        elif obj.file:
            return obj.file.url
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    added_date = serializers.DateTimeField(
        format="%Y-%m-%dT%H:%M:%S.%fZ",
        input_formats=[
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d",
            "iso-8601"  # Fallback that lets DRF parse default ISO strings
        ]
    )
    order = serializers.PrimaryKeyRelatedField(read_only=True)  # returns only order ID

    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'count', 'added_date', 'order']


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'created_user', 'calculated_price', 'created_date', 'order_items']
        read_only_fields = ['created_user', 'calculated_price', 'created_date']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['user', 'created_date']


class TransactionOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionOrder
        fields = '__all__'
        read_only_fields = ['created_date']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['user', 'created_date']


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get('email', '')
        if not email or '@' not in email:
            raise serializers.ValidationError({"email": "Valid email is required."})

        # Default validation (checks password + active user)
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        # Add custom claims
        refresh = self.get_token(self.user)
        data.update({
            'user': UserSerializer(self.user).data,
            'role_id': self.user.role.role_name if self.user.role else None
        })
        return data