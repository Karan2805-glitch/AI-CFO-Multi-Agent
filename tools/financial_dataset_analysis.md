# Financial Dataset Analysis

| Dataset | Best Fit | Confidence Gap | Schema Similarity | Revenue Growth % | Profit Margin % |
| --- | --- | ---: | ---: | ---: | ---: |
| checking_account_main.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| checking_account_secondary.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| credit_card_account.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| gusto_payroll.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| gusto_payroll_bc.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| High_Profit_SME_Monthly.csv | Profit Making | 2.44 | 100.00 | 233.44 | 10.80 |
| High_Risk_full_dataset.csv | In Loss | 20.83 | 100.00 | -70.02 | -15.04 |
| Low_Risk_full_dataset.csv | In Loss | 19.86 | 100.00 | -70.01 | -15.01 |
| Medium_Risk_full_dataset.csv | In Loss | 19.86 | 100.00 | -70.01 | -15.01 |
| Moderate_Profit_SME_Monthly.csv | Profit Making | 2.44 | 100.00 | 233.44 | 10.80 |
| Practical_SME_Quarterly_Avg.csv | Profit Making | 3.18 | 100.00 | 232.20 | 10.83 |
| Realistic_JCurve_Growth_dataset.csv | Profit Making | 16.30 | 100.00 | 22.61 | 26.52 |
| SME_JCurve_Millions_dataset.csv | Profit Making | 16.06 | 100.00 | 22.63 | 26.52 |

## Forecast Samples
### checking_account_main.csv
Best fit: Growing  
Scores: {
  "growing": 5.0,
  "in_loss": 5.0,
  "profit_making": 5.0
}

- 2024-01-28: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-02-28: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-03-28: revenue=0.0, expenses=0.0, net_profit=0.0

### checking_account_secondary.csv
Best fit: Growing  
Scores: {
  "growing": 5.0,
  "in_loss": 5.0,
  "profit_making": 5.0
}

- 2024-01-15: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-02-15: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-03-15: revenue=0.0, expenses=0.0, net_profit=0.0

### credit_card_account.csv
Best fit: Growing  
Scores: {
  "growing": 5.0,
  "in_loss": 5.0,
  "profit_making": 5.0
}

- 2024-01-06: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-01-13: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-01-20: revenue=0.0, expenses=0.0, net_profit=0.0

### gusto_payroll.csv
Best fit: Growing  
Scores: {
  "growing": 5.0,
  "in_loss": 5.0,
  "profit_making": 5.0
}

- P1: revenue=0.0, expenses=0.0, net_profit=0.0
- P2: revenue=0.0, expenses=0.0, net_profit=0.0
- P3: revenue=0.0, expenses=0.0, net_profit=0.0

### gusto_payroll_bc.csv
Best fit: Growing  
Scores: {
  "growing": 5.0,
  "in_loss": 5.0,
  "profit_making": 5.0
}

- P1: revenue=0.0, expenses=0.0, net_profit=0.0
- P2: revenue=0.0, expenses=0.0, net_profit=0.0
- P3: revenue=0.0, expenses=0.0, net_profit=0.0

### High_Profit_SME_Monthly.csv
Best fit: Profit Making  
Scores: {
  "growing": 64.78,
  "in_loss": 13.12,
  "profit_making": 67.22
}

- 2026-12-08: revenue=1303652.03, expenses=1014208.25, net_profit=289443.78
- 2026-12-15: revenue=1326421.15, expenses=1028394.56, net_profit=298026.59
- 2026-12-22: revenue=1347381.48, expenses=1043462.23, net_profit=303919.25

### High_Risk_full_dataset.csv
Best fit: In Loss  
Scores: {
  "growing": 21.29,
  "in_loss": 60.69,
  "profit_making": 39.86
}

- 2026-12-29: revenue=213452.1, expenses=287342.0, net_profit=-73889.9
- 2027-01-05: revenue=212317.19, expenses=287304.73, net_profit=-74987.54
- 2027-01-12: revenue=209754.21, expenses=286632.57, net_profit=-76878.36

