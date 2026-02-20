from google.cloud import bigquery
import os

client = bigquery.Client()

def train_models():
    print("Starting Model Training on BigQuery ML (XGBoost/Boosted Trees)...")
    
    # Model A: VQC Prediction
    vqc_sql = """
    CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_vqc_prediction`
    OPTIONS(
      model_type='BOOSTED_TREE_CLASSIFIER',
      input_label_cols=['is_vqc_rejected'],
      auto_class_weights=TRUE
    ) AS
    SELECT vendor, sku, size, line, SUBSTR(serial_number, 8, 3) as pcb, 
           EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week, 
           EXTRACT(MONTH FROM vqc_inward_date) as month, 
           CASE WHEN vqc_status IN ('SCRAP', 'REWORK', 'CM & MM') THEN 1 ELSE 0 END as is_vqc_rejected
    FROM `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE vqc_inward_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH) 
    AND vqc_status IS NOT NULL
    """
    
    # Model B: FT Prediction
    ft_sql = """
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
    WHERE vqc_inward_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH) 
    AND ft_status IS NOT NULL
    """

    # Model C: CS Prediction
    cs_sql = """
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
    WHERE vqc_inward_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH) 
    AND cs_status IS NOT NULL
    """

    for name, sql in [("VQC", vqc_sql), ("FT", ft_sql), ("CS", cs_sql)]:
        print(f"Training {name} model...")
        client.query(sql).result()
        print(f"{name} model trained successfully.")

if __name__ == "__main__":
    train_models()
