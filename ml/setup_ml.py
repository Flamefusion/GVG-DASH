from google.cloud import bigquery

client = bigquery.Client()

def setup_missing_assets():
    # 1. Create the View
    view_sql = """
    CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.ml_training_data` AS
    SELECT
      serial_number,
      vendor,
      sku,
      size,
      SUBSTR(serial_number, 8, 3) as pcb,
      line,
      EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week,
      EXTRACT(MONTH FROM vqc_inward_date) as month,
      CASE 
        WHEN vqc_status IN ('SCRAP', 'REWORK', 'CM & MM') THEN 1 
        WHEN vqc_status = 'ACCEPTED' THEN 0 
        ELSE 0 
      END as is_vqc_rejected,
      CASE 
        WHEN ft_status IN ('REJECTED', 'SCRAP', 'FUNCTIONAL BUT REJECTED', 'SHELL RELATED', 'FUNCTIONAL REJECTION') THEN 1 
        WHEN ft_status = 'ACCEPTED' THEN 0 
        ELSE 0 
      END as is_ft_rejected,
      IF(cs_status = 'REJECTED', 1, 0) as is_cs_rejected
    FROM
      `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE
      vqc_inward_date BETWEEN '2025-11-01' AND '2026-02-18'
      AND vendor IS NOT NULL 
      AND sku IS NOT NULL
      AND (vqc_status IS NOT NULL OR ft_status IS NOT NULL OR cs_status IS NOT NULL)
    """
    print("Creating view ml_training_data...")
    client.query(view_sql).result()
    print("View created successfully.")

    # 2. Create the CS Model
    cs_model_sql = """
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
    print("Creating model model_cs_prediction...")
    client.query(cs_model_sql).result()
    print("CS Model created successfully.")

if __name__ == "__main__":
    setup_missing_assets()
