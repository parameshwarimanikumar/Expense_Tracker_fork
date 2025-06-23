from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Item, ItemPriceHistory

@receiver(pre_save, sender=Item)
def track_price_change(sender, instance, **kwargs):
    if not instance.pk:
        return  # new item, skip

    try:
        original = Item.objects.get(pk=instance.pk)
    except Item.DoesNotExist:
        return

    if original.item_price != instance.item_price:
        ItemPriceHistory.objects.create(
            item=instance,
            price=original.item_price,  # ✅ use correct field name
            date=timezone.now()         # ✅ use correct field name
        )
