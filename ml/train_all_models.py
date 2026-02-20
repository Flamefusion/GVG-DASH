from google.cloud import bigquery

client = bigquery.Client()

def train_all_models():
    print("Initializing Model Training (VQC, FT, CS) for Nov 2025 to Feb 18, 2026...")
    
    date_filter = "vqc_inward_date BETWEEN '2025-11-01' AND '2026-02-18'"
    
    # Model A: VQC Prediction
    vqc_sql = f"""
    CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_vqc_prediction`
    OPTIONS(
      model_type='BOOSTED_TREE_CLASSIFIER',
      input_label_cols=['is_vqc_rejected'],
      auto_class_weights=TRUE
    ) AS
    SELECT vendor, sku, size, line, SUBSTR(serial_number, 8, 3) as pcb, 
           EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week, 
           EXTRACT(MONTH FROM vqc_inward_date) as month, 
           CASE WHEN UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') THEN 1 ELSE 0 END as is_vqc_rejected
    FROM `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE {date_filter} AND vqc_status IS NOT NULL
    """
    
    # Model B: FT Prediction
    ft_sql = f"""
    CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_ft_prediction`
    OPTIONS(
      model_type='BOOSTED_TREE_CLASSIFIER',
      input_label_cols=['is_ft_rejected'],
      auto_class_weights=TRUE
    ) AS
    SELECT vendor, sku, size, line, SUBSTR(serial_number, 8, 3) as pcb, 
           EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week, 
           EXTRACT(MONTH FROM vqc_inward_date) as month, 
           CASE WHEN UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') THEN 1 ELSE 0 END as is_ft_rejected
    FROM `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE {date_filter} AND ft_status IS NOT NULL
    """

    # Model C: CS Prediction
    cs_sql = f"""
    CREATE OR REPLACE MODEL `production-dashboard-482014.dashboard_data.model_cs_prediction`
    OPTIONS(
      model_type='BOOSTED_TREE_CLASSIFIER',
      input_label_cols=['is_cs_rejected'],
      auto_class_weights=TRUE
    ) AS
    SELECT vendor, sku, size, line, SUBSTR(serial_number, 8, 3) as pcb, 
           EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week, 
           EXTRACT(MONTH FROM vqc_inward_date) as month, 
           IF(UPPER(cs_status) = 'REJECTED', 1, 0) as is_cs_rejected
    FROM `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE {date_filter} AND cs_status IS NOT NULL
    """

    for name, sql in [("VQC", vqc_sql), ("FT", ft_sql), ("CS", cs_sql)]:
        print(f"Training {name} model...")
        client.query(sql).result()
        print(f"{name} model trained successfully.")

if __name__ == "__main__":
    train_all_models()
