from __future__ import annotations

import argparse
import csv
import json
import math
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import date, datetime
from pathlib import Path
from statistics import fmean, pstdev
from typing import Dict, Iterable, List, Optional, Sequence, Tuple


BASE_COLUMNS = [
    "months",
    "revenue",
    "rent",
    "salaries",
    "marketing",
    "subscriptions",
    "utilities",
    "other",
]

EXPENSE_COLUMNS = ["rent", "salaries", "marketing", "subscriptions", "utilities", "other"]
DATE_ALIASES = ("months", "month", "date", "quarter")
TARGET_SEEDS = {
    "Growing": "Practical_SME_Quarterly_Avg.csv",
    "In Loss": "High_Risk_full_dataset.csv",
    "Profit Making": "Realistic_JCurve_Growth_dataset.csv",
}
EXPORT_COLUMNS = BASE_COLUMNS + ["total_expenses", "net_profit", "archetype"]


@dataclass
class ArchetypeScores:
    growing: float
    in_loss: float
    profit_making: float

    def best(self) -> str:
        values = {
            "Growing": self.growing,
            "In Loss": self.in_loss,
            "Profit Making": self.profit_making,
        }
        return max(values, key=values.get)

    def confidence(self) -> float:
        ordered = sorted([self.growing, self.in_loss, self.profit_making], reverse=True)
        return round(max(0.0, ordered[0] - ordered[1]), 2)


def _clip(value: float) -> float:
    return max(0.0, min(1.0, value))


def _deterministic_noise(step: int, scale: float = 0.03, phase: float = 0.0) -> float:
    return (math.sin(step * 1.7 + phase) + 0.35 * math.cos(step * 0.9 + phase)) * scale


def _format_month(value: object, fallback_index: int) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if value is None:
        return f"P{fallback_index + 1}"
    text = str(value).strip()
    return text or f"P{fallback_index + 1}"


def _safe_float(value: object) -> float:
    if value is None:
        return 0.0
    text = str(value).strip()
    if not text:
        return 0.0
    text = text.replace(",", "")
    try:
        return float(text)
    except ValueError:
        return 0.0


def _parse_date(value: object) -> Optional[datetime]:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    for parser in (
        lambda v: datetime.fromisoformat(v),
        lambda v: datetime.strptime(v, "%Y-%m-%d"),
        lambda v: datetime.strptime(v, "%Y/%m/%d"),
        lambda v: datetime.strptime(v, "%m/%d/%Y"),
        lambda v: datetime.strptime(v, "%Y-%m"),
        lambda v: datetime.strptime(v, "%b %Y"),
        lambda v: datetime.strptime(v, "%B %Y"),
    ):
        try:
            return parser(text)
        except Exception:
            pass
    return None


def _month_end(dt: datetime) -> datetime:
    if dt.month == 12:
        next_month = date(dt.year + 1, 1, 1)
    else:
        next_month = date(dt.year, dt.month + 1, 1)
    return datetime.combine(next_month, datetime.min.time())


def _add_months(dt: datetime, months: int) -> datetime:
    year = dt.year + (dt.month - 1 + months) // 12
    month = (dt.month - 1 + months) % 12 + 1
    day = min(dt.day, 28)
    return datetime(year, month, day)


