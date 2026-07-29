from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
import app.models as models
from app.models import User, Driver, Equipment, Customer, Invoice
from app.auth import get_password_hash
from app.api.v1 import auth as auth_router
from app.api.v1 import users as users_router
from app.api.v1 import loads as loads_router
from app.api.v1 import drivers as drivers_router
from app.api.v1 import fleet as fleet_router
from app.api.v1 import customers as customers_router
from app.api.v1 import invoices as invoices_router

# Create database tables automatically
Base.metadata.create_all(bind=engine)

# Seed default database accounts if table is empty
def seed_default_data():
    db: Session = SessionLocal()
    try:
        if db.query(User).count() == 0:
            # 1. Admin Account
            admin = User(
                id="usr-admin",
                tenant_id="tenant-nune-express",
                email="admin@nuneexpress.com",
                username="admin",
                name="Nune Harutyunyan (Admin)",
                hashed_password=get_password_hash("admin123"),
                role_name="Admin",
                is_owner=True,
                is_active=True,
                expiration_date=None, # Never expires
            )
            # 2. Dispatcher Account
            dispatcher = User(
                id="usr-dispatcher",
                tenant_id="tenant-nune-express",
                email="marcus@nuneexpress.com",
                username="marcus",
                name="Marcus Vance",
                hashed_password=get_password_hash("dispatcher123"),
                role_name="Dispatcher/User",
                is_owner=False,
                is_active=True,
                expiration_date=None,
            )
            # 3. User expiring in 4 days (to test 7-day last-week alert banner!)
            expiring_user = User(
                id="usr-expiring",
                tenant_id="tenant-nune-express",
                email="david.miller@nuneexpress.com",
                username="dmiller",
                name="David Miller",
                hashed_password=get_password_hash("driver123"),
                role_name="Dispatcher/User",
                is_owner=False,
                is_active=True,
                expiration_date=datetime.utcnow() + timedelta(days=4), # Expiring in 4 days!
            )
            db.add_all([admin, dispatcher, expiring_user])
            
        if db.query(Driver).count() == 0:
            d1 = Driver(id="drv-1", tenant_id="tenant-nune-express", name="John Doe", email="john@example.com")
            d2 = Driver(id="drv-2", tenant_id="tenant-nune-express", name="Jane Smith", email="jane@example.com")
            d3 = Driver(id="drv-3", tenant_id="tenant-nune-express", name="Bob Wilson", email="bob@example.com")
            db.add_all([d1, d2, d3])
            
        if db.query(Equipment).count() == 0:
            e1 = Equipment(id="eq-1", tenant_id="tenant-nune-express", unit_number="T-101", type="TRUCK")
            e2 = Equipment(id="eq-2", tenant_id="tenant-nune-express", unit_number="T-102", type="TRUCK")
            e3 = Equipment(id="eq-3", tenant_id="tenant-nune-express", unit_number="TR-201", type="TRAILER")
            e4 = Equipment(id="eq-4", tenant_id="tenant-nune-express", unit_number="TR-202", type="TRAILER")
            db.add_all([e1, e2, e3, e4])
            
        if db.query(Customer).count() == 0:
            c1 = Customer(id="cust-1", tenant_id="tenant-nune-express", name="C.H. Robinson")
            c2 = Customer(id="cust-2", tenant_id="tenant-nune-express", name="Echo Global")
            c3 = Customer(id="cust-3", tenant_id="tenant-nune-express", name="XPO")
            db.add_all([c1, c2, c3])

        db.commit()
        print("Database seeded successfully!")
    finally:
        db.close()

seed_default_data()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Multi-tenant role-based backend API for Nune Express TMS with JWT Auth & User Expiration System"
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix=settings.API_V1_STR)
app.include_router(users_router.router, prefix=settings.API_V1_STR)
app.include_router(loads_router.router, prefix=settings.API_V1_STR)
app.include_router(drivers_router.router, prefix=settings.API_V1_STR)
app.include_router(fleet_router.router, prefix=settings.API_V1_STR)
app.include_router(customers_router.router, prefix=settings.API_V1_STR)
app.include_router(invoices_router.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "system": "Nune Express TMS Backend API",
        "version": "1.0.0",
        "tenant": "Nune Express LLC",
        "status": "Operational",
        "database": settings.DATABASE_URL.split("://")[0],
        "docs": "/docs"
    }

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
