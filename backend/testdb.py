from app.models import Base
from app.db import engine
try:
    conn = engine.connect()
    print("[SUCCESS] Connected to Neon DB")
    conn.close()
except Exception as e:
    print("[ERROR] Connection failed:", e)