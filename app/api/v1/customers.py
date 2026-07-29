import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Customer, Load, User
from app.schemas import CustomerOut, CustomerCreate, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["customers"])

@router.get("/", response_model=List[CustomerOut])
def list_customers(
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Customer).filter(Customer.tenant_id == user.tenant_id)
    if search:
        query = query.filter(Customer.name.ilike(f"%{search}%") | Customer.mc_number.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=CustomerOut)
def create_customer(cust_in: CustomerCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_cust = Customer(
        id=f"cust-{uuid.uuid4().hex[:8]}",
        tenant_id=user.tenant_id,
        name=cust_in.name,
        mc_number=cust_in.mc_number,
        dot_number=cust_in.dot_number,
        contact_person=cust_in.contact_person,
        contact_email=cust_in.contact_email,
        contact_phone=cust_in.contact_phone,
        billing_address=cust_in.billing_address,
        city=cust_in.city,
        state=cust_in.state,
        zip=cust_in.zip,
        payment_terms_days=cust_in.payment_terms_days,
        credit_limit_minor=cust_in.credit_limit_minor,
        average_days_to_pay=cust_in.average_days_to_pay,
        rating=cust_in.rating,
        is_active=cust_in.is_active,
        notes=cust_in.notes
    )
    db.add(db_cust)
    db.commit()
    db.refresh(db_cust)
    return db_cust

@router.get("/{cust_id}", response_model=CustomerOut)
def get_customer(cust_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cust = db.query(Customer).filter(Customer.id == cust_id, Customer.tenant_id == user.tenant_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    return cust

@router.put("/{cust_id}", response_model=CustomerOut)
def update_customer(cust_id: str, cust_in: CustomerUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cust = db.query(Customer).filter(Customer.id == cust_id, Customer.tenant_id == user.tenant_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    for var, value in vars(cust_in).items():
        if value is not None:
            setattr(cust, var, value)
            
    db.commit()
    db.refresh(cust)
    return cust

@router.delete("/{cust_id}")
def delete_customer(cust_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cust = db.query(Customer).filter(Customer.id == cust_id, Customer.tenant_id == user.tenant_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    active_loads = db.query(Load).filter(Load.broker_name == cust.name, Load.status.notin_(["CLOSED", "DELIVERED", "CANCELLED"])).first()
    if active_loads:
        raise HTTPException(status_code=400, detail="Cannot delete customer with active loads")
        
    db.delete(cust)
    db.commit()
    return {"detail": "Customer deleted"}
