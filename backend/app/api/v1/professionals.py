from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.schemas import ProfessionalOut, ProfessionalCreate, ConsultationCreate, ConsultationOut
from app.models.models import Professional, Consultation, User
from app.utils.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=List[ProfessionalOut])
def list_professionals(db: Session = Depends(get_db)):
    pros = db.query(Professional).filter(Professional.is_verified == True).all()
    result = []
    for p in pros:
        user = db.query(User).filter(User.id == p.user_id).first()
        out = ProfessionalOut.model_validate(p)
        out.name = user.name if user else None
        result.append(out)
    return result


@router.post("/register", response_model=ProfessionalOut)
def register_professional(
    data: ProfessionalCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(Professional).filter(Professional.user_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as professional")
    pro = Professional(user_id=user.id, **data.model_dump())
    db.add(pro)
    db.commit()
    db.refresh(pro)
    out = ProfessionalOut.model_validate(pro)
    out.name = user.name
    return out


@router.post("/consultations", response_model=ConsultationOut)
def book_consultation(
    data: ConsultationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pro = db.query(Professional).filter(
        Professional.id == data.professional_id,
        Professional.is_verified == True,
    ).first()
    if not pro:
        raise HTTPException(status_code=404, detail="Professional not found")
    consultation = Consultation(
        professional_id=data.professional_id,
        client_id=user.id,
        scheduled_at=data.scheduled_at,
        notes=data.notes,
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation


@router.get("/consultations", response_model=List[ConsultationOut])
def my_consultations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Consultation).filter(
        Consultation.client_id == user.id
    ).order_by(Consultation.scheduled_at.desc()).all()
