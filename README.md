# 🎓 QuizGenius — AI-Powered Learning Platform

An intelligent, full-stack quiz platform that uses Google Gemini to generate custom quizzes on any topic instantly. Designed for high scalability and zero-friction evaluation.

---

## 🚀 Quick Links
- **Live Demo (Frontend):** [ai-quiz-app-smoky.vercel.app](https://ai-quiz-app-smoky.vercel.app)
- **Production Backend:** [ai-quiz-backend-six.vercel.app](https://ai-quiz-backend-six.vercel.app/api/)
- **Detailed Thinking Process:** [ENGINEERING_THINKING.md](./ENGINEERING_THINKING.md)

---

## 🛠️ Local Setup (30 Seconds)

1. **Clone**:
   `git clone https://github.com/AdarshSrinivasan1310/ai-quiz-app`

2. **Backend**: 
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🗃️ Database Design Decisions

Consistent with modern normalized schemas:
- **`Quiz` & `Question`**: Decoupled to allow for complex quiz generation while keeping individual questions atomic.
- **`QuizAttempt`**: Explicitly separated from the Quiz model to support **Retakes**. One quiz can have unlimited attempts, allowing users to practice until mastery.
- **`UserAnswer`**: Records every individual choice. This allows for detailed post-quiz reviews where users can see exactly what they selected vs the correct answer.

---

## 🔗 API Structure

Built with **Django REST Framework** for security and speed:
- **Auth**: JWT-based (Register, Login, Refresh). 
- **Quizzes**: `/api/quizzes/generate/` handles AI logic; `/api/quizzes/` lists saved content.
- **Attempts**: `/api/attempts/submit/` uses atomic transactions to ensure score calculation and stats updates happen reliably.

---

## 🧩 Challenges & Solutions

| Challenge | Solution |
| :--- | :--- |
| **LLM Output Parsing** | Built a robust Python sanitizer to strip markdown and validate JSON integrity before storage. |
| **JWT Expiry** | Implemented Axios interceptors to silently refresh tokens, ensuring zero user logout friction. |
| **Database Performance** | Used `select_related` and `prefetch_related` in Django to minimize N+1 query problems in the results view. |

---

## ✅ Features Implemented
- [x] **Subtle Enterprise Theme**: Professional, clean UI for focused learning.
- [x] **Instant AI Engine**: Connects to `gemini-flash` for high-speed generation.
- [x] **Secure Auth**: Full JWT implementation with password hashing.
- [x] **Retake Logic**: Practice-focused architecture.
- [x] **Production Ready**: Fully deployed to Vercel with cloud databases.

---

## ✅ Contact
**Adarsh Srinivasan**  
[GitHub Profile:https://github.com/AdarshSrinivasan1310) 
Email: adarsh131005@gmail.com
