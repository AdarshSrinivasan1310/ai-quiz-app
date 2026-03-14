"""
AI service for generating quiz questions using Google Gemini.

Design Decision: Using Gemini gemini-2.0-flash model (free tier) because:
- It's free and doesn't require a credit card
- Fast response times for quiz generation
- Excellent JSON output quality

We request the AI to return a strict JSON format, which we parse and validate
before saving to the database. If parsing fails, we raise clear errors.
"""
import json
from google import genai
from google.genai import types
from django.conf import settings


def get_gemini_client():
    """Initialize Gemini client with API key from settings."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured. Add it to your .env file.")
    return genai.Client(api_key=api_key)


def generate_quiz_questions(topic: str, num_questions: int, difficulty: str) -> list[dict]:
    """
    Calls Gemini API to generate multiple-choice questions.
    
    Args:
        topic: Subject matter for the quiz
        num_questions: How many questions to generate (5-20)
        difficulty: 'easy', 'medium', or 'hard'
    
    Returns:
        List of question dicts:
        {
            "question_text": str,
            "option_a": str,
            "option_b": str,
            "option_c": str,
            "option_d": str,
            "correct_answer": "A"|"B"|"C"|"D",
            "explanation": str
        }
    """
    client = get_gemini_client()

    difficulty_descriptions = {
        'easy': 'basic concepts suitable for beginners',
        'medium': 'intermediate concepts requiring some prior knowledge',
        'hard': 'advanced concepts requiring deep expertise',
    }

    prompt = f"""Generate exactly {num_questions} multiple-choice quiz questions about "{topic}".
Difficulty level: {difficulty} ({difficulty_descriptions.get(difficulty, 'intermediate concepts')})

IMPORTANT: Respond with ONLY a valid JSON array — no markdown, no code blocks, no extra text.

Each element in the array must have exactly this structure:
{{
  "question_text": "The full question text here",
  "option_a": "First option text",
  "option_b": "Second option text",
  "option_c": "Third option text",
  "option_d": "Fourth option text",
  "correct_answer": "A",
  "explanation": "Brief explanation of why this answer is correct (1-2 sentences)"
}}

Rules:
- correct_answer must be exactly one of: A, B, C, D
- Each option must be distinct and plausible (no obviously wrong options)
- Questions must be clearly and unambiguously worded
- Generate exactly {num_questions} questions
- Return ONLY the JSON array, nothing else"""

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=8192,
            )
        )

        raw_text = response.text.strip()

        # Clean up common AI response formatting issues
        if raw_text.startswith('```json'):
            raw_text = raw_text[7:]
        elif raw_text.startswith('```'):
            raw_text = raw_text[3:]
        if raw_text.endswith('```'):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        # Parse JSON
        questions = json.loads(raw_text)

        if not isinstance(questions, list):
            raise ValueError("AI response is not a JSON array")

        # Validate each question
        required_fields = ['question_text', 'option_a', 'option_b', 'option_c',
                           'option_d', 'correct_answer']
        valid_answers = {'A', 'B', 'C', 'D'}

        validated = []
        for i, q in enumerate(questions):
            for field in required_fields:
                if field not in q:
                    raise ValueError(f"Question {i+1} is missing required field: '{field}'")

            answer = str(q['correct_answer']).strip().upper()
            if answer not in valid_answers:
                raise ValueError(f"Question {i+1} has invalid correct_answer: '{q['correct_answer']}'")

            validated.append({
                'question_text': str(q['question_text']).strip(),
                'option_a': str(q['option_a']).strip(),
                'option_b': str(q['option_b']).strip(),
                'option_c': str(q['option_c']).strip(),
                'option_d': str(q['option_d']).strip(),
                'correct_answer': answer,
                'explanation': str(q.get('explanation', '')).strip(),
            })

        return validated

    except json.JSONDecodeError as e:
        raise ValueError(f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        raise Exception(f"AI generation failed: {str(e)}")
