from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import analyze, session, results, runs, auth

app = FastAPI(title="AI CFO Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(analyze, prefix="/analyze")
app.include_router(session, prefix="/session")
app.include_router(results, prefix="/results")
app.include_router(runs, prefix="/runs")
app.include_router(auth, prefix="/auth")

@app.get("/")
def root():
    return {"message": "AI CFO Backend Running"}


@app.get("/health")
def health():
    return {"status": "ok"}