from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.dispatch import receiver
from django.db.models.signals import post_save, pre_save,post_delete
from django.db.models import Sum,F
import os


def get_upload_path(instance, filename):
    return f'bills/user_{instance.user_id}/{filename}'

#Role

class Role(models.Model):
    role_name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.role_name

#User
class User(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)  # ✅ Add this line
    created_date = models.DateTimeField(default=timezone.now)
    updated_date = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

#Category

class Category(models.Model):
    category_name = models.CharField(max_length=100)
    created_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_date = models.DateTimeField(default=timezone.now)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.category_name

#Item

class Item(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    created_user = models.ForeignKey(User, on_delete=models.CASCADE)
    item_name = models.CharField(max_length=100)
    item_price = models.FloatField()
    created_date = models.DateTimeField(default=timezone.now)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.item_name

class ItemPriceHistory(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    price = models.FloatField()
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.item.item_name} - {self.price} on {self.date}"

#Order

class Order(models.Model):
    created_user = models.ForeignKey(User, on_delete=models.CASCADE)
    calculated_price = models.FloatField()
    created_date = models.DateTimeField(default=timezone.now)
    updated_date = models.DateTimeField(auto_now=True)

    def update_total_price(self):
        total_price = sum(order_item.item.item_price * order_item.count for order_item in self.orderitem_set.all())
        print("total Price ", total_price)
        self.calculated_price = total_price
        self.save()

    def __str__(self):
        return f"Order #{self.id} by {self.created_user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    count = models.IntegerField(default=1)
    added_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.count}x {self.item.item_name} in Order #{self.order.id}"
    
@receiver(post_save, sender=OrderItem)
@receiver(post_delete, sender=OrderItem)
def update_order_total(sender, instance, **kwargs):
    """Update order total price when an order item is modified."""
    instance.order.update_total_price()

#Expense

class Expense(models.Model):
    EXPENSE_TYPE_CHOICES = [
        ("Product", "Product"),
        ("Travel", "Travel"),
        ("Food", "Food"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    expense_type = models.CharField(max_length=100, choices=EXPENSE_TYPE_CHOICES, default='Product')  # Example default
    bill = models.FileField(upload_to=get_upload_path, blank=True, null=True)
    amount = models.FloatField(default=0)
    is_verified = models.BooleanField(default=False)
    is_refunded = models.BooleanField(default=False)
    created_date = models.DateTimeField(default=timezone.now)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.id} - {self.user.username} - {self.description}"
    
#Bills

class Bill(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='bills')
    uploaded_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Bill for {self.expense}"

#Transactions
class Transaction(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = 'Pending', 'pending'
        COMPLETED = 'Completed', 'completed'

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,related_name='transactions')
    total_price = models.FloatField()
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    from_date = models.DateTimeField()
    to_date = models.DateTimeField()
    remarks = models.TextField(max_length=255,null=True,blank=True)
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transaction #{self.id} - {self.status}"

class TransactionOrder(models.Model):
    transaction = models.ForeignKey(Transaction,on_delete=models.CASCADE, related_name='transaction_orders')
    expense = models.ForeignKey(Expense,on_delete=models.CASCADE,null=True,blank=True)
    order_id = models.ForeignKey(Order,on_delete=models.CASCADE,null=True,blank=True) 
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction} - {self.expense or self.order}"

#Notifications

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_notifications')
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification to {self.recipient.username}: {self.message[:20]}..."
    


# @receiver(pre_save, sender=Item)
# def track_price_change(sender, instance, **kwargs):
#     if instance.pk:
#         original = Item.objects.get(pk=instance.pk)
#         if original.item_price != instance.item_price:
#             ItemPriceHistory.objects.create(
#                 item=instance,
#                 price=original.item_price,
#                 date=timezone.now()
#             )
