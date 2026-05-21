# Project Setup

This document explains how to set up, run, and test the AI-CFO-Multi-Agent project locally and with Docker.

**Prerequisites**
- Git
- Python 3.10+ (recommended)
- Node 16+ / npm or Yarn
- Docker & Docker Compose (optional, for containerized run)
- On Windows: PowerShell or WSL recommended for developer convenience

**Repository layout (relevant folders)**
- `backend/` — FastAPI backend, database init, tests
- `frontend/` — React + Vite frontend
- `docker-compose.yml` — full stack with services (optional)

**Environment**
1. Copy the example env file to a working `.env` in repo root:

```bash
# from repo root
cp .env.example .env
# On Windows PowerShell:
Copy-Item .env.example .env
```

2. Edit `.env` and fill real secrets (database credentials, API keys, etc.). See `.env.example` for variables and placeholders.


## Backend — Local (venv)

1. Create and activate a virtual environment (from repo root):

```bash
python -m venv backend/.venv
# Windows PowerShell
backend\.venv\Scripts\Activate.ps1
# macOS / Linux
source backend/.venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r backend/requirements.txt
```

3. Initialize the database (if applicable):

```bash
# Example script included in repo
python backend/init_db.py
```

4. Run the backend in development mode:

```bash
# from repo root
cd backend
# Run the FastAPI app with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

5. Run backend tests:

```bash
# from repo root
cd backend
pytest -q
```


## Frontend — Local

1. Install dependencies (from `frontend/`):

```bash
cd frontend
npm install
# or
# yarn install
```

2. Run the dev server:

```bash
npm run dev
# open the URL printed by Vite (usually http://localhost:5173 / http://localhost:5174)
```

3. Build for production:

```bash
npm run build
```

4. Optional: local frontend library (`ai-cfo-lib`)

If you use the local library, the project includes path/alias mappings in `frontend/jsconfig.json` and `frontend/components.json` that map `ai-cfo-lib/*` and `ai-cfo` to `src/lib/ai-cfo`.


## Run with Docker Compose (recommended for parity)

1. Ensure Docker Desktop is running.
2. Copy `.env` as needed (Docker Compose reads `.env`).
3. Start services:

```bash
docker compose up --build
```

4. Stop and remove:

```bash
docker compose down
```


## Environment variables (quick reference)
See `.env.example` for full list. Typical keys:
- `SECRET_KEY` / `JWT_SECRET`
- `DATABASE_URL` or `POSTGRES_DB` (if using Postgres or another SQL DB)
- `OPENAI_API_KEY` (or other LLM provider keys)
- `VITE_API_BASE_URL` (frontend -> backend base URL)


## Troubleshooting
- If port already in use, change `BACKEND_PORT` or frontend port in Vite config.
- On Windows, use PowerShell or WSL to run the `cp`/`source` commands.
- If dependencies fail, check Python version and re-create venv.


## Useful commands summary

```bash
# copy env
cp .env.example .env
# backend
python -m venv backend/.venv
backend\.venv\Scripts\Activate.ps1  # PowerShell on Windows
pip install -r backend/requirements.txt
python backend/init_db.py
cd backend && uvicorn app.main:app --reload
# frontend
cd frontend && npm install && npm run dev
# docker
docker compose up --build
```


## Where to look next
- Backend main app: `backend/app/`
- Frontend: `frontend/src/`
- DB init script: `backend/init_db.py`

Thank you — if you want, I can also add npm script shortcuts or a developer `Makefile`/`psake` script for common tasks.
