from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'profile_picture', 'created_date', 'updated_date']

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        if obj.profile_picture and request:
            return request.build_absolute_uri(obj.profile_picture.url)
        elif obj.profile_picture:
            return obj.profile_picture.url
        return None

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'
        read_only_fields = ['created_user', 'created_date', 'updated_date']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['created_user'] = user
        return super().create(validated_data)


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
            return obj.bill.url
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
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())  # Accept item ID in input
    added_date = serializers.DateTimeField(
        format="%Y-%m-%dT%H:%M:%S.%fZ",
        input_formats=[
            "%Y-%m-%dT%H:%M:%S.%fZ",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d",
            "iso-8601"
        ]
    )
    order = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'count', 'added_date', 'order']


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, source='orderitem_set')

    class Meta:
        model = Order
        fields = ['id', 'created_user', 'calculated_price', 'created_date', 'order_items']
        read_only_fields = ['created_user', 'calculated_price', 'created_date']


    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')
        user = self.context['request'].user
        order = Order.objects.create(created_user=user, **validated_data)

        total_price = 0
        for item_data in order_items_data:
            item = item_data['item']
            count = item_data['count']
            OrderItem.objects.create(order=order, **item_data)
            total_price += item.item_price * count

        order.calculated_price = total_price
        order.save()

        return order


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

        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        refresh = self.get_token(self.user)
        data.update({
            'user': UserSerializer(self.user, context=self.context).data,
            'role_id': self.user.role.role_name if self.user.role else None
        })
        return data
