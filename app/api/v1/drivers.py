import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_admin, get_current_user
from app.models import Driver, Load, User
from app.schemas import DriverOut, DriverCreate, DriverUpdate
from datetime import datetime

router = APIRouter(prefix="/drivers", tags=["drivers"])

@router.get("/", response_model=List[DriverOut])
def list_drivers(
    search: Optional[str] = None,
    status: Optional[str] = None,
    employment_type: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Driver).filter(Driver.tenant_id == user.tenant_id)
    if search:
        query = query.filter(Driver.name.ilike(f"%{search}%") | Driver.email.ilike(f"%{search}%"))
    if status:
        query = query.filter(Driver.status == status)
    if employment_type:
        query = query.filter(Driver.employment_type == employment_type)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=DriverOut)
def create_driver(driver_in: DriverCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_driver = Driver(
        id=f"drv-{uuid.uuid4().hex[:8]}",
        tenant_id=admin.tenant_id,
        name=driver_in.name,
        email=driver_in.email,
        phone=driver_in.phone,
        address=driver_in.address,
        employment_type=driver_in.employment_type,
        assigned_truck_id=driver_in.assigned_truck_id,
        assigned_truck_number=driver_in.assigned_truck_number,
        cdl_number=driver_in.cdl_number,
        cdl_class=driver_in.cdl_class,
        cdl_expiration=datetime.fromisoformat(driver_in.cdl_expiration) if driver_in.cdl_expiration else None,
        medical_card_expiration=datetime.fromisoformat(driver_in.medical_card_expiration) if driver_in.medical_card_expiration else None,
        status=driver_in.status,
        pay_rate_type=driver_in.pay_rate_type,
        pay_rate_minor=driver_in.pay_rate_minor,
        notes=driver_in.notes
    )
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.tenant_id == user.tenant_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: str, driver_in: DriverUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.tenant_id == admin.tenant_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    for var, value in vars(driver_in).items():
        if value is not None:
            if var in ['cdl_expiration', 'medical_card_expiration']:
                setattr(driver, var, datetime.fromisoformat(value))
            else:
                setattr(driver, var, value)
            
    db.commit()
    db.refresh(driver)
    return driver

@router.delete("/{driver_id}")
def delete_driver(driver_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    driver = db.query(Driver).filter(Driver.id == driver_id, Driver.tenant_id == admin.tenant_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    active_load = db.query(Load).filter(Load.driver_id == driver_id, Load.status.in_(["DISPATCHED", "IN_TRANSIT"])).first()
    if active_load:
        raise HTTPException(status_code=400, detail="Cannot delete driver with active loads")
        
    db.delete(driver)
    db.commit()
    return {"detail": "Driver deleted"}