def read_dataset(path: Path) -> List[Dict[str, object]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = []
        for raw_row in reader:
            row = {str(key).strip().lower(): value for key, value in raw_row.items() if key is not None}
            rows.append(row)
    return rows


def normalize_rows(rows: List[Dict[str, object]]) -> List[Dict[str, object]]:
    if not rows:
        return []

    columns = {key for row in rows for key in row.keys()}
    date_key = next((alias for alias in DATE_ALIASES if alias in columns), None)

    normalized = []
    for index, row in enumerate(rows):
        current: Dict[str, object] = {}
        if date_key:
            current["months"] = _parse_date(row.get(date_key))
        else:
            current["months"] = index

        for key in columns:
            if key == date_key:
                continue
            current[key] = _safe_float(row.get(key))
        normalized.append(current)

    if date_key:
        with_dates = [row for row in normalized if isinstance(row["months"], datetime)]
        without_dates = [row for row in normalized if not isinstance(row["months"], datetime)]
        with_dates.sort(key=lambda row: row["months"])
        normalized = with_dates + without_dates

    return normalized


def _series(rows: Sequence[Dict[str, object]], key: str) -> List[float]:
    return [float(row.get(key, 0.0) or 0.0) for row in rows]


def _sum_expenses(row: Dict[str, object]) -> float:
    return sum(float(row.get(column, 0.0) or 0.0) for column in EXPENSE_COLUMNS)


def _mean(values: Sequence[float]) -> float:
    return fmean(values) if values else 0.0


def _std(values: Sequence[float]) -> float:
    return pstdev(values) if len(values) > 1 else 0.0


def _linear_fit(values: Sequence[float]) -> Tuple[float, float]:
    if len(values) < 2:
        return 0.0, values[0] if values else 0.0
    x = list(range(len(values)))
    x_mean = _mean(x)
    y_mean = _mean(values)
    numerator = sum((xi - x_mean) * (yi - y_mean) for xi, yi in zip(x, values))
    denominator = sum((xi - x_mean) ** 2 for xi in x) or 1.0
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    return slope, intercept


def _predict_linear(values: Sequence[float], steps: int) -> List[float]:
    slope, intercept = _linear_fit(values)
    start = len(values)
    return [intercept + slope * (start + step) for step in range(steps)]


def _predict_exponential(values: Sequence[float], steps: int) -> List[float]:
    positive = [max(value, 1e-6) for value in values]
    log_values = [math.log(value) for value in positive]
    slope, intercept = _linear_fit(log_values)
    start = len(values)
    return [math.exp(intercept + slope * (start + step)) for step in range(steps)]


def _seasonal_fit(values: Sequence[float], period: int = 12) -> Tuple[List[float], List[float], List[float]]:
    if len(values) < 4:
        baseline = _predict_linear(values, 0)
        return [], [], baseline

    x_values = list(range(len(values)))
    w = 2.0 * math.pi / period
    design = [[math.sin(w * x), math.cos(w * x), x, 1.0] for x in x_values]
    coeffs = _solve_normal_equations(design, list(values))
    seasonal = [coeffs[0] * math.sin(w * x) + coeffs[1] * math.cos(w * x) for x in x_values]
    trend = [coeffs[2] * x + coeffs[3] for x in x_values]
    residual = [y - (s + t) for y, s, t in zip(values, seasonal, trend)]
    return seasonal, trend, residual


def _solve_normal_equations(design: List[List[float]], y: List[float]) -> List[float]:
    columns = len(design[0])
    gram = [[0.0 for _ in range(columns)] for _ in range(columns)]
    rhs = [0.0 for _ in range(columns)]

    for row, target in zip(design, y):
        for i in range(columns):
            rhs[i] += row[i] * target
            for j in range(columns):
                gram[i][j] += row[i] * row[j]

    augmented = [gram[i] + [rhs[i]] for i in range(columns)]
    for pivot_index in range(columns):
        pivot_row = max(range(pivot_index, columns), key=lambda row_index: abs(augmented[row_index][pivot_index]))
        if abs(augmented[pivot_row][pivot_index]) < 1e-12:
            continue
        if pivot_row != pivot_index:
            augmented[pivot_index], augmented[pivot_row] = augmented[pivot_row], augmented[pivot_index]
        pivot = augmented[pivot_index][pivot_index]
        for col in range(pivot_index, columns + 1):
            augmented[pivot_index][col] /= pivot
        for row_index in range(columns):
            if row_index == pivot_index:
                continue
            factor = augmented[row_index][pivot_index]
            for col in range(pivot_index, columns + 1):
                augmented[row_index][col] -= factor * augmented[pivot_index][col]

    return [augmented[i][-1] for i in range(columns)]


def _seasonality_strength(values: Sequence[float]) -> float:
    if len(values) < 12:
        return 0.0
    seasonal, trend, residual = _seasonal_fit(values)
    if not seasonal:
        return 0.0
    seasonal_amp = _std(seasonal)
    residual_scale = _std(residual) or 1.0
    return max(0.0, min(1.0, seasonal_amp / residual_scale))


def _profit_margin(rows: Sequence[Dict[str, object]]) -> float:
    revenue = [_safe_float(row.get("revenue")) for row in rows]
    if not revenue:
        return 0.0
    expenses = [_sum_expenses(row) for row in rows]
    total_revenue = sum(revenue) or 1.0
    profit = sum(r - e for r, e in zip(revenue, expenses))
    return (profit / total_revenue) * 100.0


def schema_similarity(rows: Sequence[Dict[str, object]]) -> float:
    if not rows:
        return 0.0
    columns = set(rows[0].keys()) | {"months"}
    present = sum(1 for column in BASE_COLUMNS if column in columns)
    extra = int("months" in columns) + int("revenue" in columns)
    return round((present + extra) / (len(BASE_COLUMNS) + 2) * 100.0, 2)


def score_archetypes(rows: Sequence[Dict[str, object]]) -> ArchetypeScores:
    if not rows or "revenue" not in rows[0]:
        return ArchetypeScores(5.0, 5.0, 5.0)

    revenue = _series(rows, "revenue")
    expenses = [_sum_expenses(row) for row in rows]
    growth = _growth_rate(revenue)
    slope = _linear_fit(revenue)[0]
    normalized_slope = slope / max(_mean(revenue), 1.0)
    volatility = _volatility(revenue)
    seasonality = _seasonality_strength(revenue)
    margin = _profit_margin(rows)
    expense_ratio = (sum(expenses) / max(sum(revenue), 1.0)) * 100.0

    growing = (
        35.0 * _clip((growth + 50.0) / 120.0)
        + 20.0 * _clip((normalized_slope + 0.05) / 0.15)
        + 15.0 * _clip(1.0 - volatility / 0.5)
        + 10.0 * _clip((50.0 - margin) / 100.0)
        + 20.0 * _clip(seasonality)
    )

    in_loss = (
        30.0 * _clip((-growth + 50.0) / 120.0)
        + 20.0 * _clip((-normalized_slope + 0.05) / 0.15)
        + 25.0 * _clip((expense_ratio - 80.0) / 80.0)
        + 20.0 * _clip((-margin + 30.0) / 80.0)
        + 5.0 * _clip(volatility / 0.5)
    )

    profit_making = (
        35.0 * _clip((margin + 20.0) / 80.0)
        + 20.0 * _clip(1.0 - volatility / 0.4)
        + 15.0 * _clip((growth + 20.0) / 80.0)
        + 20.0 * _clip(1.0 - abs(normalized_slope))
        + 10.0 * _clip(seasonality)
    )

    return ArchetypeScores(
        growing=round(min(100.0, growing), 2),
        in_loss=round(min(100.0, in_loss), 2),
        profit_making=round(min(100.0, profit_making), 2),
    )


def _growth_rate(values: Sequence[float]) -> float:
    if len(values) < 2:
        return 0.0
    first = values[0]
    last = values[-1]
    if abs(first) < 1e-9:
        return 0.0 if abs(last) < 1e-9 else 100.0
    return ((last - first) / abs(first)) * 100.0


def _volatility(values: Sequence[float]) -> float:
    if len(values) < 3:
        return 0.0
    changes = []
    for previous, current in zip(values, values[1:]):
        if abs(previous) < 1e-9:
            continue
        changes.append((current - previous) / abs(previous))
    return _std(changes) if len(changes) > 1 else 0.0


def extrapolate(rows: Sequence[Dict[str, object]], archetype: str, steps: int = 6) -> List[Dict[str, object]]:
    revenue = _series(rows, "revenue") if rows else []
    expenses = [_sum_expenses(row) for row in rows] if rows else []

    if archetype == "Growing":
        future_revenue = _predict_exponential(revenue, steps)
        future_expenses = _predict_linear(expenses, steps)
    elif archetype == "In Loss":
        future_revenue = _predict_linear(revenue, steps)
        future_expenses = [max(value, _mean(expenses)) for value in _predict_linear(expenses, steps)]
    else:
        if len(revenue) >= 4:
            seasonal, trend, residual = _seasonal_fit(revenue)
            future_revenue = _predict_seasonal(values=revenue, steps=steps)
        else:
            future_revenue = _predict_logarithmic(revenue, steps)

        if len(expenses) >= 4:
            future_expenses = _predict_seasonal(values=expenses, steps=steps)
        else:
            future_expenses = _predict_linear(expenses, steps)

    last_month = rows[-1].get("months") if rows else None
    forecast = []
    for step in range(steps):
        if isinstance(last_month, datetime):
            month_value = _add_months(last_month, step + 1).date().isoformat()
        else:
            month_value = f"P{step + 1}"

        forecast.append(
            {
                "months": month_value,
                "revenue": round(float(future_revenue[step]), 2),
                "expenses": round(float(future_expenses[step]), 2),
                "net_profit": round(float(future_revenue[step] - future_expenses[step]), 2),
            }
        )

    return forecast


def _predict_logarithmic(values: Sequence[float], steps: int) -> List[float]:
    if not values:
        return [0.0 for _ in range(steps)]
    x_values = [math.log(index + 1) for index in range(len(values))]
    slope, intercept = _linear_fit_with_x(x_values, values)
    return [slope * math.log(len(values) + step + 1) + intercept for step in range(steps)]


def _predict_seasonal(values: Sequence[float], steps: int, period: int = 12) -> List[float]:
    if not values:
        return [0.0 for _ in range(steps)]
    w = 2.0 * math.pi / period
    design = [[math.sin(w * x), math.cos(w * x), x, 1.0] for x in range(len(values))]
    coeffs = _solve_normal_equations(design, list(values))
    future = []
    for step in range(steps):
        x = len(values) + step
        future.append(
            coeffs[0] * math.sin(w * x)
            + coeffs[1] * math.cos(w * x)
            + coeffs[2] * x
            + coeffs[3]
        )
    return future


def _linear_fit_with_x(x_values: Sequence[float], y_values: Sequence[float]) -> Tuple[float, float]:
    if len(y_values) < 2:
        return 0.0, y_values[0] if y_values else 0.0
    x_mean = _mean(x_values)
    y_mean = _mean(y_values)
    numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, y_values))
    denominator = sum((x - x_mean) ** 2 for x in x_values) or 1.0
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    return slope, intercept


