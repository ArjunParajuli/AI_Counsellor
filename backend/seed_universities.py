"""
Seed script to populate the database with universities from various countries.
Run with: python -m backend.seed_universities
"""
from .database import SessionLocal, engine, Base
from . import models

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

UNIVERSITIES = [
    # USA - Top Universities
    {"name": "Massachusetts Institute of Technology", "country": "USA", "city": "Cambridge", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 58000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "World-renowned for engineering and technology programs."},
    {"name": "Stanford University", "country": "USA", "city": "Stanford", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 56000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "Silicon Valley's top university with strong industry connections."},
    {"name": "Carnegie Mellon University", "country": "USA", "city": "Pittsburgh", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 52000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "Top-ranked CS program with focus on AI and robotics."},
    {"name": "University of California Berkeley", "country": "USA", "city": "Berkeley", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 45000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "Leading public university with excellent research opportunities."},
    {"name": "Georgia Institute of Technology", "country": "USA", "city": "Atlanta", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 32000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Top engineering school with affordable tuition."},
    {"name": "University of Texas at Austin", "country": "USA", "city": "Austin", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 28000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Growing tech hub with strong industry partnerships."},
    {"name": "Arizona State University", "country": "USA", "city": "Tempe", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 22000, "cost_level": "low", "competition_level": "low", "base_acceptance_chance": "high", "description": "Innovation-focused university with flexible programs."},
    
    # UK - Top Universities
    {"name": "University of Oxford", "country": "UK", "city": "Oxford", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 42000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "World's oldest English-speaking university with cutting-edge research."},
    {"name": "University of Cambridge", "country": "UK", "city": "Cambridge", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 40000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "Historic excellence in science and technology."},
    {"name": "Imperial College London", "country": "UK", "city": "London", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 38000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "STEM-focused institution in the heart of London."},
    {"name": "University College London", "country": "UK", "city": "London", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 35000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Research-intensive university with diverse programs."},
    {"name": "University of Edinburgh", "country": "UK", "city": "Edinburgh", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 30000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Top Scottish university with strong AI research."},
    {"name": "University of Manchester", "country": "UK", "city": "Manchester", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 28000, "cost_level": "medium", "competition_level": "low", "base_acceptance_chance": "high", "description": "Birthplace of modern computing with excellent facilities."},
    
    # Canada
    {"name": "University of Toronto", "country": "Canada", "city": "Toronto", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 35000, "cost_level": "medium", "competition_level": "high", "base_acceptance_chance": "medium", "description": "Canada's top university with world-class AI research."},
    {"name": "University of British Columbia", "country": "Canada", "city": "Vancouver", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 32000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Beautiful campus with strong tech industry connections."},
    {"name": "McGill University", "country": "Canada", "city": "Montreal", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 25000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Research powerhouse in bilingual Montreal."},
    {"name": "University of Waterloo", "country": "Canada", "city": "Waterloo", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 28000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Famous for co-op programs and startup culture."},
    
    # Germany (Often Free/Low Cost)
    {"name": "Technical University of Munich", "country": "Germany", "city": "Munich", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 3000, "cost_level": "low", "competition_level": "high", "base_acceptance_chance": "medium", "description": "Top German technical university with minimal tuition."},
    {"name": "RWTH Aachen University", "country": "Germany", "city": "Aachen", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 2500, "cost_level": "low", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Excellent engineering programs at low cost."},
    {"name": "Technical University of Berlin", "country": "Germany", "city": "Berlin", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 2000, "cost_level": "low", "competition_level": "medium", "base_acceptance_chance": "high", "description": "Great programs in vibrant Berlin."},
    {"name": "Ludwig Maximilian University", "country": "Germany", "city": "Munich", "field_of_study": "Data Science", "degree_level": "masters", "tuition_per_year": 2500, "cost_level": "low", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Strong research university in beautiful Bavaria."},
    
    # Australia
    {"name": "University of Melbourne", "country": "Australia", "city": "Melbourne", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 42000, "cost_level": "high", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Australia's top-ranked university."},
    {"name": "University of Sydney", "country": "Australia", "city": "Sydney", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 40000, "cost_level": "high", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Prestigious university in iconic Sydney."},
    {"name": "Australian National University", "country": "Australia", "city": "Canberra", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 38000, "cost_level": "high", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Research-intensive in the capital city."},
    {"name": "UNSW Sydney", "country": "Australia", "city": "Sydney", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 36000, "cost_level": "medium", "competition_level": "low", "base_acceptance_chance": "high", "description": "Strong industry partnerships and employability focus."},
    
    # Netherlands
    {"name": "TU Delft", "country": "Netherlands", "city": "Delft", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 18000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Top Dutch technical university."},
    {"name": "University of Amsterdam", "country": "Netherlands", "city": "Amsterdam", "field_of_study": "Artificial Intelligence", "degree_level": "masters", "tuition_per_year": 15000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Excellent AI program in exciting Amsterdam."},
    {"name": "Eindhoven University of Technology", "country": "Netherlands", "city": "Eindhoven", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 16000, "cost_level": "medium", "competition_level": "low", "base_acceptance_chance": "high", "description": "Strong tech focus with industry collaborations."},
    
    # Singapore
    {"name": "National University of Singapore", "country": "Singapore", "city": "Singapore", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 35000, "cost_level": "medium", "competition_level": "high", "base_acceptance_chance": "medium", "description": "Asia's top university with global recognition."},
    {"name": "Nanyang Technological University", "country": "Singapore", "city": "Singapore", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 32000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Young university with rapid rise in rankings."},
    
    # Ireland
    {"name": "Trinity College Dublin", "country": "Ireland", "city": "Dublin", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 25000, "cost_level": "medium", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Ireland's oldest university in tech hub Dublin."},
    {"name": "University College Dublin", "country": "Ireland", "city": "Dublin", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 22000, "cost_level": "medium", "competition_level": "low", "base_acceptance_chance": "high", "description": "Large research university with global outlook."},
    
    # France
    {"name": "École Polytechnique", "country": "France", "city": "Paris", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 15000, "cost_level": "medium", "competition_level": "high", "base_acceptance_chance": "low", "description": "France's most prestigious engineering school."},
    {"name": "Sorbonne University", "country": "France", "city": "Paris", "field_of_study": "Computer Science", "degree_level": "masters", "tuition_per_year": 5000, "cost_level": "low", "competition_level": "medium", "base_acceptance_chance": "medium", "description": "Historic university with affordable tuition."},
    
    # Business/MBA Programs
    {"name": "Harvard Business School", "country": "USA", "city": "Boston", "field_of_study": "Business Administration", "degree_level": "mba", "tuition_per_year": 75000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "World's most prestigious MBA program."},
    {"name": "INSEAD", "country": "France", "city": "Fontainebleau", "field_of_study": "Business Administration", "degree_level": "mba", "tuition_per_year": 95000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "low", "description": "One-year accelerated MBA with global campuses."},
    {"name": "London Business School", "country": "UK", "city": "London", "field_of_study": "Business Administration", "degree_level": "mba", "tuition_per_year": 70000, "cost_level": "high", "competition_level": "high", "base_acceptance_chance": "medium", "description": "Top European MBA in global financial center."},
]


def seed_universities():
    """Seed the database with universities."""
    db = SessionLocal()
    try:
        # Check if already seeded
        existing_count = db.query(models.University).count()
        if existing_count >= 30:
            print(f"Database already has {existing_count} universities. Skipping seed.")
            return
        
        # Clear existing
        db.query(models.University).delete()
        db.commit()
        
        for uni_data in UNIVERSITIES:
            uni = models.University(
                name=uni_data["name"],
                country=uni_data["country"],
                city=uni_data["city"],
                field_of_study=uni_data["field_of_study"],
                degree_level=uni_data["degree_level"],
                tuition_per_year=uni_data["tuition_per_year"],
                cost_level=models.RiskLevelEnum(uni_data["cost_level"]),
                competition_level=models.RiskLevelEnum(uni_data["competition_level"]),
                base_acceptance_chance=models.AcceptanceChanceEnum(uni_data["base_acceptance_chance"]),
                description=uni_data.get("description"),
            )
            db.add(uni)
        
        db.commit()
        print(f"✅ Successfully seeded {len(UNIVERSITIES)} universities!")
        
    finally:
        db.close()


if __name__ == "__main__":
    seed_universities()
