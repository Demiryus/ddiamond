from pydantic import BaseModel
from typing import Optional


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[str] = None
    anniversary_date: Optional[str] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[str] = None
    anniversary_date: Optional[str] = None
    notes: Optional[str] = None


class SaleCreate(BaseModel):
    customer_id: int
    product_name: str
    product_category: Optional[str] = None
    price: Optional[float] = None
    sale_date: Optional[str] = None
    notes: Optional[str] = None


class ReminderCreate(BaseModel):
    customer_id: Optional[int] = None
    sale_id: Optional[int] = None
    reminder_type: Optional[str] = None
    scheduled_date: str
    message: str
