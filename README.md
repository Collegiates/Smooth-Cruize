# Smooth-Cruize Setup

This project is split into:

- `backend/`: FastAPI service
- `frontend/`: Next.js app

## Backend Setup

From the project root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the backend:

```bash
uvicorn main:app --reload
```

The backend runs on `http://127.0.0.1:8000` by default.

## Frontend Setup

From the project root:

```bash
cd frontend
npm install
```

Run the frontend in development:

```bash
npm run dev
```

Build the frontend for production:

```bash
npm run build
```

Start the production build:

```bash
npm run start
```

The frontend runs on `http://localhost:3000` by default.

## Recommended Startup Order

1. Start the backend first.
2. Start the frontend second.
3. Open `http://localhost:3000`.
