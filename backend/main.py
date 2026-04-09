from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db
from scheduler import start_scheduler, stop_scheduler
from routers.customers import router as customers_router
from routers.sales import router as sales_router
from routers.reminders import router as reminders_router
from routers.dashboard import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="D Diamond CRM", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Netlify ve diğer deploy URL'leri için
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers_router)
app.include_router(sales_router)
app.include_router(reminders_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {"status": "D Diamond CRM çalışıyor"}
