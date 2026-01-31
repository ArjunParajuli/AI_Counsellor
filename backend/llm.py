"""
OpenRouter LLM Client for AI Counsellor.

This module provides integration with OpenRouter API, which gives access
to various LLM models including Claude, GPT-4, etc.
"""

import json
import os
from typing import Any

import httpx

from .config import get_settings


OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def get_openrouter_api_key() -> str:
    """Get OpenRouter API key from environment."""
    key = os.getenv("OPENROUTER_API_KEY", "")
    if not key:
        settings = get_settings()
        key = getattr(settings, "openrouter_api_key", "")
    return key


def build_system_prompt(profile: dict, stage: str, universities: list[dict], all_universities: list[dict] = None) -> str:
    """
    Build a comprehensive system prompt that gives the AI full context
    about the user's profile, current stage, and university choices.
    """
    countries = profile.get("preferred_countries", [])
    if isinstance(countries, str):
        countries = countries.split(",")
    
    shortlisted = [u for u in universities if u.get("status") == "shortlisted"]
    locked = [u for u in universities if u.get("status") == "locked"]
    
    # Calculate profile gaps
    gaps = []
    if profile.get("ielts_toefl_status") != "completed":
        gaps.append("English proficiency test (IELTS/TOEFL)")
    if profile.get("gre_gmat_status") != "completed":
        gaps.append("GRE/GMAT exam")
    if profile.get("sop_status") != "ready":
        gaps.append("Statement of Purpose")
    if not profile.get("gpa"):
        gaps.append("GPA/grades not specified")
    
    # Calculate profile strength
    strength_score = 0
    if profile.get("ielts_toefl_status") == "completed": strength_score += 25
    elif profile.get("ielts_toefl_status") == "in_progress": strength_score += 10
    if profile.get("gre_gmat_status") == "completed": strength_score += 25
    elif profile.get("gre_gmat_status") == "in_progress": strength_score += 10
    if profile.get("sop_status") == "ready": strength_score += 25
    elif profile.get("sop_status") == "draft": strength_score += 10
    if profile.get("gpa"): strength_score += 15
    if len(shortlisted) >= 3: strength_score += 5
    if len(locked) >= 1: strength_score += 5
    
    prompt = f"""You are an elite AI Study Abroad Counsellor. You don't just give advice—you TAKE ACTIONS.

## Your Core Responsibility
Help this student succeed in their study abroad journey by:
1. Analyzing their profile strengths and gaps
2. Recommending specific universities with clear reasoning
3. EXECUTING actions directly (shortlist, lock, create tasks)
4. Guiding them step-by-step through each stage

## Student Profile (Profile Strength: {strength_score}%)
- **Education**: {profile.get('current_education_level', 'Unknown')} in {profile.get('degree_major', 'Unknown')}
- **Graduation Year**: {profile.get('graduation_year', 'Unknown')}
- **GPA**: {profile.get('gpa', 'Not provided')} {'✓' if profile.get('gpa') else '⚠️ Missing'}
- **Target Degree**: {profile.get('intended_degree', 'Unknown').upper()} in {profile.get('field_of_study', 'Unknown')}
- **Target Intake**: {profile.get('target_intake_year', 'Unknown')}
- **Preferred Countries**: {', '.join(countries) if countries else 'Not specified'}
- **Budget**: ${profile.get('budget_per_year', 0):,}/year
- **Funding**: {profile.get('funding_plan', 'Unknown')}

## Exam & Document Status
| Item | Status | Score Impact |
|------|--------|--------------|
| IELTS/TOEFL | {profile.get('ielts_toefl_status', 'Unknown')} | {'✅ +25%' if profile.get('ielts_toefl_status') == 'completed' else '⏳' if profile.get('ielts_toefl_status') == 'in_progress' else '❌ 0%'} |
| GRE/GMAT | {profile.get('gre_gmat_status', 'Unknown')} | {'✅ +25%' if profile.get('gre_gmat_status') == 'completed' else '⏳' if profile.get('gre_gmat_status') == 'in_progress' else '❌ 0%'} |
| SOP | {profile.get('sop_status', 'Unknown')} | {'✅ +25%' if profile.get('sop_status') == 'ready' else '⏳' if profile.get('sop_status') == 'draft' else '❌ 0%'} |

## Profile Gaps to Address
{chr(10).join(['- ' + g for g in gaps]) if gaps else '- None! Profile looks complete.'}

## Current Stage: **{stage.replace('_', ' ').title()}**
"""

    if shortlisted:
        prompt += f"\n## Shortlisted Universities ({len(shortlisted)})\n"
        for u in shortlisted:
            uni = u.get("university", {})
            prompt += f"- **{uni.get('name', 'Unknown')}** ({uni.get('country', '')}) — ID: {u.get('university_id')}, Category: {u.get('category', 'target').upper()}\n"
    else:
        prompt += "\n## Shortlisted Universities\n- None yet. Help the student shortlist!\n"
    
    if locked:
        prompt += f"\n## Locked Universities ({len(locked)}) ✅ — Use these IDs when creating tasks!\n"
        for u in locked:
            uni = u.get("university", {})
            prompt += f"- **{uni.get('name', 'Unknown')}** ({uni.get('country', '')}) — ID: {u.get('university_id')}, COMMITTED\n"

    # Add available universities context
    if all_universities:
        prompt += f"\n## Available Universities for Recommendation ({len(all_universities)} in database)\n"
        for uni in all_universities[:10]:
            prompt += f"- ID {uni.get('id')}: **{uni.get('name')}** ({uni.get('country')}) — ${uni.get('tuition_per_year', 0):,}/yr, {uni.get('field_of_study')}\n"
        if len(all_universities) > 10:
            prompt += f"... and {len(all_universities) - 10} more.\n"

    prompt += """

## YOUR SUPERPOWERS (Use Them!)

You can EXECUTE these actions directly. The system will perform them automatically:

| Action | What It Does | When To Use |
|--------|--------------|-------------|
| `shortlist_university` | Adds a university to student's shortlist | When recommending Dream/Target/Safe schools |
| `lock_university` | Commits student to a university | When student is ready to focus on applications |
| `create_todo` | Creates a task in student's to-do list | For actionable next steps |
| `recommend_university` | Shows a university card with full details | When explaining why a school fits |


## Action Format (CRITICAL!)
Include actions at the END of your response in this EXACT format:
```actions
[
  {"type": "shortlist_university", "payload": {"university_id": 1, "category": "dream", "reason": "Top CS program within budget"}},
  {"type": "lock_university", "payload": {"university_id": 1, "reason": "Best fit for your goals"}},
  {"type": "create_todo", "payload": {"title": "Schedule IELTS exam", "description": "Book at least 8 weeks before application deadline", "university_id": 1}},
  {"type": "recommend_university", "payload": {"university_id": 2, "category": "target", "fit_reason": "Matches your budget and field", "risk": "Competitive admissions"}}
]
```

**IMPORTANT for create_todo**: When creating tasks for a LOCKED university, ALWAYS include "university_id" with the university's ID. This links the task to that specific university. Only omit university_id for general tasks not specific to any university.



## Response Style
1. **Be proactive** — Don't just answer, take action
2. **Be specific** — Reference exact universities by name and ID
3. **Explain reasoning** — Why is this school Dream/Target/Safe for THIS student?
4. **Create urgency** — What should they do RIGHT NOW?
5. **Celebrate progress** — Acknowledge what they've accomplished

## Stage-Specific Guidance
- **Building Profile**: Focus on exam prep, SOP drafting, completing profile
- **Discovering Universities**: Actively shortlist 3-5 schools (mix of Dream/Target/Safe)
- **Finalizing Universities**: Push for locking decisions, compare options
- **Preparing Applications**: Create document checklists, deadline tasks, SOP review
"""
    return prompt


