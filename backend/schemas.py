from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from .models import (
    AcceptanceChanceEnum,
    ExamStatusEnum,
    SopStatusEnum,
    StageEnum,
    TodoStatusEnum,
    UniversityCategoryEnum,
    UniversityStatusEnum,
)


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProfileBase(BaseModel):
    current_education_level: str
    degree_major: str
    graduation_year: int
    gpa: Optional[float] = None

    intended_degree: str
    field_of_study: str
    target_intake_year: int
    preferred_countries: List[str]

    budget_per_year: int
    funding_plan: str

    ielts_toefl_status: ExamStatusEnum
    gre_gmat_status: ExamStatusEnum
    sop_status: SopStatusEnum


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileOut(ProfileBase):
    id: int
    is_complete: bool
    current_stage: StageEnum

    class Config:
        from_attributes = True


class DashboardStrength(BaseModel):
    academics: str
    exams: str
    sop: str


class DashboardStage(BaseModel):
    current_stage: StageEnum
    label: str


class DashboardSummary(BaseModel):
    profile: ProfileOut
    strength: DashboardStrength
    stage: DashboardStage


class UniversityBase(BaseModel):
    id: int
    name: str
    country: str
    city: Optional[str]
    field_of_study: str
    degree_level: str
    tuition_per_year: int
    cost_level: str
    competition_level: str
    base_acceptance_chance: AcceptanceChanceEnum
    description: Optional[str]

    class Config:
        from_attributes = True


class UniversityFilter(BaseModel):
    max_budget_per_year: Optional[int] = None
    countries: Optional[List[str]] = None
    field_of_study: Optional[str] = None
    degree_level: Optional[str] = None


class UserUniversityOut(BaseModel):
    id: int
    category: UniversityCategoryEnum
    status: UniversityStatusEnum
    acceptance_chance: AcceptanceChanceEnum
    fit_reason: Optional[str]
    risk_explanation: Optional[str]
    university: UniversityBase

    class Config:
        from_attributes = True


class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TodoStatusEnum = TodoStatusEnum.PENDING
    related_university_id: Optional[int] = None
    due_date: Optional[datetime] = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TodoStatusEnum] = None
    related_university_id: Optional[int] = None
    due_date: Optional[datetime] = None


class TodoOut(TodoBase):
    id: int
    created_by_ai: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CounsellorMessage(BaseModel):
    role: str  # "user" or "assistant" or "system"
    content: str


class CounsellorAction(BaseModel):
    type: str  # "shortlist_university", "lock_university", "create_todo", etc.
    payload: dict


class CounsellorResponse(BaseModel):
    messages: List[CounsellorMessage]
    actions: List[CounsellorAction] = []

