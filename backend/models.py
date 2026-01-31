from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SqlEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class ExamStatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class SopStatusEnum(str, Enum):
    NOT_STARTED = "not_started"
    DRAFT = "draft"
    READY = "ready"


class StageEnum(str, Enum):
    BUILDING_PROFILE = "building_profile"
    DISCOVERING_UNIVERSITIES = "discovering_universities"
    FINALIZING_UNIVERSITIES = "finalizing_universities"
    PREPARING_APPLICATIONS = "preparing_applications"


class RiskLevelEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AcceptanceChanceEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class UniversityCategoryEnum(str, Enum):
    DREAM = "dream"
    TARGET = "target"
    SAFE = "safe"


class UniversityStatusEnum(str, Enum):
    SHORTLISTED = "shortlisted"
    LOCKED = "locked"


class TodoStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ChatRoleEnum(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)  # Profile picture URL
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False)
    todos = relationship("Todo", back_populates="user", cascade="all, delete-orphan")
    user_universities = relationship(
        "UserUniversity", back_populates="user", cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessage", back_populates="user", cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    """Stores conversation history with AI counsellor."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(SqlEnum(ChatRoleEnum), nullable=False)
    content = Column(Text, nullable=False)
    session_id = Column(String(100), nullable=True)  # Group messages by session
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Academic background
    current_education_level = Column(String(100), nullable=False)
    degree_major = Column(String(255), nullable=False)
    graduation_year = Column(Integer, nullable=False)
    gpa = Column(Float, nullable=True)

    # Study goal
    intended_degree = Column(String(50), nullable=False)
    field_of_study = Column(String(255), nullable=False)
    target_intake_year = Column(Integer, nullable=False)
    preferred_countries = Column(String(255), nullable=False)  # comma-separated

    # Budget
    budget_per_year = Column(Integer, nullable=False)
    funding_plan = Column(String(50), nullable=False)  # self / scholarship / loan

    # Exams & readiness
    ielts_toefl_status = Column(SqlEnum(ExamStatusEnum), nullable=False)
    gre_gmat_status = Column(SqlEnum(ExamStatusEnum), nullable=False)
    sop_status = Column(SqlEnum(SopStatusEnum), nullable=False)

    # Derived stage
    current_stage = Column(SqlEnum(StageEnum), default=StageEnum.BUILDING_PROFILE)
    is_complete = Column(Boolean, default=False)

    user = relationship("User", back_populates="profile")


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=True)
    field_of_study = Column(String(255), nullable=False)  # primary field / tag
    degree_level = Column(String(50), nullable=False)  # bachelors / masters / mba / phd

    tuition_per_year = Column(Integer, nullable=False)
    cost_level = Column(SqlEnum(RiskLevelEnum), nullable=False)  # reuse enum
    competition_level = Column(SqlEnum(RiskLevelEnum), nullable=False)

    base_acceptance_chance = Column(SqlEnum(AcceptanceChanceEnum), nullable=False)

    description = Column(Text, nullable=True)

    user_universities = relationship(
        "UserUniversity", back_populates="university", cascade="all, delete-orphan"
    )


class UserUniversity(Base):
    __tablename__ = "user_universities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)

    category = Column(SqlEnum(UniversityCategoryEnum), nullable=False)
    status = Column(SqlEnum(UniversityStatusEnum), nullable=False)

    fit_reason = Column(Text, nullable=True)
    risk_explanation = Column(Text, nullable=True)
    acceptance_chance = Column(SqlEnum(AcceptanceChanceEnum), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_universities")
    university = relationship("University", back_populates="user_universities")


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SqlEnum(TodoStatusEnum), default=TodoStatusEnum.PENDING)
    due_date = Column(DateTime, nullable=True)
    related_university_id = Column(Integer, ForeignKey("universities.id"), nullable=True)
    created_by_ai = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="todos")

