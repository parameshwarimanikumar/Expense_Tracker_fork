# expense_app/utils.py
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def send_realtime_notification(user, message):
    channel_layer = get_channel_layer()
    group_name = f"user_{user.id}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_notification",
            "message": message,
        }
    )
