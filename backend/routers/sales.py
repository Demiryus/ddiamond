from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from database import get_connection
from models import SaleCreate
import google_calendar as gcal

router = APIRouter(prefix="/api/sales", tags=["sales"])


def _create_sale_reminders(conn, sale_id: int, customer_id: int, customer_name: str, product_name: str, sale_date: str):
    base = date.fromisoformat(sale_date)
    items = [
        (
            customer_id, sale_id, "satisfaction_call",
            (base + timedelta(days=7)).strftime("%Y-%m-%d"),
            f"{customer_name} — {product_name} aldı. Memnuniyet araması yap.",
            f"{customer_name} — Memnuniyet Araması",
        ),
        (
            customer_id, sale_id, "product_suggestion",
            (base + timedelta(days=90)).strftime("%Y-%m-%d"),
            f"{customer_name} — 3 ay önce {product_name} almıştı. Yeni ürün öner.",
            f"{customer_name} — Ürün Önerisi",
        ),
    ]
    for customer_id_, sale_id_, rtype, date_str, msg, cal_title in items:
        cur = conn.execute(
            "INSERT INTO reminders (customer_id, sale_id, reminder_type, scheduled_date, message) VALUES (?,?,?,?,?)",
            (customer_id_, sale_id_, rtype, date_str, msg),
        )
        event_id = gcal.create_event(rtype, cal_title, msg, date_str, cur.lastrowid)
        if event_id:
            conn.execute("UPDATE reminders SET google_event_id=? WHERE id=?", (event_id, cur.lastrowid))


@router.get("/")
def list_sales(customer_id: int = None, days: int = None):
    conn = get_connection()
    try:
        query = """
            SELECT s.*, c.name as customer_name
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
        """
        params = []
        conditions = []
        if customer_id:
            conditions.append("s.customer_id = ?")
            params.append(customer_id)
        if days:
            since = (date.today() - timedelta(days=days)).strftime("%Y-%m-%d")
            conditions.append("s.sale_date >= ?")
            params.append(since)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY s.sale_date DESC"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satışlar listelenemedi: {e}")
    finally:
        conn.close()


@router.post("/", status_code=201)
def create_sale(data: SaleCreate):
    conn = get_connection()
    try:
        customer = conn.execute("SELECT * FROM customers WHERE id=?", (data.customer_id,)).fetchone()
        if not customer:
            raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
        sale_date = data.sale_date or date.today().strftime("%Y-%m-%d")
        cur = conn.execute(
            "INSERT INTO sales (customer_id, product_name, product_category, price, sale_date, notes) VALUES (?,?,?,?,?,?)",
            (data.customer_id, data.product_name, data.product_category, data.price, sale_date, data.notes),
        )
        sale_id = cur.lastrowid
        _create_sale_reminders(conn, sale_id, data.customer_id, customer["name"], data.product_name, sale_date)
        conn.commit()
        return {"id": sale_id, "message": "Satış başarıyla eklendi ve hatırlatıcılar oluşturuldu"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Satış eklenemedi: {e}")
    finally:
        conn.close()


@router.get("/{sale_id}")
def get_sale(sale_id: int):
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT s.*, c.name as customer_name FROM sales s JOIN customers c ON s.customer_id=c.id WHERE s.id=?",
            (sale_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Satış bulunamadı")
        return dict(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Satış getirilemedi: {e}")
    finally:
        conn.close()


@router.delete("/{sale_id}")
def delete_sale(sale_id: int):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM sales WHERE id=?", (sale_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Satış bulunamadı")
        conn.execute("DELETE FROM sales WHERE id=?", (sale_id,))
        conn.commit()
        return {"message": "Satış silindi"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Satış silinemedi: {e}")
    finally:
        conn.close()
