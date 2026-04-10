from app.models import Base
from app.db import engine
try:
    conn = engine.connect()
    print("✅ Connected to Neon DB")
    conn.close()
except Exception as e:
    print("❌ Connection failed:", e)