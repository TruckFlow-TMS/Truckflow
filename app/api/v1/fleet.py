import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_admin, get_current_user
from app.models import Equipment, User
from app.schemas import EquipmentOut, EquipmentCreate, EquipmentUpdate
from datetime import datetime

router = APIRouter(prefix="/fleet", tags=["fleet"])

@router.get("/", response_model=List[EquipmentOut])
def list_equipment(
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Equipment).filter(Equipment.tenant_id == user.tenant_id)
    if search:
        query = query.filter(Equipment.unit_number.ilike(f"%{search}%") | Equipment.make_model.ilike(f"%{search}%"))
    if type:
        query = query.filter(Equipment.type == type)
    if status:
        query = query.filter(Equipment.status == status)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=EquipmentOut)
def create_equipment(eq_in: EquipmentCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db_eq = Equipment(
        id=f"eq-{uuid.uuid4().hex[:8]}",
        tenant_id=admin.tenant_id,
        unit_number=eq_in.unit_number,
        type=eq_in.type,
        vin=eq_in.vin,
        make_model=eq_in.make_model,
        year=eq_in.year,
        license_plate=eq_in.license_plate,
        odometer_miles=eq_in.odometer_miles,
        inspection_due_date=datetime.fromisoformat(eq_in.inspection_due_date) if eq_in.inspection_due_date else None,
        status=eq_in.status,
        assigned_driver_id=eq_in.assigned_driver_id,
        assigned_driver_name=eq_in.assigned_driver_name,
        notes=eq_in.notes
    )
    db.add(db_eq)
    db.commit()
    db.refresh(db_eq)
    return db_eq

@router.get("/{equip_id}", response_model=EquipmentOut)
def get_equipment(equip_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    eq = db.query(Equipment).filter(Equipment.id == equip_id, Equipment.tenant_id == user.tenant_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return eq

@router.put("/{equip_id}", response_model=EquipmentOut)
def update_equipment(equip_id: str, eq_in: EquipmentUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    eq = db.query(Equipment).filter(Equipment.id == equip_id, Equipment.tenant_id == admin.tenant_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
        
    for var, value in vars(eq_in).items():
        if value is not None:
            if var == 'inspection_due_date':
                setattr(eq, var, datetime.fromisoformat(value))
            else:
                setattr(eq, var, value)
            
    db.commit()
    db.refresh(eq)
    return eq

@router.delete("/{equip_id}")
def delete_equipment(equip_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    eq = db.query(Equipment).filter(Equipment.id == equip_id, Equipment.tenant_id == admin.tenant_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
        
    db.delete(eq)
    db.commit()
    return {"detail": "Equipment deleted"}
