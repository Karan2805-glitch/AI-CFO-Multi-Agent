import os
from dotenv import load_dotenv

load_dotenv()

print("--- DIAGNOSTIC RUN ---")

# Test Gemini API with the new key and gemini-2.5-flash
print("\nTesting Gemini API Key with 'models/gemini-2.5-flash'...")
try:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("FAIL: GEMINI_API_KEY is not set!")
    else:
        print(f"GEMINI_API_KEY is set (starting with: {api_key[:8]}...)")
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        response = model.generate_content("Hello! Verify connection in one short sentence.")
        print(f"SUCCESS with gemini-2.5-flash!")
        print(f"Gemini Response: {response.text.strip()}")
except Exception as e:
    print(f"FAIL with gemini-2.5-flash: {str(e)}")

# Test Database connection
print("\nTesting Database connection to Neon Postgres...")
try:
    from sqlalchemy import create_engine, text
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("FAIL: DATABASE_URL is not set!")
    else:
        # Hide password in logs
        masked_url = database_url
        if "@" in database_url:
            parts = database_url.split("@")
            prefix = parts[0]
            if ":" in prefix:
                subparts = prefix.split(":")
                if len(subparts) > 2:
                    masked_url = f"{subparts[0]}:{subparts[1]}:****@{parts[1]}"
        print(f"DATABASE_URL detected: {masked_url}")
        
        engine = create_engine(database_url, pool_pre_ping=True)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            row = result.fetchone()
            print(f"SUCCESS: Connected to database!")
            print(f"Database version: {row[0] if row else 'Unknown'}")
except Exception as e:
    print(f"FAIL to connect to database: {str(e)}")

print("\n--- DIAGNOSTIC COMPLETE ---")
