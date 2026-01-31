from typing import List
import uuid
import base64
import os
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from . import auth, models, schemas
from .database import Base, engine, get_db
from dotenv import load_dotenv
load_dotenv()



# Create tables (for prototype). In production, use migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Counsellor Backend", version="0.1.0")

# CORS must be added first, before any routes or mounts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in real deployment
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight for 10 minutes
)

# Serve uploaded files (avatars)
UPLOADS_PATH = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOADS_PATH, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_PATH), name="uploads")


@app.post("/auth/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    print(user_in)
    existing = auth.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    hashed_pw = auth.hash_password(user_in.password)
    user = models.User(
        full_name=user_in.full_name, email=user_in.email, hashed_password=hashed_pw
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(user)
    return user


@app.post("/auth/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = auth.get_user_by_email(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return schemas.Token(access_token=access_token)


class GoogleLoginRequest(schemas.BaseModel):
    """Request body for Google Sign-In."""
    credential: str  # The Google ID token


@app.post("/auth/google", response_model=schemas.Token)
def google_login(
    request: GoogleLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Sign in with Google.
    Verifies the Google ID token and creates/logs in the user.
    """
    import os
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    
    if not google_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google Sign-In not configured. Set GOOGLE_CLIENT_ID environment variable.",
        )
    
    # Verify the Google ID token
    user_info = auth.verify_google_token(request.credential, google_client_id)
    
    if not user_info or not user_info.get('email'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credentials",
        )
    
    email = user_info['email']
    name = user_info.get('name', email.split('@')[0])
    picture = user_info.get('picture')
    
    # Check if user exists
    user = auth.get_user_by_email(db, email)
    
    if not user:
        # Create new user
        import secrets
        user = models.User(
            full_name=name,
            email=email,
            hashed_password=auth.hash_password(secrets.token_urlsafe(32)),  # Random password
            avatar_url=picture,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update avatar if not set
        if picture and not user.avatar_url:
            user.avatar_url = picture
            db.commit()
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return schemas.Token(access_token=access_token)


@app.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.post("/profile", response_model=schemas.ProfileOut)
def create_or_update_profile(
    profile_in: schemas.ProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    preferred_countries_str = ",".join(profile_in.preferred_countries)

    if profile:
        for field, value in profile_in.dict().items():
            if field == "preferred_countries":
                setattr(profile, field, preferred_countries_str)
            else:
                setattr(profile, field, value)
        profile.is_complete = True
    else:
        profile = models.Profile(
            user_id=current_user.id,
            preferred_countries=preferred_countries_str,
            is_complete=True,
            **{
                k: v
                for k, v in profile_in.dict().items()
                if k != "preferred_countries"
            },
        )
        db.add(profile)

    # Simple stage logic: once profile saved, move to discovering universities.
    profile.current_stage = models.StageEnum.DISCOVERING_UNIVERSITIES

    db.commit()
    db.refresh(profile)
    return schemas.ProfileOut(
        **profile_in.dict(),
        id=profile.id,
        is_complete=profile.is_complete,
        current_stage=profile.current_stage,
    )


@app.get("/profile", response_model=schemas.ProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    preferred_countries = (
        profile.preferred_countries.split(",") if profile.preferred_countries else []
    )

    return schemas.ProfileOut(
        id=profile.id,
        is_complete=profile.is_complete,
        current_stage=profile.current_stage,
        current_education_level=profile.current_education_level,
        degree_major=profile.degree_major,
        graduation_year=profile.graduation_year,
        gpa=profile.gpa,
        intended_degree=profile.intended_degree,
        field_of_study=profile.field_of_study,
        target_intake_year=profile.target_intake_year,
        preferred_countries=preferred_countries,
        budget_per_year=profile.budget_per_year,
        funding_plan=profile.funding_plan,
        ielts_toefl_status=profile.ielts_toefl_status,
        gre_gmat_status=profile.gre_gmat_status,
        sop_status=profile.sop_status,
    )


@app.get("/dashboard", response_model=schemas.DashboardSummary)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    if not profile or not profile.is_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete onboarding before accessing dashboard.",
        )

    # Simple profile strength logic
    academics = "strong" if (profile.gpa or 0) >= 8.0 else "average"
    exams = (
        "completed"
        if profile.ielts_toefl_status == models.ExamStatusEnum.COMPLETED
        and profile.gre_gmat_status == models.ExamStatusEnum.COMPLETED
        else "in_progress"
    )
    sop = profile.sop_status.value.replace("_", " ")

    preferred_countries = (
        profile.preferred_countries.split(",") if profile.preferred_countries else []
    )
    profile_out = schemas.ProfileOut(
        id=profile.id,
        is_complete=profile.is_complete,
        current_stage=profile.current_stage,
        current_education_level=profile.current_education_level,
        degree_major=profile.degree_major,
        graduation_year=profile.graduation_year,
        gpa=profile.gpa,
        intended_degree=profile.intended_degree,
        field_of_study=profile.field_of_study,
        target_intake_year=profile.target_intake_year,
        preferred_countries=preferred_countries,
        budget_per_year=profile.budget_per_year,
        funding_plan=profile.funding_plan,
        ielts_toefl_status=profile.ielts_toefl_status,
        gre_gmat_status=profile.gre_gmat_status,
        sop_status=profile.sop_status,
    )

    strength = schemas.DashboardStrength(
        academics=academics, exams=exams, sop=sop  # type: ignore[arg-type]
    )

    stage_label_map = {
        models.StageEnum.BUILDING_PROFILE: "Stage 1: Building Profile",
        models.StageEnum.DISCOVERING_UNIVERSITIES: "Stage 2: Discovering Universities",
        models.StageEnum.FINALIZING_UNIVERSITIES: "Stage 3: Finalizing Universities",
        models.StageEnum.PREPARING_APPLICATIONS: "Stage 4: Preparing Applications",
    }
    stage = schemas.DashboardStage(
        current_stage=profile.current_stage,
        label=stage_label_map.get(profile.current_stage, "Unknown stage"),
    )

    return schemas.DashboardSummary(profile=profile_out, strength=strength, stage=stage)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# -------------------------
# University discovery & shortlisting
# -------------------------


@app.get(
    "/universities",
    response_model=List[schemas.UniversityBase],
)
def list_universities(
    filters: schemas.UniversityFilter = Depends(),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Require completed profile to discover universities
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    if not profile or not profile.is_complete:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete onboarding before discovering universities.",
        )

    query = db.query(models.University)

    if filters.max_budget_per_year:
        query = query.filter(models.University.tuition_per_year <= filters.max_budget_per_year)
    if filters.countries:
        query = query.filter(models.University.country.in_(filters.countries))
    if filters.field_of_study:
        query = query.filter(models.University.field_of_study.ilike(f"%{filters.field_of_study}%"))
    if filters.degree_level:
        query = query.filter(models.University.degree_level == filters.degree_level)

    # If no universities yet (fresh DB), seed a small realistic set
    if query.count() == 0:
        seed_universities(db)
        query = db.query(models.University)

    universities = query.all()
    return [schemas.UniversityBase.model_validate(u) for u in universities]


def seed_universities(db: Session) -> None:
    sample = [
        models.University(
            name="University of Toronto",
            country="Canada",
            city="Toronto",
            field_of_study="Computer Science",
            degree_level="masters",
            tuition_per_year=52000,
            cost_level=models.RiskLevelEnum.HIGH,
            competition_level=models.RiskLevelEnum.HIGH,
            base_acceptance_chance=models.AcceptanceChanceEnum.MEDIUM,
            description="Top Canadian university with strong CS and AI programs.",
        ),
        models.University(
            name="University of Waterloo",
            country="Canada",
            city="Waterloo",
            field_of_study="Computer Science",
            degree_level="masters",
            tuition_per_year=42000,
            cost_level=models.RiskLevelEnum.MEDIUM,
            competition_level=models.RiskLevelEnum.HIGH,
            base_acceptance_chance=models.AcceptanceChanceEnum.MEDIUM,
            description="Excellent for software engineering and co-op programs.",
        ),
        models.University(
            name="Arizona State University",
            country="United States",
            city="Tempe",
            field_of_study="Computer Science",
            degree_level="masters",
            tuition_per_year=32000,
            cost_level=models.RiskLevelEnum.MEDIUM,
            competition_level=models.RiskLevelEnum.MEDIUM,
            base_acceptance_chance=models.AcceptanceChanceEnum.HIGH,
            description="Large US public university with strong engineering.",
        ),
        models.University(
            name="TU Munich",
            country="Germany",
            city="Munich",
            field_of_study="Computer Science",
            degree_level="masters",
            tuition_per_year=2000,
            cost_level=models.RiskLevelEnum.LOW,
            competition_level=models.RiskLevelEnum.HIGH,
            base_acceptance_chance=models.AcceptanceChanceEnum.MEDIUM,
            description="German technical university with low tuition and strong research.",
        ),
    ]
    db.add_all(sample)
    db.commit()


@app.get(
    "/universities/{university_id}",
    response_model=schemas.UniversityBase,
)
def get_university(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get a single university by ID with all its details."""
    university = db.query(models.University).filter(models.University.id == university_id).first()
    if not university:
        raise HTTPException(status_code=404, detail="University not found")
    return schemas.UniversityBase.model_validate(university)


@app.post(
    "/universities/{university_id}/shortlist",
    response_model=schemas.UserUniversityOut,
)
def shortlist_university(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    uni = db.get(models.University, university_id)
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    existing = (
        db.query(models.UserUniversity)
        .filter(
            models.UserUniversity.user_id == current_user.id,
            models.UserUniversity.university_id == university_id,
        )
        .first()
    )
    if existing:
        return existing

    # Simple categorization logic based on tuition vs budget and competition
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    if not profile:
        raise HTTPException(status_code=400, detail="Profile required to shortlist.")

    # Determine category
    if uni.tuition_per_year > profile.budget_per_year * 1.2 or uni.competition_level == models.RiskLevelEnum.HIGH:
        category = models.UniversityCategoryEnum.DREAM
    elif uni.tuition_per_year < profile.budget_per_year * 0.8 and uni.competition_level == models.RiskLevelEnum.LOW:
        category = models.UniversityCategoryEnum.SAFE
    else:
        category = models.UniversityCategoryEnum.TARGET

    acceptance = uni.base_acceptance_chance
    fit_reason = f"Matches your field {profile.field_of_study} and degree goal {profile.intended_degree}."
    risk_explanation = (
        "Higher competition and cost relative to your budget."
        if category == models.UniversityCategoryEnum.DREAM
        else "Good balance of cost and competition."
    )

    link = models.UserUniversity(
        user_id=current_user.id,
        university_id=university_id,
        category=category,
        status=models.UniversityStatusEnum.SHORTLISTED,
        acceptance_chance=acceptance,
        fit_reason=fit_reason,
        risk_explanation=risk_explanation,
    )
    db.add(link)

    # Once user starts shortlisting, move stage to finalizing universities
    if profile.current_stage == models.StageEnum.DISCOVERING_UNIVERSITIES:
        profile.current_stage = models.StageEnum.FINALIZING_UNIVERSITIES

    db.commit()
    db.refresh(link)
    db.refresh(profile)
    return link


@app.post(
    "/universities/{user_university_id}/lock",
    response_model=schemas.UserUniversityOut,
)
def lock_university(
    user_university_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    uu = (
        db.query(models.UserUniversity)
        .filter(
            models.UserUniversity.id == user_university_id,
            models.UserUniversity.user_id == current_user.id,
        )
        .first()
    )
    if not uu:
        raise HTTPException(status_code=404, detail="Shortlisted university not found")

    uu.status = models.UniversityStatusEnum.LOCKED

    # Update stage to preparing applications
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    if profile:
        profile.current_stage = models.StageEnum.PREPARING_APPLICATIONS

    db.commit()
    db.refresh(uu)
    return uu


@app.post(
    "/universities/{user_university_id}/unlock",
    response_model=schemas.UserUniversityOut,
)
def unlock_university(
    user_university_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    uu = (
        db.query(models.UserUniversity)
        .filter(
            models.UserUniversity.id == user_university_id,
            models.UserUniversity.user_id == current_user.id,
        )
        .first()
    )
    if not uu:
        raise HTTPException(status_code=404, detail="Locked university not found")

    uu.status = models.UniversityStatusEnum.SHORTLISTED

    db.commit()
    db.refresh(uu)
    return uu


@app.get(
    "/my-universities",
    response_model=List[schemas.UserUniversityOut],
)
def get_my_universities(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    links = (
        db.query(models.UserUniversity)
        .filter(models.UserUniversity.user_id == current_user.id)
        .all()
    )
    return links


# -------------------------
# To-dos and application guidance
# -------------------------


@app.get("/todos", response_model=List[schemas.TodoOut])
def list_todos(
    university_id: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.Todo).filter(models.Todo.user_id == current_user.id)
    
    # Filter by university_id if provided
    if university_id is not None:
        query = query.filter(models.Todo.related_university_id == university_id)
    
    todos = query.all()
    return todos


@app.post("/todos", response_model=schemas.TodoOut)
def create_todo(
    todo_in: schemas.TodoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    todo = models.Todo(
        user_id=current_user.id,
        title=todo_in.title,
        description=todo_in.description,
        status=todo_in.status,
        related_university_id=todo_in.related_university_id,
        due_date=todo_in.due_date,
        created_by_ai=True,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@app.patch("/todos/{todo_id}", response_model=schemas.TodoOut)
def update_todo(
    todo_id: int,
    todo_in: schemas.TodoUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    todo = (
        db.query(models.Todo)
        .filter(models.Todo.id == todo_id, models.Todo.user_id == current_user.id)
        .first()
    )
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    for field, value in todo_in.dict(exclude_unset=True).items():
        setattr(todo, field, value)

    db.commit()
    db.refresh(todo)
    return todo


@app.get("/application-guidance")
def get_application_guidance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # Get all locked universities
    locked = (
        db.query(models.UserUniversity)
        .filter(
            models.UserUniversity.user_id == current_user.id,
            models.UserUniversity.status == models.UniversityStatusEnum.LOCKED,
        )
        .all()
    )
    if not locked:
        raise HTTPException(
            status_code=400,
            detail="Lock at least one university to see application guidance.",
        )

    documents = [
        "Passport",
        "Academic transcripts",
        "IELTS/TOEFL score report",
        "GRE/GMAT score report (if applicable)",
        "Statement of Purpose (SOP)",
        "Letters of Recommendation",
        "Resume / CV",
        "Financial documents / bank statements",
    ]
    timeline = [
        "Month 1: Finalize university list and prepare for exams.",
        "Month 2: Draft SOP and request recommendation letters.",
        "Month 3: Take language and aptitude exams.",
        "Month 4: Finalize documents and submit application.",
    ]

    # Return ALL locked universities
    locked_universities = [
        {
            "id": u.id,
            "university_id": u.university_id,
            "name": u.university.name,
            "country": u.university.country,
            "city": u.university.city,
            "program": u.university.field_of_study,
            "tuition": u.university.tuition_per_year,
        }
        for u in locked
    ]

    return {
        "locked_university": locked_universities[0] if locked_universities else None,  # backward compat
        "locked_universities": locked_universities,
        "required_documents": documents,
        "timeline": timeline,
    }


# -------------------------
# AI counsellor (LLM-powered via OpenRouter)
# -------------------------

from . import llm
import asyncio


@app.post("/counsellor", response_model=schemas.CounsellorResponse)
async def counsellor_chat(
    message: schemas.CounsellorMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    AI-powered counsellor that:
    - Uses OpenRouter LLM with full profile/stage/university context
    - EXECUTES actions automatically (shortlist, lock, todos)
    - Provides personalized recommendations
    """
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    if not profile or not profile.is_complete:
        reply = "👋 Let's first complete your onboarding so I can understand your profile. Head over to the onboarding page to tell me about your academic background, study goals, and budget."
        return schemas.CounsellorResponse(
            messages=[schemas.CounsellorMessage(role="assistant", content=reply)],
            actions=[],
        )

    # Gather user's universities
    user_universities = (
        db.query(models.UserUniversity)
        .filter(models.UserUniversity.user_id == current_user.id)
        .all()
    )
    
    # Convert to dicts for the LLM context
    universities_context = []
    for uu in user_universities:
        universities_context.append({
            "id": uu.id,
            "university_id": uu.university_id,
            "status": uu.status.value,
            "category": uu.category.value,
            "university": {
                "name": uu.university.name,
                "country": uu.university.country,
                "tuition_per_year": uu.university.tuition_per_year,
            }
        })
    
    # Get ALL available universities for recommendations
    all_universities = db.query(models.University).all()
    all_universities_context = [
        {
            "id": u.id,
            "name": u.name,
            "country": u.country,
            "city": u.city,
            "field_of_study": u.field_of_study,
            "degree_level": u.degree_level,
            "tuition_per_year": u.tuition_per_year,
            "cost_level": u.cost_level.value,
            "competition_level": u.competition_level.value,
        }
        for u in all_universities
    ]
    
    # Build profile dict
    preferred_countries = (
        profile.preferred_countries.split(",") if profile.preferred_countries else []
    )
    profile_dict = {
        "current_education_level": profile.current_education_level,
        "degree_major": profile.degree_major,
        "graduation_year": profile.graduation_year,
        "gpa": profile.gpa,
        "intended_degree": profile.intended_degree,
        "field_of_study": profile.field_of_study,
        "target_intake_year": profile.target_intake_year,
        "preferred_countries": preferred_countries,
        "budget_per_year": profile.budget_per_year,
        "funding_plan": profile.funding_plan,
        "ielts_toefl_status": profile.ielts_toefl_status.value,
        "gre_gmat_status": profile.gre_gmat_status.value,
        "sop_status": profile.sop_status.value,
    }
    
    # Build system prompt with ALL context
    system_prompt = llm.build_system_prompt(
        profile=profile_dict,
        stage=profile.current_stage.value,
        universities=universities_context,
        all_universities=all_universities_context,
    )
    
    # Call LLM
    llm_messages = [{"role": "user", "content": message.content}]
    result = await llm.chat_with_llm(llm_messages, system_prompt)
    
    content = result.get("content", "I'm here to help with your study abroad journey.")
    actions_raw = result.get("actions", [])
    
    # Convert actions to schema format AND execute them
    actions: List[schemas.CounsellorAction] = []
    executed_messages = []
    
    for action in actions_raw:
        action_type = action.get("type", "")
        payload = action.get("payload", {})
        
        # AUTO-EXECUTE: Create Todo
        if action_type == "create_todo" and payload.get("title"):
            # Get university_id if provided
            university_id = payload.get("university_id")
            
            todo = models.Todo(
                user_id=current_user.id,
                title=payload.get("title", "AI Suggested Task"),
                description=payload.get("description", ""),
                status=models.TodoStatusEnum.PENDING,
                related_university_id=university_id,
                created_by_ai=True,
            )
            db.add(todo)
            db.commit()
            uni_name = ""
            if university_id:
                uni = db.query(models.University).filter(models.University.id == university_id).first()
                uni_name = f" for {uni.name}" if uni else ""
            executed_messages.append(f"✅ Created task{uni_name}: {payload.get('title')}")
        
        # AUTO-EXECUTE: Shortlist University
        elif action_type == "shortlist_university" and payload.get("university_id"):
            uni_id = payload.get("university_id")
            category = payload.get("category", "target")
            
            # Check if already shortlisted
            existing = db.query(models.UserUniversity).filter(
                models.UserUniversity.user_id == current_user.id,
                models.UserUniversity.university_id == uni_id,
            ).first()
            
            if not existing:
                university = db.query(models.University).filter(models.University.id == uni_id).first()
                if university:
                    # Determine category enum
                    cat_enum = models.UniversityCategoryEnum.TARGET
                    if category.lower() == "dream":
                        cat_enum = models.UniversityCategoryEnum.DREAM
                    elif category.lower() == "safe":
                        cat_enum = models.UniversityCategoryEnum.SAFE
                    
                    # Determine acceptance chance based on category
                    if cat_enum == models.UniversityCategoryEnum.DREAM:
                        acceptance = models.AcceptanceChanceEnum.LOW
                    elif cat_enum == models.UniversityCategoryEnum.SAFE:
                        acceptance = models.AcceptanceChanceEnum.HIGH
                    else:
                        acceptance = models.AcceptanceChanceEnum.MEDIUM
                    
                    user_uni = models.UserUniversity(
                        user_id=current_user.id,
                        university_id=uni_id,
                        category=cat_enum,
                        status=models.UniversityStatusEnum.SHORTLISTED,
                        fit_reason=payload.get("reason", "AI recommended"),
                        acceptance_chance=acceptance,
                    )
                    db.add(user_uni)
                    db.commit()
                    executed_messages.append(f"📋 Shortlisted: {university.name} as {category.upper()}")
                    
                    # Update stage if needed
                    if profile.current_stage == models.StageEnum.BUILDING_PROFILE:
                        profile.current_stage = models.StageEnum.DISCOVERING_UNIVERSITIES
                        db.commit()
        
        # AUTO-EXECUTE: Lock University
        elif action_type == "lock_university":
            user_uni = None
            
            # Support both user_university_id and university_id
            if payload.get("user_university_id"):
                uu_id = payload.get("user_university_id")
                user_uni = db.query(models.UserUniversity).filter(
                    models.UserUniversity.id == uu_id,
                    models.UserUniversity.user_id == current_user.id,
                ).first()
            elif payload.get("university_id"):
                # Find by university_id in user's shortlist
                uni_id = payload.get("university_id")
                user_uni = db.query(models.UserUniversity).filter(
                    models.UserUniversity.university_id == uni_id,
                    models.UserUniversity.user_id == current_user.id,
                ).first()
                
                # If not in shortlist yet, auto-add it first
                if not user_uni:
                    university = db.query(models.University).filter(models.University.id == uni_id).first()
                    if university:
                        user_uni = models.UserUniversity(
                            user_id=current_user.id,
                            university_id=uni_id,
                            category=models.UniversityCategoryEnum.TARGET,
                            status=models.UniversityStatusEnum.SHORTLISTED,
                            fit_reason=payload.get("reason", "AI recommended"),
                            acceptance_chance=models.AcceptanceChanceEnum.MEDIUM,
                        )
                        db.add(user_uni)
                        db.commit()
                        db.refresh(user_uni)
                        executed_messages.append(f"📋 Auto-shortlisted: {university.name}")
            
            if user_uni and user_uni.status != models.UniversityStatusEnum.LOCKED:
                user_uni.status = models.UniversityStatusEnum.LOCKED
                db.commit()
                executed_messages.append(f"🔒 Locked: {user_uni.university.name}")
                
                # Update stage
                profile.current_stage = models.StageEnum.PREPARING_APPLICATIONS
                db.commit()
        
        actions.append(
            schemas.CounsellorAction(type=action_type, payload=payload)
        )
    
    # Add execution summary to response if actions were executed
    if executed_messages:
        content += "\n\n---\n**Actions I've taken:**\n" + "\n".join(executed_messages)
    
    return schemas.CounsellorResponse(
        messages=[schemas.CounsellorMessage(role="assistant", content=content)],
        actions=actions,
    )


# -------------------------
# Chat History Endpoints
# -------------------------

@app.get("/chat/history", response_model=List[schemas.ChatMessageOut])
def get_chat_history(
    session_id: str = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get chat history, optionally filtered by session."""
    query = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    )
    if session_id:
        query = query.filter(models.ChatMessage.session_id == session_id)
    
    messages = query.order_by(models.ChatMessage.created_at.desc()).limit(limit).all()
    return list(reversed(messages))


@app.get("/chat/sessions")
def get_chat_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get list of chat sessions with previews."""
    sessions = (
        db.query(
            models.ChatMessage.session_id,
            func.min(models.ChatMessage.created_at).label("started_at"),
            func.count(models.ChatMessage.id).label("message_count"),
        )
        .filter(models.ChatMessage.user_id == current_user.id)
        .filter(models.ChatMessage.session_id.isnot(None))
        .group_by(models.ChatMessage.session_id)
        .order_by(func.min(models.ChatMessage.created_at).desc())
        .limit(20)
        .all()
    )
    
    result = []
    for session in sessions:
        # Get first user message as preview
        first_msg = (
            db.query(models.ChatMessage)
            .filter(
                models.ChatMessage.user_id == current_user.id,
                models.ChatMessage.session_id == session.session_id,
                models.ChatMessage.role == models.ChatRoleEnum.USER,
            )
            .order_by(models.ChatMessage.created_at.asc())
            .first()
        )
        preview = first_msg.content[:100] if first_msg else "New conversation"
        
        result.append({
            "session_id": session.session_id,
            "started_at": session.started_at,
            "message_count": session.message_count,
            "preview": preview + ("..." if first_msg and len(first_msg.content) > 100 else ""),
        })
    
    return {"sessions": result, "total_sessions": len(result)}


@app.post("/chat/message")
def save_chat_message(
    message: schemas.CounsellorMessage,
    session_id: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Save a chat message to history."""
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())[:8]
    
    role_enum = models.ChatRoleEnum.USER if message.role == "user" else models.ChatRoleEnum.ASSISTANT
    
    chat_msg = models.ChatMessage(
        user_id=current_user.id,
        role=role_enum,
        content=message.content,
        session_id=session_id,
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)
    
    return {"id": chat_msg.id, "session_id": session_id}


@app.delete("/chat/session/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Delete all messages in a chat session."""
    deleted = (
        db.query(models.ChatMessage)
        .filter(
            models.ChatMessage.user_id == current_user.id,
            models.ChatMessage.session_id == session_id,
        )
        .delete()
    )
    db.commit()
    return {"deleted": deleted}


# -------------------------
# Avatar / Profile Picture Endpoints
# -------------------------

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "avatars")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/user/avatar", response_model=schemas.AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Upload a profile picture."""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)
    
    # Update user avatar URL
    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    
    return schemas.AvatarUploadResponse(
        avatar_url=avatar_url,
        message="Avatar uploaded successfully"
    )


@app.post("/user/avatar/base64")
def upload_avatar_base64(
    data: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Upload avatar as base64 string (for easier frontend integration)."""
    image_data = data.get("image")
    if not image_data:
        raise HTTPException(status_code=400, detail="No image data provided")
    
    # Parse base64 data URL
    if "," in image_data:
        header, image_data = image_data.split(",", 1)
        ext = "png" if "png" in header else "jpg"
    else:
        ext = "png"
    
    # Decode and save
    try:
        image_bytes = base64.b64decode(image_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")
    
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        f.write(image_bytes)
    
    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    
    return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully"}


@app.get("/user/me", response_model=schemas.UserWithAvatar)
def get_current_user_profile(
    current_user: models.User = Depends(auth.get_current_user),
):
    """Get current user profile including avatar."""
    return current_user


@app.delete("/user/avatar")
def delete_avatar(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Remove user's avatar."""
    if current_user.avatar_url:
        # Try to delete file
        try:
            filepath = os.path.join(
                os.path.dirname(__file__), "..", 
                current_user.avatar_url.lstrip("/")
            )
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass
        
        current_user.avatar_url = None
        db.commit()
    
    return {"message": "Avatar removed"}


# -------------------------
# Mock Interview Simulator
# -------------------------

class InterviewFeedbackRequest(BaseModel):
    """Request body for interview feedback."""
    interview_type: str  # "visa" or "admission"
    question_number: int
    question: str
    answer: str
    university_name: str
    country: str
    program: str


class InterviewScoreRequest(BaseModel):
    """Request body for interview scoring."""
    interview_type: str
    messages: list[dict]
    university_name: str
    country: str
    program: str


@app.post("/interview/feedback")
async def get_interview_feedback(
    request: InterviewFeedbackRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Get AI feedback on an interview answer.
    """
    interview_type_label = "Visa Interview" if request.interview_type == "visa" else "University Admission Interview"
    
    system_prompt = f"""You are an experienced {interview_type_label} coach for international students applying to {request.university_name} in {request.country} for the {request.program} program.

Your role is to provide constructive feedback on the student's answer to help them improve their interview skills.

Guidelines:
- Be encouraging but honest
- Point out strengths in their answer
- Suggest specific improvements
- Keep feedback concise (2-3 sentences max)
- Focus on clarity, confidence, and relevance

For visa interviews, focus on: demonstrating ties to home country, clear study plans, financial preparedness, and genuine intent to return.

For admission interviews, focus on: passion for the field, relevant experience, career goals alignment, and unique qualities."""

    messages = [
        {
            "role": "user",
            "content": f"Question: {request.question}\n\nStudent's Answer: {request.answer}\n\nProvide brief, helpful feedback (2-3 sentences):"
        }
    ]

    try:
        response = await llm.chat_with_llm(messages, system_prompt)
        feedback = response.get("reply", "Good answer! Consider adding more specific examples to strengthen your response.")
        return {"feedback": feedback}
    except Exception as e:
        return {"feedback": "Good attempt! Try to be more specific and confident in your delivery."}


@app.post("/interview/score")
async def get_interview_score(
    request: InterviewScoreRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Get final score and summary for completed interview.
    """
    interview_type_label = "Visa Interview" if request.interview_type == "visa" else "University Admission Interview"
    
    # Format conversation for analysis
    conversation = "\n".join([
        f"{'Interviewer' if m['role'] == 'interviewer' else 'Student' if m['role'] == 'user' else 'Feedback'}: {m['content']}"
        for m in request.messages
    ])
    
    system_prompt = f"""You are an experienced {interview_type_label} evaluator for international students.

Analyze the complete interview and provide:
1. A score from 0-100
2. A brief summary of performance (3-4 sentences)

Scoring criteria:
- 90-100: Excellent - Clear, confident, well-prepared responses
- 75-89: Good - Solid answers with minor areas for improvement  
- 60-74: Fair - Some good points but needs more preparation
- Below 60: Needs significant improvement

Respond in exactly this format:
SCORE: [number]
SUMMARY: [your evaluation]"""

    messages = [
        {
            "role": "user", 
            "content": f"Interview for {request.university_name}, {request.country} - {request.program}\n\n{conversation}\n\nProvide your evaluation:"
        }
    ]

    try:
        response = await llm.chat_with_llm(messages, system_prompt)
        reply = response.get("reply", "SCORE: 75\nSUMMARY: Good effort overall. You showed genuine interest and gave thoughtful responses.")
        
        # Parse score and summary
        lines = reply.split("\n")
        score = 75
        summary = "Good effort overall. You showed genuine interest and gave thoughtful responses. Continue practicing to build more confidence."
        
        for line in lines:
            if line.upper().startswith("SCORE:"):
                try:
                    score_str = line.split(":")[1].strip()
                    score = int(''.join(filter(str.isdigit, score_str[:3])))
                    score = max(0, min(100, score))
                except:
                    pass
            elif line.upper().startswith("SUMMARY:"):
                summary = line.split(":", 1)[1].strip()
        
        return {"score": score, "summary": summary}
    except Exception as e:
        return {
            "score": 75,
            "summary": "Good effort overall. You demonstrated knowledge and enthusiasm. Keep practicing to improve your confidence and clarity."
        }

