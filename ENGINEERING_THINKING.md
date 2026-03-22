# Decision Making & Project Thinking: AI Quiz Platform

## 1. Architectural Philosophy
The core objective was to build a **production-ready, zero-friction** application. I chose a **Decoupled Architecture** (Next.js Frontend + Django Backend) because it provides the best scalability and clean separation of concerns.

### Why Django REST Framework?
- **Speed of Development**: Django's "batteries-included" approach allowed me to handle Authentication (JWT), Database Migrations, and Admin panels in hours rather than days.
- **Safety**: Built-in protection against SQL Injection, CSRF, and XSS ensures the app is secure by default.

### Why Next.js 15?
- **User Experience**: Server-side rendering and static optimization make the app feel instant.
- **API Integration**: Using React Context and custom hooks made token management and auth state effortless across the UI.

---

## 2. Database Design Decisions
I prioritized **Data Integrity** over simple storage. I used a Relational Schema (PostgreSQL/SQLite) with clear entities:
- **`Quiz`**: Stores the structure/topic.
- **`Question`**: Linked to Quizzes, allowing for many-to-one relationships.
- **`QuizAttempt`**: Explicitly tracks a user's session. 
- **`UserAnswer`**: Links an attempt to a specific question.
- **Logic**: By separating `Attempts` from `Quizzes`, the app support **Retakes**. Most simple quiz apps just store a score; this app stores every individual choice made, enabling detailed feedback and analytics.

---

## 3. The AI "Decision Tree"
Integrating LLMs involves handling unpredictability.
- **Decision**: I didn't just "send a prompt." I implemented a **JSON Schema Enforced Prompt**. 
- **Thinking**: Instead of asking for a list, I explicitly demanded a JSON array. I then wrote a Python "Sanitizer" that strips markdown backticks and validates every field before it even touches the database. 
- **Model Choice**: Primarily used `gemini-flash` for its extreme speed and low latency, essential for a "live" feel.

---

## 4. Challenges & Solutions

### Challenge: Rate Limiting & API Stability
**Solution**: Implemented a "Fail-Safe" state. If the AI service fails or hits a quota, the system captures the error and displays a helpful message instead of crashing the backend.

### Challenge: JWT Complexity
**Solution**: Built a custom `api.ts` utility that handles Axios interceptors. If a token expires, it silently attempts to refresh it before the user even notices a disruption.

### Challenge: Deployment Friction
**Solution**: I created a `render.yaml` and a `vercel.json`. Even though the app is complex, it can be deployed to the cloud in one click because all infrastructure-as-code is already in the repo.Also the api-key being exposed was a major hindrance and modification was needed to be done so as to not get blacklisted for the api key

---

## 5. UI/UX: From "AI-ish" to Professional
The design evolved from a vibrant, gradient-heavy theme to a **Subtle Enterprise SaaS** aesthetic. 
- **Reasoning**: To make the tool feel like a serious educational utility rather than just a tech demo. I switched to a Slate-Sapphire palette with a focus on high-quality typography and subtle shadows.

---

## 6. What was Skipped (and Why)
- **Email Verification**: Skipped to ensure a **"Zero-Friction"** test for the interviewer. Requiring a real email would slow down evaluation.
- **Leaderboards**: Intentionally kept it private/user-focused to ensure high privacy and simplified data fetches for the initial MVP.

---
**Adarsh Srinivasan**  

