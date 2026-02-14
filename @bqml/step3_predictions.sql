-- Vendor-Wise Prediction & Reporting
WITH base_data AS (
  SELECT * FROM `production-dashboard-482014.dashboard_data.ml_training_data`
),
vqc_preds AS (
  SELECT serial_number, p.prob as prob_vqc_rejected
  FROM ML.PREDICT(MODEL `production-dashboard-482014.dashboard_data.model_vqc_prediction`, (SELECT * FROM base_data)),
  UNNEST(predicted_is_vqc_rejected_probs) as p
  WHERE p.label = 1
),
ft_preds AS (
  SELECT serial_number, p.prob as prob_ft_rejected
  FROM ML.PREDICT(MODEL `production-dashboard-482014.dashboard_data.model_ft_prediction`, (SELECT * FROM base_data)),
  UNNEST(predicted_is_ft_rejected_probs) as p
  WHERE p.label = 1
),
cs_preds AS (
  SELECT serial_number, p.prob as prob_cs_rejected
  FROM ML.PREDICT(MODEL `production-dashboard-482014.dashboard_data.model_cs_prediction`, (SELECT * FROM base_data)),
  UNNEST(predicted_is_cs_rejected_probs) as p
  WHERE p.label = 1
)
SELECT
  b.vendor,
  b.sku,
  round(avg(v.prob_vqc_rejected) * 100, 2) as predicted_vqc_reject_rate,
  round(avg(f.prob_ft_rejected) * 100, 2) as predicted_ft_reject_rate,
  round(avg(c.prob_cs_rejected) * 100, 2) as predicted_cs_reject_rate
FROM base_data b
JOIN vqc_preds v ON b.serial_number = v.serial_number
JOIN ft_preds f ON b.serial_number = f.serial_number
JOIN cs_preds c ON b.serial_number = c.serial_number
GROUP BY 1, 2
ORDER BY predicted_vqc_reject_rate DESC;
