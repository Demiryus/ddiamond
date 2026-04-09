import sqlite3
import os
from pathlib import Path
from datetime import date, timedelta

# Render/cloud ortamında DATA_DIR env var'ı yoksa proje dizinini kullan
# Masaüstü kurulumunda ~/Documents/DDiamond/ kullanılır
_data_dir = os.environ.get("DATA_DIR")
if _data_dir:
    DB_DIR = Path(_data_dir)
else:
    # Masaüstü: Documents klasörü; Cloud: proje dizini
    try:
        _docs = Path.home() / "Documents" / "DDiamond"
        _docs.mkdir(parents=True, exist_ok=True)
        DB_DIR = _docs
    except Exception:
        DB_DIR = Path(__file__).parent
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = str(DB_DIR / "ddiamond.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_connection()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            birth_date TEXT,
            anniversary_date TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (date('now'))
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            product_category TEXT,
            price REAL,
            sale_date TEXT,
            notes TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            sale_id INTEGER,
            reminder_type TEXT,
            scheduled_date TEXT,
            message TEXT,
            is_done INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (date('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS holidays (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            date TEXT,
            holiday_type TEXT,
            is_recurring INTEGER DEFAULT 1
        )
    """)

    conn.commit()
    _seed_holidays(conn)
    conn.close()


def _get_mothers_day(year: int) -> date:
    """Mayısın ikinci Pazarı"""
    d = date(year, 5, 1)
    sundays = 0
    while sundays < 2:
        if d.weekday() == 6:
            sundays += 1
        if sundays < 2:
            d += timedelta(days=1)
    return d


def _get_fathers_day(year: int) -> date:
    """Haziran üçüncü Pazarı"""
    d = date(year, 6, 1)
    sundays = 0
    while sundays < 3:
        if d.weekday() == 6:
            sundays += 1
        if sundays < 3:
            d += timedelta(days=1)
    return d


def _seed_holidays(conn: sqlite3.Connection):
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM holidays")
    if c.fetchone()[0] > 0:
        return

    years = [date.today().year, date.today().year + 1]
    holidays = []

    for year in years:
        holidays += [
            ("Yılbaşı", f"{year}-01-01", "national", 1),
            ("Sevgililer Günü", f"{year}-02-14", "jewelry_special", 1),
            ("8 Mart Dünya Kadınlar Günü", f"{year}-03-08", "jewelry_special", 1),
            ("Anneler Günü", _get_mothers_day(year).strftime("%Y-%m-%d"), "jewelry_special", 1),
            ("Babalar Günü", _get_fathers_day(year).strftime("%Y-%m-%d"), "jewelry_special", 1),
        ]

    # Ramazan ve Kurban bayramları kullanıcı tarafından manuel girilir
    holidays += [
        ("Ramazan Bayramı", f"{date.today().year}-03-30", "national", 0),
        ("Kurban Bayramı", f"{date.today().year}-06-06", "national", 0),
    ]

    c.executemany(
        "INSERT INTO holidays (name, date, holiday_type, is_recurring) VALUES (?,?,?,?)",
        holidays,
    )
    conn.commit()