def _expense_weights(rows: Sequence[Dict[str, object]], archetype: str) -> Dict[str, float]:
    weights: Dict[str, float] = {}
    total = 0.0
    for column in EXPENSE_COLUMNS:
        value = max(_mean(_series(rows, column)), 0.0)
        weights[column] = value
        total += value

    if total <= 0.0:
        weights = {column: 1.0 / len(EXPENSE_COLUMNS) for column in EXPENSE_COLUMNS}
    else:
        weights = {column: value / total for column, value in weights.items()}

    if archetype == "Growing":
        weights["marketing"] *= 1.15
        weights["subscriptions"] *= 1.08
        weights["rent"] *= 0.95
        weights["utilities"] *= 0.95
    elif archetype == "In Loss":
        weights["salaries"] *= 1.05
        weights["rent"] *= 1.02
        weights["marketing"] *= 0.75
    else:
        weights["marketing"] *= 1.05
        weights["subscriptions"] *= 1.05

    normalizer = sum(weights.values()) or 1.0
    return {column: value / normalizer for column, value in weights.items()}


def _project_revenue(values: Sequence[float], archetype: str, steps: int) -> List[float]:
    if archetype == "Growing":
        if not values:
            return [0.0 for _ in range(steps)]
        seed = max(values[-1], _mean(values), 1.0)
        slope = abs(_linear_fit(values)[0]) / max(seed, 1.0)
        growth_rate = min(0.22, max(0.04, slope * 6.0))
        return [max(0.0, seed * math.exp(growth_rate * (step + 1)) * (1.0 + _deterministic_noise(step, 0.015))) for step in range(steps)]

    if archetype == "In Loss":
        if not values:
            return [0.0 for _ in range(steps)]
        current = values[-1]
        slope = abs(_linear_fit(values)[0])
        decay = max(slope, abs(_mean(values)) * 0.06, 1.0)
        series = []
        for step in range(steps):
            current = current - decay * (1.0 + 0.05 * step)
            if values[-1] >= 0:
                current = max(current, 0.0)
            series.append(current * (1.0 + _deterministic_noise(step, 0.01, 0.6)))
        return series

    if not values:
        return [0.0 for _ in range(steps)]
    log_projection = _predict_logarithmic(values, steps)
    seasonal_projection = _predict_seasonal(values, steps) if len(values) >= 4 else log_projection
    blend = []
    for step in range(steps):
        baseline = 0.7 * log_projection[step] + 0.3 * seasonal_projection[step]
        blend.append(max(0.0, baseline * (1.0 + _deterministic_noise(step, 0.012, 1.2))))
    return blend


