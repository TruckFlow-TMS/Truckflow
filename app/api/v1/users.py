import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_admin, get_password_hash
from app.models import User
from app.schemas import UserOut, UserCreate, UserUpdate
from datetime import datetime, timedelta

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserOut])
def list_users(
    search: Optional[str] = None,
    role_name: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(User)
    if search:
        query = query.filter(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%") | User.username.ilike(f"%{search}%"))
    if role_name:
        query = query.filter(User.role_name == role_name)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=UserOut)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    db_user = User(
        id=f"usr-{uuid.uuid4().hex[:8]}",
        tenant_id=admin.tenant_id,
        email=user_in.email,
        username=user_in.username,
        name=user_in.name,
        hashed_password=get_password_hash(user_in.password),
        role_name=user_in.role_name,
        is_owner=user_in.is_owner,
        is_active=user_in.is_active,
        expiration_date=datetime.fromisoformat(user_in.expiration_date) if user_in.expiration_date else None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, user_in: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.name is not None:
        user.name = user_in.name
    if user_in.role_name is not None:
        user.role_name = user_in.role_name
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.expiration_date is not None:
        user.expiration_date = datetime.fromisoformat(user_in.expiration_date)
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete self")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}

@router.patch("/{user_id}/renew", response_model=UserOut)
def renew_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.expiration_date = datetime.utcnow() + timedelta(days=30)
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/decline", response_model=UserOut)
def decline_user(user_id: str, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
