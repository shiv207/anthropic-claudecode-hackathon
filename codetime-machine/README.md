## Code Time Machine

AI-powered commit analysis and regression detection system.

### Tech Stack
- **Backend**: Python/FastAPI for Git operations and AI reasoning
- **Frontend**: Next.js/React with Tailwind CSS
- **AI Router**: Groq with Kimi models
- **Database**: SQLite for caching commit metadata

### Features
- Semantic commit explanations via AI
- Performance regression detection  
- Automated repair PR generation
- GitHub-style timeline UI with OpenAI-inspired aesthetics

### Architecture
- `/backend` - FastAPI service (Git processing, AI reasoning)
- `/frontend` - Next.js web app (repository management, visualization)

### Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm run dev
```