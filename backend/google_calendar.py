"""
Google Calendar entegrasyonu — Service Account ile paylaşımlı takım takvimi.

Kurulum:
1. Google Cloud Console'da proje oluştur
2. Google Calendar API'yi etkinleştir
3. Service Account oluştur → JSON key indir
4. .env dosyasına GOOGLE_CREDENTIALS_PATH ve GOOGLE_CALENDAR_ID ekle
5. Google Calendar'da takvimi ekiple paylaş (service account e-postasına Editor yetkisi ver)
"""

import os
import json
from datetime import datetime, timedelta

# Credentials yoksa sessizce devre dışı kal
_service = None
CALENDAR_ID = os.environ.get("GOOGLE_CALENDAR_ID", "")
CREDENTIALS_PATH = os.environ.get("GOOGLE_CREDENTIALS_PATH", "")


def _get_service():
    global _service
    if _service is not None:
        return _service
    if not CREDENTIALS_PATH or not CALENDAR_ID:
        return None
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_PATH,
            scopes=["https://www.googleapis.com/auth/calendar"],
        )
        _service = build("googleapiclient", "v1", credentials=creds, serviceName="calendar")
        return _service
    except Exception as e:
        print(f"[Google Calendar] Bağlantı kurulamadı: {e}")
        return None


TYPE_COLORS = {
    "satisfaction_call": "7",   # Peacock (mavi)
    "product_suggestion": "3",  # Grape (mor)
    "birthday": "4",            # Flamingo (pembe)
    "anniversary": "11",        # Tomato (kırmızı)
    "holiday": "5",             # Banana (sarı)
}


def create_event(
    reminder_type: str,
    title: str,
    description: str,
    date_str: str,          # YYYY-MM-DD
    reminder_id: int = None,
) -> str | None:
    """
    Google Calendar'da günlük etkinlik oluşturur.
    Başarılı olursa event_id döner, hata/devre dışıysa None.
    """
    service = _get_service()
    if not service:
        return None
    try:
        event = {
            "summary": f"💎 {title}",
            "description": description,
            "start": {"date": date_str},
            "end": {"date": date_str},
            "colorId": TYPE_COLORS.get(reminder_type, "1"),
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": 540},   # 09:00
                    {"method": "email", "minutes": 1440},  # 1 gün önce
                ],
            },
            "extendedProperties": {
                "private": {
                    "ddiamond_reminder_id": str(reminder_id or ""),
                    "reminder_type": reminder_type,
                }
            },
        }
        result = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
        print(f"[Google Calendar] Etkinlik oluşturuldu: {result['id']}")
        return result["id"]
    except Exception as e:
        print(f"[Google Calendar] Etkinlik oluşturulamadı: {e}")
        return None


def delete_event(event_id: str) -> bool:
    """Google Calendar'dan etkinliği siler."""
    if not event_id:
        return False
    service = _get_service()
    if not service:
        return False
    try:
        service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
        print(f"[Google Calendar] Etkinlik silindi: {event_id}")
        return True
    except Exception as e:
        print(f"[Google Calendar] Etkinlik silinemedi: {e}")
        return False


def update_event_done(event_id: str) -> bool:
    """Tamamlanan hatırlatıcının başlığına ✅ ekler."""
    if not event_id:
        return False
    service = _get_service()
    if not service:
        return False
    try:
        event = service.events().get(calendarId=CALENDAR_ID, eventId=event_id).execute()
        if not event["summary"].startswith("✅"):
            event["summary"] = "✅ " + event["summary"]
        service.events().update(calendarId=CALENDAR_ID, eventId=event_id, body=event).execute()
        return True
    except Exception as e:
        print(f"[Google Calendar] Etkinlik güncellenemedi: {e}")
        return False


def is_enabled() -> bool:
    return bool(CREDENTIALS_PATH and CALENDAR_ID)
