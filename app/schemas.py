from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserBase(BaseModel):
    email: str
    username: str
    name: str
    role_name: str
    is_owner: bool = False
    is_active: bool = True
    expiration_date: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role_name: Optional[str] = None
    is_active: Optional[bool] = None
    expiration_date: Optional[str] = None

class UserOut(UserBase):
    id: str
    tenant_id: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class DriverBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    employment_type: str = "COMPANY_DRIVER"
    assigned_truck_id: Optional[str] = None
    assigned_truck_number: Optional[str] = None
    cdl_number: Optional[str] = None
    cdl_class: Optional[str] = None
    cdl_expiration: Optional[str] = None
    medical_card_expiration: Optional[str] = None
    status: str = "AVAILABLE"
    pay_rate_type: str = "PER_MILE"
    pay_rate_minor: int = 65
    notes: Optional[str] = None

class DriverCreate(DriverBase):
    pass

class DriverUpdate(DriverBase):
    name: Optional[str] = None

class DriverOut(DriverBase):
    id: str
    tenant_id: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class EquipmentBase(BaseModel):
    unit_number: str
    type: str = "TRUCK"
    vin: Optional[str] = None
    make_model: Optional[str] = None
    year: Optional[int] = None
    license_plate: Optional[str] = None
    odometer_miles: Optional[int] = None
    inspection_due_date: Optional[str] = None
    status: str = "ACTIVE"
    assigned_driver_id: Optional[str] = None
    assigned_driver_name: Optional[str] = None
    notes: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(EquipmentBase):
    unit_number: Optional[str] = None

class EquipmentOut(EquipmentBase):
    id: str
    tenant_id: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class CustomerBase(BaseModel):
    name: str
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    billing_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip: Optional[str] = None
    payment_terms_days: int = 30
    credit_limit_minor: int = 0
    average_days_to_pay: Optional[int] = None
    rating: Optional[int] = None
    is_active: bool = True
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    name: Optional[str] = None

class CustomerOut(CustomerBase):
    id: str
    tenant_id: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class InvoiceBase(BaseModel):
    invoice_number: str
    load_id: Optional[str] = None
    load_number: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str
    issue_date: str
    due_date: str
    subtotal_minor: int
    accessorials_minor: int = 0
    total_minor: int
    status: str = "ISSUED"
    driver_pay_minor: Optional[int] = None
    driver_settlement_status: Optional[str] = None
    paid_amount_minor: Optional[int] = None
    notes: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(InvoiceBase):
    invoice_number: Optional[str] = None

class InvoiceOut(InvoiceBase):
    id: str
    tenant_id: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class LoadBase(BaseModel):
    load_number: str
    status: str = "BOOKED"
    broker_id: str
    broker_name: str
    broker_reference: Optional[str] = None
    rate_minor: int
    currency: str = "USD"
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    truck_number: Optional[str] = None
    trailer_number: Optional[str] = None
    loaded_miles: int = 0
    deadhead_miles: int = 0
    origin_city: Optional[str] = None
    origin_state: Optional[str] = None
    dest_city: Optional[str] = None
    dest_state: Optional[str] = None
    pickup_date: Optional[str] = None
    delivery_date: Optional[str] = None
    fuel_surcharge_minor: Optional[int] = None
    notes: Optional[str] = None

class LoadCreate(LoadBase):
    pass

class LoadUpdate(LoadBase):
    load_number: Optional[str] = None
    broker_id: Optional[str] = None
    broker_name: Optional[str] = None
    rate_minor: Optional[int] = None

class LoadOut(LoadBase):
    id: str
    tenant_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
