import pandas as pd

def preprocess(df: pd.DataFrame):

    # ---- 1. Normalize column names ----
    df.columns = [col.strip().lower() for col in df.columns]

    # ---- 2. Drop unnamed / empty columns ----
    df = df.loc[:, ~df.columns.str.contains("^unnamed")]
    df = df.dropna(axis=1, how="all")

    # ---- 3. Normalize 'months' column ----
    if "months" in df.columns:
        df["months"] = df["months"].astype(str).str.strip()

    # ---- 4. Fill missing values ----
    df = df.fillna(0)

    # ---- 5. Convert numeric columns safely ----
    for col in df.columns:
        if col != "months":
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # ---- 6. Aggregate duplicate months (NEW ADDITION) ----
    if "months" in df.columns:
        df = df.groupby("months", as_index=False).sum()

    # ---- 7. Debug logs (TEMPORARY) ----
    print("Processed Columns:", df.columns.tolist())
    print(df.head())

    return df
# df = preprocess("sample.csv")
# print(df)