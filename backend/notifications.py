from plyer import notification

TITLES = {
    "satisfaction_call": "Memnuniyet Araması",
    "product_suggestion": "Yeni Ürün Önerisi",
    "birthday": "Doğum Günü Yaklaşıyor",
    "anniversary": "Yıldönümü Yaklaşıyor",
    "holiday": "Özel Gün Kampanyası",
}


def send_desktop_notification(title: str, message: str):
    try:
        notification.notify(
            title=f"💎 D Diamond — {title}",
            message=message,
            app_name="D Diamond CRM",
            timeout=10,
        )
    except Exception as e:
        print(f"Bildirim gönderilemedi: {e}")


def send_reminder_notification(reminder_type: str, message: str):
    title = TITLES.get(reminder_type, "Hatırlatıcı")
    send_desktop_notification(title, message)
