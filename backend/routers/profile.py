"""profile.py — User profile with MongoDB support"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import os

router = APIRouter()
_profiles = {}  # In-memory; replace with MongoDB in production

class Profile(BaseModel):
    session_id: str
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    weight: Optional[float] = None
    city: Optional[str] = None
    language: Optional[str] = "en"
    diseases: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    currentMedicines: Optional[List[str]] = []

@router.post("/save")
async def save(p: Profile):
    _profiles[p.session_id] = p.dict()
    return {"success": True, "message": "Profile saved. All AI recommendations are now personalized."}

@router.get("/{session_id}")
async def get(session_id: str):
    p = _profiles.get(session_id)
    return {"found": bool(p), "profile": p}

@router.delete("/{session_id}")
async def delete(session_id: str):
    _profiles.pop(session_id, None)
    return {"success": True}
