from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from database import get_connection

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats():
    conn = get_connection()
    try:
        today = date.today()
        month_start = today.replace(day=1).strftime("%Y-%m-%d")
        today_str = today.strftime("%Y-%m-%d")
        week_end = (today + timedelta(days=7)).strftime("%Y-%m-%d")

        total_customers = conn.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
        sales_this_month = conn.execute(
            "SELECT COUNT(*) FROM sales WHERE sale_date >= ?", (month_start,)
        ).fetchone()[0]
        pending_reminders = conn.execute(
            "SELECT COUNT(*) FROM reminders WHERE is_done=0 AND scheduled_date = ?", (today_str,)
        ).fetchone()[0]

        # Yaklaşan doğum günleri (7 gün içinde) - ay/gün karşılaştırması
        upcoming_birthdays = 0
        customers = conn.execute("SELECT name, birth_date FROM customers WHERE birth_date IS NOT NULL").fetchall()
        for c in customers:
            try:
                bd = date.fromisoformat(c["birth_date"]).replace(year=today.year)
                if today <= bd <= today + timedelta(days=7):
                    upcoming_birthdays += 1
            except (ValueError, TypeError):
                pass

        return {
            "total_customers": total_customers,
            "sales_this_month": sales_this_month,
            "pending_reminders": pending_reminders,
            "upcoming_birthdays": upcoming_birthdays,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"İstatistikler alınamadı: {e}")
    finally:
        conn.close()


@router.get("/calendar")
def get_calendar(month: str):
    conn = get_connection()
    try:
        year, mon = map(int, month.split("-"))
        month_start = f"{year}-{mon:02d}-01"
        if mon == 12:
            month_end = f"{year + 1}-01-01"
        else:
            month_end = f"{year}-{mon + 1:02d}-01"

        rows = conn.execute(
            """SELECT r.*, c.name as customer_name
               FROM reminders r
               LEFT JOIN customers c ON r.customer_id = c.id
               WHERE r.scheduled_date >= ? AND r.scheduled_date < ?
               ORDER BY r.scheduled_date""",
            (month_start, month_end),
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Takvim verisi alınamadı: {e}")
    finally:
        conn.close()


@router.get("/recent-sales")
def get_recent_sales():
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT s.*, c.name as customer_name
               FROM sales s JOIN customers c ON s.customer_id=c.id
               ORDER BY s.sale_date DESC LIMIT 5"""
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Son satışlar alınamadı: {e}")
    finally:
        conn.close()
