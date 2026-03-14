# QuizGenius — AI-Powered Quiz Application

A full-stack quiz application where users generate AI-powered quizzes, take them, and track their performance.

**Tech Stack**: Next.js 15 (Frontend) · Django REST Framework (Backend) · PostgreSQL (Database) · Google Gemini AI

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+
- A free [Google Gemini API key](https://aistudio.google.com/)

---

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: Add your GEMINI_API_KEY
# (By default it uses SQLite locally so you don't need to configure Postgres right away)

# Run migrations
python manage.py migrate

# (Optional) Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver
```
Backend runs at `http://localhost:8000`

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Environment is pre-configured (.env.local points to localhost:8000)

# Start dev server
npm run dev
```
Frontend runs at `http://localhost:3000`

---

## 🗃️ Database Design Decisions

### Models

| Model | Purpose |
|-------|---------|
| `User` (Django built-in) | Authentication, profile |
| `UserProfile` | One-to-one with User for stats (total quizzes, avg score) |
| `Quiz` | A quiz "blueprint" — topic, difficulty, num_questions, is_generated flag |
| `Question` | One Question belongs to one Quiz. Stores 4 options + correct answer + explanation |
| `QuizAttempt` | One attempt per "sitting". Supports retakes — each retake = new attempt |
| `UserAnswer` | One answer per question per attempt. Records selected_answer + is_correct |

### Key Design Decisions

**Why separate Quiz from QuizAttempt?**  
A Quiz is a *template* (the questions). An Attempt is an *instance* of taking it. This cleanly enables retakes — the same questions, a fresh attempt.

**Why store 4 options as separate columns (option_a/b/c/d)?**  
Avoids JSON fields which are harder to query/validate. Each option is atomic and easy to display.

**Why Django's built-in User model?**  
It comes with password hashing, admin, session management, and validation for free. Avoid reinventing the wheel.

**Why `unique_together` on (attempt, question) in UserAnswer?**  
Prevents duplicate answers for the same question in one attempt, enforcing data integrity.

---

## 🔗 API Structure

### Auth

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register/` | Register new user, returns JWT tokens |
| POST | `/api/auth/login/` | Login, returns JWT tokens + user |
| POST | `/api/auth/logout/` | Blacklist refresh token |
| GET | `/api/auth/me/` | Get current user profile |
| POST | `/api/auth/token/refresh/` | Refresh JWT access token |

### Quizzes

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/quizzes/generate/` | Generate quiz via AI |
| GET | `/api/quizzes/` | List user's quizzes |
| GET | `/api/quizzes/:id/` | Get quiz + questions (no answers) |
| DELETE | `/api/quizzes/:id/` | Delete quiz |
| POST | `/api/quizzes/:id/attempt/` | Start a new attempt (supports retakes) |

### Attempts

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/attempts/:id/submit/` | Submit all answers at once |
| GET | `/api/attempts/:id/results/` | Get results + correct answers revealed |
| GET | `/api/attempts/history/` | All past completed attempts |

---

## 🤖 AI Integration

- **Provider**: Google Gemini (`gemini-2.0-flash` model)
- **Why Gemini?** Free tier available at [aistudio.google.com](https://aistudio.google.com), no credit card required, excellent JSON generation
- **Prompt Strategy**: Structured prompt requesting strict JSON array output with specific fields
- **Validation**: Every AI response is parsed and validated — checks for required fields, valid answer letters (A/B/C/D), and proper types
- **Error Handling**: Malformed JSON → clear error message; API failure → quiz saved as failed with error logged

---

## ✅ Features Implemented

- [x] User registration and JWT authentication
- [x] AI quiz generation with topic, difficulty, question count
- [x] Quiz taking with progress tracking and dot navigation
- [x] Answer submission (all at once)
- [x] Results page with score, time, and expandable answer review
- [x] Quiz history with stats
- [x] Retake quizzes
- [x] Dashboard with stats (quizzes created, taken, avg score)
- [x] Admin panel

## ⏭️ Features Skipped (and Why)

- **Timer per question**: Added complexity to UX without core value for an MVP
- **Leaderboard**: Requires more complex queries; good for v2
- **Category tagging**: Free-text topic is sufficient for MVP
- **Email verification**: Not required for demo/assignment scope

---

## 🧩 Challenges Faced

### 1. AI Response Parsing
**Challenge**: Gemini sometimes returns JSON wrapped in markdown code blocks (````json ... ````).  
**Solution**: Strip code block markers before parsing; added explicit prompt rule "Return ONLY the JSON array".

### 2. JWT Token Refresh
**Challenge**: Access tokens expire; frontend needed seamless refresh without re-login.  
**Solution**: API client intercepts 401 responses, attempts token refresh, and retries the original request once.

### 3. Retakes Architecture
**Challenge**: How to allow retakes without duplicating question data?  
**Solution**: Separate `QuizAttempt` model. Each retake creates a new attempt record referencing the same Quiz and Questions.

---

## 🏗️ Architecture

```
Frontend (Next.js)    ←→    Backend (Django RF)    ←→    Database (PostgreSQL)
     ↓                              ↓
AuthContext                  JWT Middleware
API Client (lib/api.ts)      Gemini AI Service
```