def _project_total_expenses(values: Sequence[float], archetype: str, steps: int) -> List[float]:
    if archetype == "Growing":
        if not values:
            return [0.0 for _ in range(steps)]
        base = max(values[-1], _mean(values), 1.0)
        slope = max(_linear_fit(values)[0], 0.0)
        step_slope = max(slope * 0.55, base * 0.015)
        return [max(0.0, base + step_slope * (step + 1)) * (1.0 + _deterministic_noise(step, 0.01, 0.4)) for step in range(steps)]

    if archetype == "In Loss":
        if not values:
            return [0.0 for _ in range(steps)]
        base = max(_mean(values), values[-1], 1.0)
        drift = max(abs(_linear_fit(values)[0]) * 0.1, base * 0.005)
        return [max(0.0, base + drift * (step + 1)) * (1.0 + _deterministic_noise(step, 0.006, 0.9)) for step in range(steps)]

    if not values:
        return [0.0 for _ in range(steps)]
    mean_value = max(_mean(values), values[-1], 1.0)
    seasonal_projection = _predict_seasonal(values, steps) if len(values) >= 4 else [mean_value for _ in range(steps)]
    return [max(0.0, 0.9 * mean_value + 0.1 * seasonal_projection[step]) * (1.0 + _deterministic_noise(step, 0.008, 1.5)) for step in range(steps)]


