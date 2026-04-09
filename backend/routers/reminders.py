from fastapi import APIRouter, HTTPException
from datetime import date, timedelta
from database import get_connection

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("/today")
def get_today_reminders():
    conn = get_connection()
    try:
        today = date.today().strftime("%Y-%m-%d")
        rows = conn.execute(
            """SELECT r.*, c.name as customer_name, c.phone as customer_phone
               FROM reminders r
               LEFT JOIN customers c ON r.customer_id = c.id
               WHERE r.scheduled_date = ? AND r.is_done = 0
               ORDER BY r.reminder_type""",
            (today,),
        ).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bugünkü hatırlatıcılar getirilemedi: {e}")
    finally:
        conn.close()


@router.get("/")
def list_reminders(days: int = None, reminder_type: str = None, show_done: bool = False):
    conn = get_connection()
    try:
        query = """SELECT r.*, c.name as customer_name, c.phone as customer_phone
                   FROM reminders r
                   LEFT JOIN customers c ON r.customer_id = c.id
                   WHERE 1=1"""
        params = []
        if not show_done:
            query += " AND r.is_done = 0"
        if days:
            end_date = (date.today() + timedelta(days=days)).strftime("%Y-%m-%d")
            today = date.today().strftime("%Y-%m-%d")
            query += " AND r.scheduled_date BETWEEN ? AND ?"
            params += [today, end_date]
        if reminder_type:
            query += " AND r.reminder_type = ?"
            params.append(reminder_type)
        query += " ORDER BY r.scheduled_date"
        rows = conn.execute(query, params).fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hatırlatıcılar listelenemedi: {e}")
    finally:
        conn.close()


@router.put("/{reminder_id}/done")
def mark_done(reminder_id: int):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM reminders WHERE id=?", (reminder_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")
        conn.execute("UPDATE reminders SET is_done=1 WHERE id=?", (reminder_id,))
        conn.commit()
        return {"message": "Hatırlatıcı tamamlandı olarak işaretlendi"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Hatırlatıcı güncellenemedi: {e}")
    finally:
        conn.close()


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: int):
    conn = get_connection()
    try:
        existing = conn.execute("SELECT id FROM reminders WHERE id=?", (reminder_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")
        conn.execute("DELETE FROM reminders WHERE id=?", (reminder_id,))
        conn.commit()
        return {"message": "Hatırlatıcı silindi"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Hatırlatıcı silinemedi: {e}")
    finally:
        conn.close()
