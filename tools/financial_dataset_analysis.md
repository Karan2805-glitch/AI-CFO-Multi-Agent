# Financial Dataset Analysis

| Dataset | Best Fit | Confidence Gap | Schema Similarity | Revenue Growth % | Profit Margin % |
| --- | --- | ---: | ---: | ---: | ---: |
| High_Risk_full_dataset.csv | In Loss | 20.83 | 100.00 | -70.02 | -15.04 |
| Practical_SME_Quarterly_Avg.csv | Profit Making | 3.18 | 100.00 | 232.20 | 10.83 |
| Realistic_JCurve_Growth_dataset.csv | Profit Making | 16.30 | 100.00 | 22.61 | 26.52 |
| High_Risk_full_dataset__in_loss.csv | In Loss | 20.51 | 100.00 | -70.14 | -15.06 |
| Practical_SME_Quarterly_Avg__growing.csv | Profit Making | 2.86 | 100.00 | 232.92 | 10.82 |
| Realistic_JCurve_Growth_dataset__profit_making.csv | Profit Making | 16.47 | 100.00 | 22.11 | 26.52 |

## Forecast Samples
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

### High_Risk_full_dataset__in_loss.csv
Best fit: In Loss  
Scores: {
  "growing": 22.42,
  "in_loss": 60.74,
  "profit_making": 40.23
}

- 2027-01-19: revenue=199052.19, expenses=268604.26, net_profit=-69552.07
- 2027-01-26: revenue=197516.97, expenses=268569.43, net_profit=-71052.45
- 2027-02-02: revenue=194662.67, expenses=267941.09, net_profit=-73278.43

### Practical_SME_Quarterly_Avg__growing.csv
Best fit: Profit Making  
Scores: {
  "growing": 63.82,
  "in_loss": 13.11,
  "profit_making": 66.68
}

- 2027-02-18: revenue=1242318.33, expenses=965988.8, net_profit=276329.53
- 2027-02-25: revenue=1249745.26, expenses=967889.64, net_profit=281855.62
- 2027-03-04: revenue=1255568.59, expenses=970700.48, net_profit=284868.11

### Realistic_JCurve_Growth_dataset__profit_making.csv
Best fit: Profit Making  
Scores: {
  "growing": 49.54,
  "in_loss": 14.69,
  "profit_making": 66.01
}

- 2027-01-19: revenue=1027721.89, expenses=750071.86, net_profit=277650.03
- 2027-01-26: revenue=1034964.46, expenses=754499.85, net_profit=280464.6
- 2027-02-02: revenue=1040871.18, expenses=759616.51, net_profit=281254.68


# Archetype Exports

| Archetype | Source Dataset | Status | Export Path | History Rows | Future Rows | Forecast Share % |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Growing | Practical_SME_Quarterly_Avg.csv | written | tools\scenario_exports\Practical_SME_Quarterly_Avg__growing.csv | 9 | 3 | 25.00 |
| In Loss | High_Risk_full_dataset.csv | written | tools\scenario_exports\High_Risk_full_dataset__in_loss.csv | 9 | 3 | 25.00 |
| Profit Making | Realistic_JCurve_Growth_dataset.csv | written | tools\scenario_exports\Realistic_JCurve_Growth_dataset__profit_making.csv | 9 | 3 | 25.00 |

The exported CSVs keep the required columns and add total_expenses, net_profit, and archetype so each scenario can be used directly in the report pipeline.
The frontend-oriented exports are compacted to 9 history rows plus 3 forecast rows, so the forecast occupies about 25.00% of the chart width.