def _allocate_expenses(total_expense: float, weights: Dict[str, float], archetype: str, step: int) -> Dict[str, float]:
    if total_expense <= 0.0:
        return {column: 0.0 for column in EXPENSE_COLUMNS}

    modifiers = {
        "rent": 1.0,
        "salaries": 1.0,
        "marketing": 1.0,
        "subscriptions": 1.0,
        "utilities": 1.0,
        "other": 1.0,
    }

    if archetype == "Growing":
        modifiers["marketing"] = 1.10 + 0.02 * step
        modifiers["subscriptions"] = 1.06 + 0.01 * step
        modifiers["salaries"] = 1.02 + 0.01 * step
    elif archetype == "In Loss":
        modifiers["marketing"] = 0.82
        modifiers["rent"] = 1.03
        modifiers["salaries"] = 1.04
    else:
        modifiers["marketing"] = 1.04
        modifiers["subscriptions"] = 1.04
        modifiers["utilities"] = 1.01

    allocations: Dict[str, float] = {}
    for index, column in enumerate(EXPENSE_COLUMNS):
        noise = 1.0 + _deterministic_noise(step, 0.01, phase=0.25 * (index + 1))
        allocations[column] = max(0.0, total_expense * weights[column] * modifiers[column] * noise)

    normalizer = sum(allocations.values()) or 1.0
    return {column: total_expense * value / normalizer for column, value in allocations.items()}


