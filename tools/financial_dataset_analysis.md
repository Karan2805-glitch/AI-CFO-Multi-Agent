# Financial Dataset Analysis

| Dataset | Best Fit | Confidence Gap | Schema Similarity | Revenue Growth % | Profit Margin % |
| --- | --- | ---: | ---: | ---: | ---: |
| checking_account_main.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| checking_account_secondary.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| credit_card_account.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| gusto_payroll.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| gusto_payroll_bc.csv | Growing | 0.00 | 20.00 | 0.00 | 0.00 |
| High_Profit_SME_Monthly.csv | Growing | 11.37 | 100.00 | 5637414.71 | -37988.00 |
| High_Risk_full_dataset.csv | In Loss | 61.66 | 100.00 | -100.00 | -13746.02 |
| Low_Risk_full_dataset.csv | In Loss | 12.22 | 100.00 | -94.68 | -5.45 |
| Medium_Risk_full_dataset.csv | In Loss | 51.69 | 100.00 | -99.60 | -242.52 |
| Moderate_Profit_SME_Monthly.csv | Growing | 11.18 | 100.00 | 473907.19 | -2559051.44 |
| Practical_SME_Quarterly_Avg.csv | Growing | 14.07 | 100.00 | 193434873.89 | -9477987.02 |
| Realistic_JCurve_Growth_dataset.csv | Profit Making | 28.12 | 100.00 | 53161900897403.88 | 100.00 |
| SME_JCurve_Millions_dataset.csv | Profit Making | 28.12 | 100.00 | 53160858643432.55 | 100.00 |

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

- 2024-01-28: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-02-28: revenue=0.0, expenses=0.0, net_profit=0.0
- 2024-03-28: revenue=0.0, expenses=0.0, net_profit=0.0

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
Best fit: Growing  
Scores: {
  "growing": 63.46,
  "in_loss": 52.09,
  "profit_making": 47.14
}

- 2027-01-01: revenue=9040.57, expenses=4266278.33, net_profit=-4257237.76
- 2027-02-01: revenue=9162.22, expenses=4275849.78, net_profit=-4266687.55
- 2027-03-01: revenue=9285.51, expenses=4285421.22, net_profit=-4276135.72

### High_Risk_full_dataset.csv
Best fit: In Loss  
Scores: {
  "growing": 21.93,
  "in_loss": 85.89,
  "profit_making": 24.23
}

- 2027-01-01: revenue=-2616.07, expenses=702248.99, net_profit=-704865.06
- 2027-02-01: revenue=-2631.13, expenses=703636.96, net_profit=-706268.1
- 2027-03-01: revenue=-2646.19, expenses=705024.94, net_profit=-707671.13

### Low_Risk_full_dataset.csv
Best fit: In Loss  
Scores: {
  "growing": 24.73,
  "in_loss": 54.85,
  "profit_making": 42.63
}

- 2027-01-01: revenue=-1176.7, expenses=3425.54, net_profit=-4602.24
- 2027-02-01: revenue=-1191.13, expenses=3425.54, net_profit=-4616.68
- 2027-03-01: revenue=-1205.57, expenses=3425.54, net_profit=-4631.11

### Medium_Risk_full_dataset.csv
Best fit: In Loss  
Scores: {
  "growing": 26.74,
  "in_loss": 84.12,
  "profit_making": 32.43
}

- 2027-01-01: revenue=-2379.01, expenses=10791.71, net_profit=-13170.72
- 2027-02-01: revenue=-2393.92, expenses=10802.46, net_profit=-13196.37
- 2027-03-01: revenue=-2408.82, expenses=10813.21, net_profit=-13222.02

### Moderate_Profit_SME_Monthly.csv
Best fit: Growing  
Scores: {
  "growing": 63.34,
  "in_loss": 52.16,
  "profit_making": 47.48
}

- 2027-01-01: revenue=8320.98, expenses=128752262.68, net_profit=-128743941.7
- 2027-02-01: revenue=8450.93, expenses=129036950.36, net_profit=-129028499.44
- 2027-03-01: revenue=8582.9, expenses=129321638.05, net_profit=-129313055.14

### Practical_SME_Quarterly_Avg.csv
Best fit: Growing  
Scores: {
  "growing": 64.99,
  "in_loss": 50.92,
  "profit_making": 42.48
}

- 2027-01-28: revenue=8340948.64, expenses=160284289223.89, net_profit=-160275948275.26
- 2027-02-28: revenue=8994009.04, expenses=161388829959.79, net_profit=-161379835950.75
- 2027-03-28: revenue=9698201.25, expenses=162493370695.68, net_profit=-162483672494.43

### Realistic_JCurve_Growth_dataset.csv
Best fit: Profit Making  
Scores: {
  "growing": 53.39,
  "in_loss": 7.34,
  "profit_making": 81.51
}

- 2027-01-01: revenue=2256102532177977.5, expenses=28385700.19, net_profit=2256102503792277.5
- 2027-02-01: revenue=2265011531923517.0, expenses=28120582.06, net_profit=2265011503802935.0
- 2027-03-01: revenue=2255213645890242.0, expenses=27920428.06, net_profit=2255213617969814.0

### SME_JCurve_Millions_dataset.csv
Best fit: Profit Making  
Scores: {
  "growing": 53.39,
  "in_loss": 7.34,
  "profit_making": 81.51
}

- 2027-01-01: revenue=2256102532177.98, expenses=28385.7, net_profit=2256102503792.28
- 2027-02-01: revenue=2265011531923.52, expenses=28120.58, net_profit=2265011503802.93
- 2027-03-01: revenue=2255213645890.24, expenses=27920.43, net_profit=2255213617969.81


# Archetype Exports

| Archetype | Source Dataset | Status | Export Path | Rows Written |
| --- | --- | --- | --- | ---: |
| Growing | Practical_SME_Quarterly_Avg.csv | written | D:\Projects\AI-CFO-Multi-Agent\tools\scenario_exports\Practical_SME_Quarterly_Avg__growing.csv | 210 |
| In Loss | High_Risk_full_dataset.csv | written | D:\Projects\AI-CFO-Multi-Agent\tools\scenario_exports\High_Risk_full_dataset__in_loss.csv | 618 |
| Profit Making | Realistic_JCurve_Growth_dataset.csv | written | D:\Projects\AI-CFO-Multi-Agent\tools\scenario_exports\Realistic_JCurve_Growth_dataset__profit_making.csv | 618 |

The exported CSVs keep the required columns and add total_expenses, net_profit, and archetype so each scenario can be used directly in the report pipeline.