### Low_Risk_full_dataset.csv
Best fit: In Loss  
Scores: {
  "growing": 22.92,
  "in_loss": 60.67,
  "profit_making": 40.81
}

- 2026-12-08: revenue=210424.45, expenses=283266.28, net_profit=-72841.83
- 2026-12-15: revenue=209305.64, expenses=283229.55, net_profit=-73923.9
- 2026-12-22: revenue=206779.01, expenses=282566.91, net_profit=-75787.9

### Medium_Risk_full_dataset.csv
Best fit: In Loss  
Scores: {
  "growing": 22.92,
  "in_loss": 60.67,
  "profit_making": 40.81
}

- 2026-12-08: revenue=210424.45, expenses=283266.28, net_profit=-72841.83
- 2026-12-15: revenue=209305.64, expenses=283229.55, net_profit=-73923.9
- 2026-12-22: revenue=206779.01, expenses=282566.91, net_profit=-75787.9

### Moderate_Profit_SME_Monthly.csv
Best fit: Profit Making  
Scores: {
  "growing": 64.78,
  "in_loss": 13.12,
  "profit_making": 67.22
}

- 2026-12-08: revenue=1303652.03, expenses=1014208.25, net_profit=289443.78
- 2026-12-15: revenue=1326421.15, expenses=1028394.56, net_profit=298026.59
- 2026-12-22: revenue=1347381.48, expenses=1043462.23, net_profit=303919.25

### Practical_SME_Quarterly_Avg.csv
Best fit: Profit Making  
Scores: {
  "growing": 63.4,
  "in_loss": 13.07,
  "profit_making": 66.58
}

- 2027-01-28: revenue=1234311.61, expenses=960057.96, net_profit=274253.65
- 2027-02-04: revenue=1248536.19, expenses=967572.55, net_profit=280963.64
- 2027-02-11: revenue=1261109.9, expenses=975957.38, net_profit=285152.53

### Realistic_JCurve_Growth_dataset.csv
Best fit: Profit Making  
Scores: {
  "growing": 50.15,
  "in_loss": 14.53,
  "profit_making": 66.45
}

- 2026-12-29: revenue=1103062.83, expenses=805067.16, net_profit=297995.68
- 2027-01-05: revenue=1114436.38, expenses=812453.24, net_profit=301983.14
- 2027-01-12: revenue=1124345.87, expenses=820562.49, net_profit=303783.38

### SME_JCurve_Millions_dataset.csv
Best fit: Profit Making  
Scores: {
  "growing": 51.03,
  "in_loss": 14.5,
  "profit_making": 67.09
}

- 2026-12-08: revenue=1088190.47, expenses=794207.99, net_profit=293982.48
- 2026-12-15: revenue=1100171.77, expenses=802044.89, net_profit=298126.88
- 2026-12-22: revenue=1110702.35, expenses=810591.85, net_profit=300110.5


# Archetype Exports

| Archetype | Source Dataset | Status | Export Path | Rows Written |
| --- | --- | --- | --- | ---: |
| Growing | Practical_SME_Quarterly_Avg.csv | written | D:\Projects\AI-CFO-Multi-Agent\tools\scenario_exports\Practical_SME_Quarterly_Avg__growing.csv | 107 |
| In Loss | High_Risk_full_dataset.csv | written | D:\Projects\AI-CFO-Multi-Agent\tools\scenario_exports\High_Risk_full_dataset__in_loss.csv | 107 |
| Profit Making | Realistic_JCurve_Growth_dataset.csv | written | D:\Projects\AI-CFO-Multi-Agent\tools\scenario_exports\Realistic_JCurve_Growth_dataset__profit_making.csv | 107 |

The exported CSVs keep the required columns and add total_expenses, net_profit, and archetype so each scenario can be used directly in the report pipeline.