def _export_row(row: Dict[str, object], archetype: str, fallback_index: int) -> Dict[str, object]:
    revenue = _safe_float(row.get("revenue"))
    expense_total = sum(_safe_float(row.get(column)) for column in EXPENSE_COLUMNS)
    export_row = {"months": _format_month(row.get("months"), fallback_index), "revenue": round(revenue, 2)}
    for column in EXPENSE_COLUMNS:
        export_row[column] = round(_safe_float(row.get(column)), 2)
    export_row["total_expenses"] = round(expense_total, 2)
    export_row["net_profit"] = round(revenue - expense_total, 2)
    export_row["archetype"] = archetype
    return export_row


def build_archetype_dataset(rows: Sequence[Dict[str, object]], archetype: str, steps: int = 6) -> List[Dict[str, object]]:
    revenue_series = _series(rows, "revenue") if rows else []
    expense_total_series = [_sum_expenses(row) for row in rows] if rows else []
    projected_revenue = _project_revenue(revenue_series, archetype, steps)
    projected_expenses = _project_total_expenses(expense_total_series, archetype, steps)
    weights = _expense_weights(rows, archetype)

    export_rows = [_export_row(row, archetype="source", fallback_index=index) for index, row in enumerate(rows)]

    last_month = rows[-1].get("months") if rows else None
    for step in range(steps):
        if isinstance(last_month, datetime):
            month_value = _add_months(last_month, step + 1).date().isoformat()
        elif last_month is not None:
            month_value = f"P{len(rows) + step + 1}"
        else:
            month_value = f"P{step + 1}"

        allocated = _allocate_expenses(projected_expenses[step], weights, archetype, step)
        future_row: Dict[str, object] = {
            "months": month_value,
            "revenue": round(projected_revenue[step], 2),
        }
        for column in EXPENSE_COLUMNS:
            future_row[column] = round(allocated[column], 2)
        future_expense_total = sum(allocated.values())
        future_row["total_expenses"] = round(future_expense_total, 2)
        future_row["net_profit"] = round(projected_revenue[step] - future_expense_total, 2)
        future_row["archetype"] = archetype
        export_rows.append(future_row)

    return export_rows


def analyze_file(path: Path, steps: int = 6) -> Dict[str, object]:
    raw_rows = read_dataset(path)
    rows = normalize_rows(raw_rows)
    scores = score_archetypes(rows)
    best_fit = scores.best()
    forecast = extrapolate(rows, best_fit, steps=steps)

    revenue = _series(rows, "revenue") if rows and "revenue" in rows[0] else []
    expenses = [_sum_expenses(row) for row in rows] if rows else []

    return {
        "dataset": path.name,
        "rows": len(rows),
        "columns": sorted(set().union(*[row.keys() for row in rows])) if rows else [],
        "schema_similarity": schema_similarity(rows),
        "revenue_start": round(revenue[0], 2) if revenue else 0.0,
        "revenue_end": round(revenue[-1], 2) if revenue else 0.0,
        "revenue_growth_pct": round(_growth_rate(revenue), 2) if revenue else 0.0,
        "profit_margin_pct": round(_profit_margin(rows), 2),
        "expense_ratio_pct": round((sum(expenses) / max(sum(revenue), 1.0)) * 100.0, 2) if revenue else 0.0,
        "archetype_scores": asdict(scores),
        "best_fit": best_fit,
        "confidence_gap": scores.confidence(),
        "forecast": forecast,
    }


def _write_csv(path: Path, rows: Sequence[Dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=EXPORT_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in EXPORT_COLUMNS})


def _build_target_exports(root: Path, export_dir: Path, steps: int) -> List[Dict[str, object]]:
    exports: List[Dict[str, object]] = []
    available = {path.name: path for path in root.rglob("*.csv") if path.is_file()}

    for archetype, dataset_name in TARGET_SEEDS.items():
        source_path = available.get(dataset_name)
        if source_path is None:
            exports.append({
                "archetype": archetype,
                "source_dataset": dataset_name,
                "status": "missing",
            })
            continue

        normalized_rows = normalize_rows(read_dataset(source_path))
        combined_rows = build_archetype_dataset(normalized_rows, archetype, steps=steps)
        export_name = f"{source_path.stem}__{archetype.lower().replace(' ', '_')}.csv"
        export_path = export_dir / export_name
        _write_csv(export_path, combined_rows)

        exports.append(
            {
                "archetype": archetype,
                "source_dataset": source_path.name,
                "export_path": str(export_path),
                "status": "written",
                "rows_written": len(combined_rows),
                "future_rows": steps,
            }
        )

    return exports