async def chat_with_llm(
    messages: list[dict],
    system_prompt: str,
    model: str = "qwen/qwen3-next-80b-a3b-instruct:free",
) -> dict[str, Any]:
    """
    Send a chat request to OpenRouter and get the AI response.
    
    Returns:
        dict with "content" (str) and "actions" (list of action dicts)
    """
    api_key = get_openrouter_api_key()
    
    if not api_key:
        # Fallback to rule-based response if no API key
        return {
            "content": "I'm your AI counsellor. To enable full AI capabilities, please configure the OPENROUTER_API_KEY environment variable. For now, I can provide basic guidance based on your profile.",
            "actions": []
        }
    
    # Build the request
    full_messages = [{"role": "system", "content": system_prompt}]
    full_messages.extend(messages)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Counsellor",
    }
    
    payload = {
        "model": model,
        "messages": full_messages,
        "temperature": 0.7,
        "max_tokens": 1500,
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        
        # Parse actions from the response
        actions = []
        if "```actions" in content:
            try:
                actions_start = content.index("```actions") + len("```actions")
                actions_end = content.index("```", actions_start)
                actions_json = content[actions_start:actions_end].strip()
                actions = json.loads(actions_json)
                # Remove the actions block from displayed content
                content = content[:content.index("```actions")].strip()
            except (ValueError, json.JSONDecodeError):
                pass
        
        return {"content": content, "actions": actions}
        
    except httpx.HTTPStatusError as e:
        return {
            "content": f"I encountered an error connecting to the AI service. Please try again. (Error: {e.response.status_code})",
            "actions": []
        }
    except Exception as e:
        return {
            "content": f"Something went wrong. Please try again. (Error: {str(e)})",
            "actions": []
        }
