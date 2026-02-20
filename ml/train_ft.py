from google.cloud import bigquery
client = bigquery.Client()

sql = """
CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_ft_prediction`
OPTIONS(
  model_type='BOOSTED_TREE_CLASSIFIER',
  input_label_cols=['is_ft_rejected'],
  auto_class_weights=TRUE
) AS
SELECT vendor, sku, size, line, SUBSTR(serial_number, 8, 3) as pcb, 
       EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week, 
       EXTRACT(MONTH FROM vqc_inward_date) as month, 
       CASE WHEN ft_status IN ('REJECTED', 'SCRAP', 'FUNCTIONAL BUT REJECTED', 'SHELL RELATED', 'FUNCTIONAL REJECTION') THEN 1 ELSE 0 END as is_ft_rejected
FROM `production-dashboard-482014.dashboard_data.master_station_data`
WHERE vqc_inward_date IS NOT NULL AND ft_status IS NOT NULL
"""
print("Training FT model...")
client.query(sql).result()
print("FT model trained.")
