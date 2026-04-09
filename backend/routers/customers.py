from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from database import get_connection
from models import CustomerCreate, CustomerUpdate
import google_calendar as gcal

router = APIRouter(prefix="/api/customers", tags=["customers"])


def _create_birthday_reminders(conn, customer_id: int, name: str, birth_date: str):
    today = date.today()
    for year in [today.year, today.year + 1]:
        try:
            bd = date.fromisoformat(birth_date).replace(year=year)
        except ValueError:
            continue
        remind_date = bd - timedelta(days=10)
        if remind_date >= today:
            msg = f"{name} doğum günü 10 gün sonra! Hediye önerisi için ara."
            date_str = remind_date.strftime("%Y-%m-%d")
            cur = conn.execute(
                "INSERT INTO reminders (customer_id, reminder_type, scheduled_date, message) VALUES (?,?,?,?)",
                (customer_id, "birthday", date_str, msg),
            )
            event_id = gcal.create_event("birthday", f"{name} — Doğum Günü", msg, date_str, cur.lastrowid)
            if event_id:
                conn.execute("UPDATE reminders SET google_event_id=? WHERE id=?", (event_id, cur.lastrowid))


def _create_anniversary_reminders(conn, customer_id: int, name: str, anniversary_date: str):
    today = date.today()
    for year in [today.year, today.year + 1]:
        try:
            ad = date.fromisoformat(anniversary_date).replace(year=year)
        except ValueError:
            continue
        remind_date = ad - timedelta(days=10)
        if remind_date >= today:
            msg = f"{name} evlilik yıldönümü 10 gün sonra! Hediye önerisi için ara."
            date_str = remind_date.strftime("%Y-%m-%d")
            cur = conn.execute(
                "INSERT INTO reminders (customer_id, reminder_type, scheduled_date, message) VALUES (?,?,?,?)",
                (customer_id, "anniversary", date_str, msg),
            )
            event_id = gcal.create_event("anniversary", f"{name} — Yıldönümü", msg, date_str, cur.lastrowid)
            if event_id:
                conn.execute("UPDATE reminders SET google_event_id=? WHERE id=?", (event_id, cur.lastrowid))


@router.get("/")
def list_customers(q: str = ""):
    conn = get_connection()
    try:
        if q:
            rows = conn.execute(
                "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name",
                (f"%{q}%", f"%{q}%"),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM customers ORDER BY name").fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Müşteriler listelenemedi: {e}")
    finally:
        conn.close()


@router.post("/", status_code=201)
def create_customer(data: CustomerCreate):
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO customers (name, phone, email, birth_date, anniversary_date, notes) VALUES (?,?,?,?,?,?)",
            (data.name, data.phone, data.email, data.birth_date, data.anniversary_date, data.notes),
        )
        customer_id = cur.lastrowid
        if data.birth_date:
            _create_birthday_reminders(conn, customer_id, data.name, data.birth_date)
        if data.anniversary_date:
            _create_anniversary_reminders(conn, customer_id, data.name, data.anniversary_date)
        conn.commit()
        return {"id": customer_id, "message": "Müşteri başarıyla eklendi"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Müşteri eklenemedi: {e}")
    finally:
        conn.close()


@router.get("/{customer_id}")
def get_customer(customer_id: int):
    conn = get_connection()
    try:
        customer = conn.execute("SELECT * FROM customers WHERE id=?", (customer_id,)).fetchone()
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        sales = conn.execute(
            "SELECT * FROM sales WHERE customer_id=? ORDER BY sale_date DESC", (customer_id,)
        ).fetchall()
        reminders = conn.execute(
            "SELECT * FROM reminders WHERE customer_id=? AND is_done=0 ORDER BY scheduled_date",
            (customer_id,),
        ).fetchall()
        return {
            **dict(customer),
            "sales": [dict(s) for s in sales],
            "reminders": [dict(r) for r in reminders],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Müşteri getirilemedi: {e}")
    finally:
        conn.close()


@router.put("/{customer_id}")
def update_customer(customer_id: int, data: CustomerUpdate):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT * FROM customers WHERE id=?", (customer_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        fields = {k: v for k, v in data.model_dump().items() if v is not None}
        if not fields:
            raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
        set_clause = ", ".join(f"{k}=?" for k in fields)
        values = list(fields.values()) + [customer_id]
        conn.execute(f"UPDATE customers SET {set_clause} WHERE id=?", values)
        conn.commit()
        return {"message": "Müşteri güncellendi"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Müşteri güncellenemedi: {e}")
    finally:
        conn.close()


@router.delete("/{customer_id}")
def delete_customer(customer_id: int):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM customers WHERE id=?", (customer_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        conn.execute("DELETE FROM customers WHERE id=?", (customer_id,))
        conn.commit()
        return {"message": "Müşteri silindi"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Müşteri silinemedi: {e}")
    finally:
        conn.close()
