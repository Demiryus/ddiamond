from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date, timedelta
from database import get_connection
from notifications import send_reminder_notification

scheduler = BackgroundScheduler()


def check_and_notify():
    today = date.today().strftime("%Y-%m-%d")
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM reminders WHERE scheduled_date = ? AND is_done = 0", (today,)
        ).fetchall()
        for row in rows:
            send_reminder_notification(row["reminder_type"], row["message"])
    except Exception as e:
        print(f"Bildirim kontrolü sırasında hata: {e}")
    finally:
        conn.close()


def refresh_holiday_reminders():
    today = date.today()
    conn = get_connection()
    try:
        holidays = conn.execute(
            "SELECT * FROM holidays WHERE is_recurring = 1"
        ).fetchall()
        customers = conn.execute("SELECT id, name FROM customers").fetchall()

        for holiday in holidays:
            try:
                hdate = date.fromisoformat(holiday["date"]).replace(year=today.year)
            except (ValueError, TypeError):
                continue
            remind_date = hdate - timedelta(days=10)
            if remind_date < today:
                try:
                    hdate = hdate.replace(year=today.year + 1)
                    remind_date = hdate - timedelta(days=10)
                except ValueError:
                    continue

            for customer in customers:
                existing = conn.execute(
                    """SELECT id FROM reminders
                       WHERE customer_id=? AND reminder_type='holiday' AND scheduled_date=?""",
                    (customer["id"], remind_date.strftime("%Y-%m-%d")),
                ).fetchone()
                if not existing:
                    conn.execute(
                        "INSERT INTO reminders (customer_id, reminder_type, scheduled_date, message) VALUES (?,?,?,?)",
                        (
                            customer["id"],
                            "holiday",
                            remind_date.strftime("%Y-%m-%d"),
                            f"{holiday['name']} yaklaşıyor! {customer['name']} için kampanya hazırla.",
                        ),
                    )
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Tatil hatırlatıcıları yenilenirken hata: {e}")
    finally:
        conn.close()


def start_scheduler():
    scheduler.add_job(check_and_notify, "cron", hour=9, minute=0, id="daily_notify")
    scheduler.add_job(refresh_holiday_reminders, "cron", month=1, day=15, id="holiday_refresh")
    scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
