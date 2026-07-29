import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Invoice, Load, User
from app.schemas import InvoiceOut, InvoiceCreate, InvoiceUpdate
from datetime import datetime, timedelta

router = APIRouter(prefix="/invoices", tags=["invoices"])

@router.get("/", response_model=List[InvoiceOut])
def list_invoices(
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    query = db.query(Invoice).filter(Invoice.tenant_id == user.tenant_id)
    if search:
        query = query.filter(Invoice.invoice_number.ilike(f"%{search}%") | Invoice.customer_name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Invoice.status == status)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
        
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=InvoiceOut)
def create_invoice(inv_in: InvoiceCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_inv = Invoice(
        id=f"inv-{uuid.uuid4().hex[:8]}",
        tenant_id=user.tenant_id,
        invoice_number=inv_in.invoice_number,
        load_id=inv_in.load_id,
        load_number=inv_in.load_number,
        customer_id=inv_in.customer_id,
        customer_name=inv_in.customer_name,
        issue_date=datetime.fromisoformat(inv_in.issue_date),
        due_date=datetime.fromisoformat(inv_in.due_date),
        subtotal_minor=inv_in.subtotal_minor,
        accessorials_minor=inv_in.accessorials_minor,
        total_minor=inv_in.total_minor,
        status=inv_in.status,
        driver_pay_minor=inv_in.driver_pay_minor,
        driver_settlement_status=inv_in.driver_settlement_status,
        paid_amount_minor=inv_in.paid_amount_minor,
        notes=inv_in.notes
    )
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return db_inv

@router.get("/{inv_id}", response_model=InvoiceOut)
def get_invoice(inv_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.tenant_id == user.tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv

@router.put("/{inv_id}", response_model=InvoiceOut)
def update_invoice(inv_id: str, inv_in: InvoiceUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.tenant_id == user.tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    for var, value in vars(inv_in).items():
        if value is not None:
            if var in ['issue_date', 'due_date']:
                setattr(inv, var, datetime.fromisoformat(value))
            else:
                setattr(inv, var, value)
            
    db.commit()
    db.refresh(inv)
    return inv

@router.delete("/{inv_id}")
def delete_invoice(inv_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.tenant_id == user.tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if inv.status not in ["DRAFT", "ISSUED"]:
        raise HTTPException(status_code=400, detail="Cannot delete invoice with this status")
        
    db.delete(inv)
    db.commit()
    return {"detail": "Invoice deleted"}

@router.post("/{inv_id}/void", response_model=InvoiceOut)
def void_invoice(inv_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.tenant_id == user.tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    inv.status = "VOIDED"
    db.commit()
    db.refresh(inv)
    return inv

@router.post("/{inv_id}/mark-paid", response_model=InvoiceOut)
def mark_invoice_paid(inv_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inv = db.query(Invoice).filter(Invoice.id == inv_id, Invoice.tenant_id == user.tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    inv.status = "PAID"
    inv.paid_amount_minor = inv.total_minor
    db.commit()
    db.refresh(inv)
    return inv

@router.post("/generate/{load_id}", response_model=InvoiceOut)
def generate_invoice(load_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    load = db.query(Load).filter(Load.id == load_id, Load.tenant_id == user.tenant_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
        
    # Check if invoice already exists
    existing_inv = db.query(Invoice).filter(Invoice.load_id == load_id).first()
    if existing_inv:
        raise HTTPException(status_code=400, detail="Invoice already exists for this load")
        
    db_inv = Invoice(
        id=f"inv-{uuid.uuid4().hex[:8]}",
        tenant_id=user.tenant_id,
        invoice_number=f"INV-{load.load_number}",
        load_id=load.id,
        load_number=load.load_number,
        customer_id=None,
        customer_name=load.broker_name,
        issue_date=datetime.utcnow(),
        due_date=datetime.utcnow() + timedelta(days=30),
        subtotal_minor=load.rate_minor,
        accessorials_minor=sum(a.billable_amount_minor for a in load.accessorials if a.approved and not a.waived),
        total_minor=load.rate_minor + sum(a.billable_amount_minor for a in load.accessorials if a.approved and not a.waived),
        status="ISSUED"
    )
    db.add(db_inv)
    
    load.status = "INVOICED"
    
    db.commit()
    db.refresh(db_inv)
    return db_inv