def _format_markdown(results: List[Dict[str, object]]) -> str:
    lines = ["# Financial Dataset Analysis", ""]
    lines.append("| Dataset | Best Fit | Confidence Gap | Schema Similarity | Revenue Growth % | Profit Margin % |")
    lines.append("| --- | --- | ---: | ---: | ---: | ---: |")
    for item in results:
        lines.append(
            f"| {item['dataset']} | {item['best_fit']} | {item['confidence_gap']:.2f} | {item['schema_similarity']:.2f} | {item['revenue_growth_pct']:.2f} | {item['profit_margin_pct']:.2f} |"
        )
    lines.append("")
    lines.append("## Forecast Samples")
    for item in results:
        lines.append(f"### {item['dataset']}")
        lines.append(f"Best fit: {item['best_fit']}  ")
        lines.append(f"Scores: {json.dumps(item['archetype_scores'], indent=2)}")
        lines.append("")
        for row in item["forecast"][:3]:
            lines.append(f"- {row['months']}: revenue={row['revenue']}, expenses={row['expenses']}, net_profit={row['net_profit']}")
        lines.append("")
    return "\n".join(lines)


def _format_exports_markdown(exports: List[Dict[str, object]]) -> str:
    lines = ["# Archetype Exports", ""]
    lines.append("| Archetype | Source Dataset | Status | Export Path | Rows Written |")
    lines.append("| --- | --- | --- | --- | ---: |")
    for item in exports:
        lines.append(
            f"| {item.get('archetype', '')} | {item.get('source_dataset', '')} | {item.get('status', '')} | {item.get('export_path', '')} | {item.get('rows_written', 0)} |"
        )
    lines.append("")
    lines.append("The exported CSVs keep the required columns and add total_expenses, net_profit, and archetype so each scenario can be used directly in the report pipeline.")
    return "\n".join(lines)


def _pick_base_datasets(results: List[Dict[str, object]]) -> Dict[str, str]:
    picks: Dict[str, Tuple[str, float]] = {}
    for item in results:
        for label, score in item["archetype_scores"].items():
            current = picks.get(label)
            if current is None or score > current[1]:
                picks[label] = (item["dataset"], score)
    return {label: dataset for label, (dataset, _score) in picks.items()}


def main() -> int:
    parser = argparse.ArgumentParser(description="Score financial datasets and simulate extrapolation.")
    parser.add_argument("--root", default=r"D:\Financial_Projects", help="Folder containing the CSV datasets")
    parser.add_argument("--steps", type=int, default=6, help="Forecast steps to extrapolate")
    parser.add_argument("--output", default="", help="Optional path for JSON output")
    parser.add_argument("--markdown", default="", help="Optional path for Markdown output")
    parser.add_argument("--export-dir", default=str(Path(__file__).resolve().parent / "scenario_exports"), help="Optional directory for archetype-aligned CSV exports")
    args = parser.parse_args()

    root = Path(args.root)
    export_dir = Path(args.export_dir) if args.export_dir else None
    csv_files = sorted(path for path in root.rglob("*.csv") if path.is_file())
    results = [analyze_file(path, steps=args.steps) for path in csv_files]
    exports = _build_target_exports(root, export_dir, args.steps) if export_dir else []
    summary = {
        "root": str(root),
        "datasets": results,
        "best_base_datasets": _pick_base_datasets(results),
        "archetype_exports": exports,
    }

    print(json.dumps(summary, indent=2, default=str))

    if args.output:
        Path(args.output).write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    if args.markdown:
        markdown_text = _format_markdown(results)
        if exports:
            markdown_text += "\n\n" + _format_exports_markdown(exports)
        Path(args.markdown).write_text(markdown_text, encoding="utf-8")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())