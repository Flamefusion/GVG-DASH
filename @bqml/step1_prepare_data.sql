-- Create a flattened view for ML
CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.ml_training_data` AS
SELECT
  serial_number,
  vendor,
  sku,
  size,
  SUBSTR(serial_number, 8, 3) as pcb,
  line,
  -- Extract temporal features (Time of year/week can impact quality)
  EXTRACT(DAYOFWEEK FROM vqc_inward_date) as day_of_week,
  EXTRACT(MONTH FROM vqc_inward_date) as month,
  -- Target variables: 1 if Rejected/Scrapped, 0 if Accepted
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
  vendor IS NOT NULL 
  AND sku IS NOT NULL
  -- Ensure we only train on data that has a definitive status
  AND (vqc_status IS NOT NULL OR ft_status IS NOT NULL OR cs_status IS NOT NULL);
