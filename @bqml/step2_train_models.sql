-- A. Predict VQC Rejection
CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_vqc_prediction`
OPTIONS(
  model_type='BOOSTED_TREE_CLASSIFIER',
  input_label_cols=['is_vqc_rejected'],
  auto_class_weights=TRUE
) AS
SELECT vendor, sku, size, pcb, line, day_of_week, month, is_vqc_rejected
FROM `production-dashboard-482014.dashboard_data.ml_training_data`;

-- B. Predict FT Rejection
CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_ft_prediction`
OPTIONS(
  model_type='BOOSTED_TREE_CLASSIFIER',
  input_label_cols=['is_ft_rejected'],
  auto_class_weights=TRUE
) AS
SELECT vendor, sku, size, pcb, line, day_of_week, month, is_ft_rejected
FROM `production-dashboard-482014.dashboard_data.ml_training_data`;

-- C. Predict CS Rejection
CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_cs_prediction`
OPTIONS(
  model_type='BOOSTED_TREE_CLASSIFIER',
  input_label_cols=['is_cs_rejected'],
  auto_class_weights=TRUE
) AS
SELECT vendor, sku, size, pcb, line, day_of_week, month, is_cs_rejected
FROM `production-dashboard-482014.dashboard_data.ml_training_data`;
