import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

models_content = """import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum, Index
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class LoadStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    BOOKED = "BOOKED"
    ASSIGNED = "ASSIGNED"
    DISPATCHED = "DISPATCHED"
    AT_PICKUP = "AT_PICKUP"
    LOADED = "LOADED"
    IN_TRANSIT = "IN_TRANSIT"
    AT_DELIVERY = "AT_DELIVERY"
    DELIVERED = "DELIVERED"
    INVOICED = "INVOICED"
    FACTORED = "FACTORED"
    PAID = "PAID"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    ON_HOLD = "ON_HOLD"

class MultiTenantMixin:
    tenant_id = Column(String(64), nullable=False, index=True)

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class User(Base, MultiTenantMixin):
    __tablename__ = "users"
    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(128), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_name = Column(String(64), nullable=False, default="Dispatcher/User")
    is_owner = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    expiration_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Role(Base, MultiTenantMixin):
    __tablename__ = "roles"
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_system_owner = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Load(Base, MultiTenantMixin):
    __tablename__ = "loads"
    id = Column(String(64), primary_key=True)
    load_number = Column(String(64), nullable=False, index=True)
    status = Column(Enum(LoadStatusEnum), default=LoadStatusEnum.BOOKED, nullable=False)
    broker_id = Column(String(64), nullable=False)
    broker_name = Column(String(255), nullable=False)
    broker_reference = Column(String(128), nullable=True)
    rate_minor = Column(Integer, nullable=False)
    currency = Column(String(3), default="USD")
    driver_id = Column(String(64), nullable=True)
    driver_name = Column(String(255), nullable=True)
    truck_number = Column(String(64), nullable=True)
    trailer_number = Column(String(64), nullable=True)
    loaded_miles = Column(Integer, default=0)
    deadhead_miles = Column(Integer, default=0)
    
    origin_city = Column(String(128), nullable=True)
    origin_state = Column(String(128), nullable=True)
    dest_city = Column(String(128), nullable=True)
    dest_state = Column(String(128), nullable=True)
    pickup_date = Column(DateTime, nullable=True)
    delivery_date = Column(DateTime, nullable=True)
    fuel_surcharge_minor = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    stops = relationship("LoadStop", back_populates="load", cascade="all, delete-orphan")
    accessorials = relationship("Accessorial", back_populates="load", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_loads_tenant_status", "tenant_id", "status"),
    )

class LoadStop(Base, MultiTenantMixin):
    __tablename__ = "load_stops"
    id = Column(String(64), primary_key=True)
    load_id = Column(String(64), ForeignKey("loads.id"), nullable=False)
    sequence = Column(Integer, nullable=False)
    type = Column(String(32), nullable=False)
    facility_name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(128), nullable=False)
    state = Column(String(32), nullable=False)
    appointment_window_start = Column(DateTime, nullable=False)
    appointment_window_end = Column(DateTime, nullable=False)
    arrived_at = Column(DateTime, nullable=True)
    departed_at = Column(DateTime, nullable=True)
    load = relationship("Load", back_populates="stops")

class Accessorial(Base, MultiTenantMixin):
    __tablename__ = "accessorials"
    id = Column(String(64), primary_key=True)
    load_id = Column(String(64), ForeignKey("loads.id"), nullable=False)
    type = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    billable_amount_minor = Column(Integer, nullable=False)
    payable_amount_minor = Column(Integer, nullable=False)
    approved = Column(Boolean, default=True)
    waived = Column(Boolean, default=False)
    load = relationship("Load", back_populates="accessorials")

class AuditLog(Base, MultiTenantMixin):
    __tablename__ = "audit_logs"
    id = Column(String(64), primary_key=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    actor_name = Column(String(255), nullable=False)
    actor_email = Column(String(255), nullable=False)
    action = Column(String(128), nullable=False)
    entity_type = Column(String(128), nullable=False)
    entity_id = Column(String(64), nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String(64), nullable=False)
    __table_args__ = (
        Index("idx_audit_tenant_timestamp", "tenant_id", "timestamp"),
    )

class Driver(Base, MultiTenantMixin):
    __tablename__ = "drivers"
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)
    address = Column(String(512), nullable=True)
    employment_type = Column(String(32), default="COMPANY_DRIVER")
    assigned_truck_id = Column(String(64), nullable=True)
    assigned_truck_number = Column(String(64), nullable=True)
    cdl_number = Column(String(128), nullable=True)
    cdl_class = Column(String(8), nullable=True)
    cdl_expiration = Column(DateTime, nullable=True)
    medical_card_expiration = Column(DateTime, nullable=True)
    status = Column(String(32), default="AVAILABLE")
    pay_rate_type = Column(String(32), default="PER_MILE")
    pay_rate_minor = Column(Integer, default=65)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Equipment(Base, MultiTenantMixin):
    __tablename__ = "equipment"
    id = Column(String(64), primary_key=True)
    unit_number = Column(String(64), nullable=False, index=True)
    type = Column(String(32), default="TRUCK")
    vin = Column(String(64), nullable=True)
    make_model = Column(String(255), nullable=True)
    year = Column(Integer, nullable=True)
    license_plate = Column(String(64), nullable=True)
    odometer_miles = Column(Integer, nullable=True)
    inspection_due_date = Column(DateTime, nullable=True)
    status = Column(String(32), default="ACTIVE")
    assigned_driver_id = Column(String(64), nullable=True)
    assigned_driver_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Customer(Base, MultiTenantMixin):
    __tablename__ = "customers"
    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    mc_number = Column(String(64), nullable=True)
    dot_number = Column(String(64), nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(64), nullable=True)
    billing_address = Column(String(512), nullable=True)
    city = Column(String(128), nullable=True)
    state = Column(String(32), nullable=True)
    zip = Column(String(16), nullable=True)
    payment_terms_days = Column(Integer, default=30)
    credit_limit_minor = Column(Integer, default=0)
    average_days_to_pay = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Invoice(Base, MultiTenantMixin):
    __tablename__ = "invoices"
    id = Column(String(64), primary_key=True)
    invoice_number = Column(String(64), nullable=False, unique=True, index=True)
    load_id = Column(String(64), nullable=True)
    load_number = Column(String(64), nullable=True)
    customer_id = Column(String(64), nullable=True)
    customer_name = Column(String(255), nullable=False)
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    subtotal_minor = Column(Integer, nullable=False)
    accessorials_minor = Column(Integer, default=0)
    total_minor = Column(Integer, nullable=False)
    status = Column(String(32), default="ISSUED")
    driver_pay_minor = Column(Integer, nullable=True)
    driver_settlement_status = Column(String(32), nullable=True)
    paid_amount_minor = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
"""

write_file(r"c:\Users\saeed\PycharmProjects\Nune_Express_LLC\app\models.py", models_content)

print("Generated models.py")
