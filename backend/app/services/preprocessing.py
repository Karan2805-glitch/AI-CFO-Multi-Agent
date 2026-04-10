import pandas as pd

def preprocess(df: pd.DataFrame):

    # ---- 1. Normalize column names ----
    df.columns = [col.strip().lower() for col in df.columns]

    # ---- 2. Drop unnamed / empty columns ----
    df = df.loc[:, ~df.columns.str.contains("^unnamed")]
    df = df.dropna(axis=1, how="all")

    # ---- 3. Normalize 'months' column ----
    if "months" in df.columns:
        df["months"] = pd.to_datetime(df["months"], errors="coerce")

    # Drop invalid dates
    df = df.dropna(subset=["months"])

    # ---- 4. Fill missing values ----
    df = df.fillna(0)

    # ---- 5. Convert numeric columns safely ----
    for col in df.columns:
        if col != "months":
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # ---- 6. Aggregate duplicate months and Interpolate gaps ----
    if "months" in df.columns:
        df = df.groupby("months", as_index=False).sum()
        
        # Sort and ensure complete timeline
        df = df.sort_values(by="months")
        df.set_index("months", inplace=True)
        
        # Build consecutive monthly timeline
        full_range = pd.date_range(start=df.index.min(), end=df.index.max(), freq="MS")
        if len(full_range) > len(df):
            df = df.reindex(full_range)
            # Interpolate missing operational gaps smoothly
            df = df.interpolate(method="time")
        
        df = df.fillna(0).reset_index().rename(columns={"index": "months"})

    # ---- 7. Debug logs (TEMPORARY) ----
    print("Processed Columns:", df.columns.tolist())
    print(df.head())

    return df
# df = preprocess("sample.csv")
# print(df)