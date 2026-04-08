import pandas as pd

def clean_columns(df):
    df.columns = df.columns.str.strip().str.lower()
    return df

REQUIRED_COLUMNS = [
    "months", "revenue", "rent", "salaries",
    "marketing", "subscriptions", "utilities", "other"
]

def validate_columns(df):
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    
    if missing:
        raise ValueError(f"Missing columns: {missing}")
    
    return df

def handle_missing_values(df):
    df = df.fillna(0)
    return df

def convert_types(df):
    numeric_cols = df.columns.drop("months")

    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    df = df.fillna(0)
    return df

def process_dates(df):
    df["months"] = pd.to_datetime(df["months"], errors='coerce')
    df = df.sort_values("months")
    return df

def preprocess(df):
    df = clean_columns(df)
    df = validate_columns(df)
    df = handle_missing_values(df)
    df = convert_types(df)
    df = process_dates(df)

    return df

# df = preprocess("sample.csv")
# print(df)