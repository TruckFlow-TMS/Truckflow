import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Load, User
from app.schemas import LoadOut, LoadCreate, LoadUpdate
from datetime import datetime

router = APIRouter(prefix="/loads", tags=["loads"])

@router.get("/", response_model=List[LoadOut])
def list_loads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    driver_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Load).filter(Load.tenant_id == user.tenant_id)
    if search:
        query = query.filter(Load.load_number.ilike(f"%{search}%") | Load.broker_name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Load.status == status)
    if driver_id:
        query = query.filter(Load.driver_id == driver_id)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=LoadOut)
def create_load(load_in: LoadCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_load = Load(
        id=f"ld-{uuid.uuid4().hex[:8]}",
        tenant_id=user.tenant_id,
        load_number=load_in.load_number,
        status=load_in.status,
        broker_id=load_in.broker_id,
        broker_name=load_in.broker_name,
        broker_reference=load_in.broker_reference,
        rate_minor=load_in.rate_minor,
        currency=load_in.currency,
        driver_id=load_in.driver_id,
        driver_name=load_in.driver_name,
        truck_number=load_in.truck_number,
        trailer_number=load_in.trailer_number,
        loaded_miles=load_in.loaded_miles,
        deadhead_miles=load_in.deadhead_miles,
        origin_city=load_in.origin_city,
        origin_state=load_in.origin_state,
        dest_city=load_in.dest_city,
        dest_state=load_in.dest_state,
        pickup_date=datetime.fromisoformat(load_in.pickup_date) if load_in.pickup_date else None,
        delivery_date=datetime.fromisoformat(load_in.delivery_date) if load_in.delivery_date else None,
        fuel_surcharge_minor=load_in.fuel_surcharge_minor,
        notes=load_in.notes
    )
    db.add(db_load)
    db.commit()
    db.refresh(db_load)
    return db_load

@router.get("/{load_id}", response_model=LoadOut)
def get_load(load_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    load = db.query(Load).filter(Load.id == load_id, Load.tenant_id == user.tenant_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return load

@router.put("/{load_id}", response_model=LoadOut)
def update_load(load_id: str, load_in: LoadUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    load = db.query(Load).filter(Load.id == load_id, Load.tenant_id == user.tenant_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    for var, value in vars(load_in).items():
        if value is not None:
            setattr(load, var, value)
            
    db.commit()
    db.refresh(load)
    return load

@router.delete("/{load_id}")
def delete_load(load_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    load = db.query(Load).filter(Load.id == load_id, Load.tenant_id == user.tenant_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if load.status not in ["OPEN", "CANCELLED", "BOOKED"]:
        raise HTTPException(status_code=400, detail="Cannot delete active load")
        
    db.delete(load)
    db.commit()
    return {"detail": "Load deleted"}

@router.patch("/{load_id}/status", response_model=LoadOut)
def update_load_status(load_id: str, status: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    load = db.query(Load).filter(Load.id == load_id, Load.tenant_id == user.tenant_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    load.status = status
    db.commit()
    db.refresh(load)
    return load

@router.post("/{load_id}/assign", response_model=LoadOut)
def assign_driver(load_id: str, driver_id: str, truck_number: str, trailer_number: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    load = db.query(Load).filter(Load.id == load_id, Load.tenant_id == user.tenant_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    load.driver_id = driver_id
    load.truck_number = truck_number
    load.trailer_number = trailer_number
    load.status = "ASSIGNED"
    db.commit()
    db.refresh(load)
    return load
