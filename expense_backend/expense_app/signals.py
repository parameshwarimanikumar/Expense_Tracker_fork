from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Item, ItemPriceHistory
from django.utils import timezone

@receiver(pre_save, sender=Item)
def track_price_change(sender, instance, **kwargs):
    if instance.pk:
        original = Item.objects.get(pk=instance.pk)
        if original.item_price != instance.item_price:
            ItemPriceHistory.objects.create(
                item=instance,
                price=original.item_price,
                date=timezone.now()
            )