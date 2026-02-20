from google.cloud import bigquery
client = bigquery.Client()

sql = """
CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_cs_prediction`
OPTIONS(
  model_type='BOOSTED_TREE_CLASSIFIER',
  input_label_cols=['is_cs_rejected'],
  auto_class_weights=TRUE
) AS
SELECT vendor, sku, size, line, SUBSTR(serial_number, 8, 3) as pcb, 
       EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week, 
       EXTRACT(MONTH FROM vqc_inward_date) as month, 
       IF(cs_status = 'REJECTED', 1, 0) as is_cs_rejected
FROM `production-dashboard-482014.dashboard_data.master_station_data`
WHERE vqc_inward_date IS NOT NULL AND cs_status IS NOT NULL
"""
print("Training CS model...")
client.query(sql).result()
print("CS model trained.")
