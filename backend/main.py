from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import auth, models, schemas
from .database import Base, engine, get_db

# Create tables (for prototype). In production, use migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Counsellor Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in real deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
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

    access_token = auth.create_access_token(data={"sub": user.id})
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
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    todos = (
        db.query(models.Todo).filter(models.Todo.user_id == current_user.id).all()
    )
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
    # Require at least one locked university
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

    # For prototype: just use the first locked university
    chosen = locked[0]
    uni = chosen.university

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

    return {
        "locked_university": {
            "id": chosen.id,
            "name": uni.name,
            "country": uni.country,
        },
        "required_documents": documents,
        "timeline": timeline,
    }


# -------------------------
# AI counsellor (rule-based placeholder, Gemini-ready)
# -------------------------


@app.post("/counsellor", response_model=schemas.CounsellorResponse)
def counsellor_chat(
    message: schemas.CounsellorMessage,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """
    Simple rule-based counsellor that:
    - Reads profile and current stage
    - Suggests next actions and recommended universities
    - Returns structured actions for the UI to execute

    You can later swap the reasoning part with Gemini or another LLM.
    """
    profile = (
        db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    )
    if not profile or not profile.is_complete:
        reply = "Let's first complete your onboarding so I can understand your profile."
        return schemas.CounsellorResponse(
            messages=[schemas.CounsellorMessage(role="assistant", content=reply)],
            actions=[],
        )

    # Basic next-step logic based on stage
    if profile.current_stage == models.StageEnum.BUILDING_PROFILE:
        guidance = "You are still building your profile. Let's finalize your academic details and exams."
    elif profile.current_stage == models.StageEnum.DISCOVERING_UNIVERSITIES:
        guidance = "Next, we should discover universities that fit your budget and preferred countries."
    elif profile.current_stage == models.StageEnum.FINALIZING_UNIVERSITIES:
        guidance = "You have shortlisted universities. Now you should lock at least one to focus your strategy."
    else:
        guidance = "You have locked a university. Let's focus on completing application documents and deadlines."

    # Recommend up to 3 universities grouped as dream/target/safe based on simple rules
    universities = (
        db.query(models.University)
        .filter(
            models.University.field_of_study.ilike(f"%{profile.field_of_study}%"),
        )
        .all()
    )
    if not universities:
        seed_universities(db)
        universities = (
            db.query(models.University)
            .filter(
                models.University.field_of_study.ilike(f"%{profile.field_of_study}%"),
            )
            .all()
        )

    suggestions = []
    actions: List[schemas.CounsellorAction] = []
    for uni in universities[:3]:
        # approximate category
        if uni.tuition_per_year > profile.budget_per_year * 1.2:
            cat = "Dream"
            risk = "High cost relative to your stated budget and competitive intake."
        elif uni.tuition_per_year < profile.budget_per_year * 0.8:
            cat = "Safe"
            risk = "Cost-friendly with reasonable competition."
        else:
            cat = "Target"
            risk = "Balanced cost and competition for your profile."

        suggestion_text = (
            f"{cat}: {uni.name} in {uni.country} — good for {profile.field_of_study}. "
            f"Estimated acceptance chance: {uni.base_acceptance_chance.value}. {risk}"
        )
        suggestions.append(suggestion_text)

        actions.append(
            schemas.CounsellorAction(
                type="shortlist_suggestion",
                payload={
                    "university_id": uni.id,
                    "label": cat,
                },
            )
        )

    combined_message = guidance + "\n\nHere are some universities to consider:\n- " + "\n- ".join(
        suggestions
    )

    # Example to-do suggestion based on stage
    todo_action = None
    if profile.current_stage == models.StageEnum.PREPARING_APPLICATIONS:
        todo_action = schemas.CounsellorAction(
            type="create_todo",
            payload={
                "title": "Draft SOP for locked university",
                "description": "Write a first draft of your Statement of Purpose tailored to your locked university.",
            },
        )
    elif profile.current_stage == models.StageEnum.DISCOVERING_UNIVERSITIES:
        todo_action = schemas.CounsellorAction(
            type="create_todo",
            payload={
                "title": "Shortlist at least 3 universities",
                "description": "Use the discovery view to shortlist dream, target, and safe universities.",
            },
        )
    if todo_action:
        actions.append(todo_action)

    return schemas.CounsellorResponse(
        messages=[schemas.CounsellorMessage(role="assistant", content=combined_message)],
        actions=actions,
    )


