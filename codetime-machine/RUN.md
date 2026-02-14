# Code Time Machine - Run Commands

## Quick Start

### 1. Start Backend API
```bash
cd /Users/shivamsh/Desktop/codetime-machine
source venv/bin/activate
python backend/main.py
```
**Backend runs at:** http://localhost:8000

### 2. Run API Tests
```bash
python test_api.py
```

### 3. Open Test UI
Open `test_ui.html` in your browser:
```bash
open test_ui.html
```
**Test UI provides:** API status, commit analysis testing

### 4. Manual API Testing
```bash
# Check API status
curl http://localhost:8000

# Test commit analysis
curl -X POST http://localhost:8000/analyze-commit \
  -H "Content-Type: application/json" \
  -d '{"commit_hash":"abc123","repo_path":"/test/repo","diff_content":"test diff"}'

# Test regression detection
curl -X POST http://localhost:8000/detect-regression \
  -H "Content-Type: application/json" \
  -d '{"repo_path":"/test/repo","performance_data":{"commits":[],"threshold_ms":200}}'
```

## Development

### Backend Setup (if needed)
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend Setup (future)
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /` - API status
- `POST /analyze-commit` - Analyze commit with AI
- `POST /detect-regression` - Detect performance regressions
- `POST /generate-repair` - Generate repair strategies

## Configuration

Edit `/Users/shivamsh/Desktop/codetime-machine/backend/.env`:
```
GROQ_API_KEY=your_key_here
DATABASE_URL=sqlite:///./codetime.db
```

**Note:** Backend must be running for API tests and UI to work.