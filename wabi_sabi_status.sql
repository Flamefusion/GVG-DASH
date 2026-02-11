CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.wabi_sabi_status` AS
SELECT
  inward_date AS date,
  -- Summary Metrics for Report Page
  COUNT(*) AS output,
  COUNTIF(cs_status = 'ACCEPTED') AS accepted,
  COUNTIF(ws_status = 'REJECTED' OR cs_status = 'REJECTED') AS rejected,
  
  -- VQC Metrics (mapped to ws_status for Wabi Sabi flow)
  COUNT(*) AS vqc_output,
  COUNTIF(ws_status = 'ACCEPTED') AS vqc_accepted,
  COUNTIF(ws_status = 'REJECTED') AS vqc_rejected_new,
  
  -- FT Metrics (None for Wabi Sabi)
  0 AS ft_output,
  0 AS ft_accepted,
  0 AS ft_rejected_new,
  
  -- Legacy/Compatibility Columns (matching ring_status structure)
  0 AS RT_CONVERSION,
  COUNT(*) AS WABI_SABI,
  COUNTIF(cs_status = 'REJECTED') AS SCRAP,
  0 AS `3DE_TECH_REJECTION`,
  0 AS IHC_REJECTION,
  0 AS MAKENICA_REJECTION,
  COUNTIF(ws_status = 'REJECTED') AS vqc_rejection,
  0 AS ft_rejection,
  COUNTIF(cs_status = 'REJECTED') AS cs_rejection,
  
  -- Total Rejection Calculation
  COUNTIF(ws_status = 'REJECTED' OR cs_status = 'REJECTED') AS TOTAL_REJECTION

FROM `production-dashboard-482014.dashboard_data.wabi_sabi_data`
WHERE inward_date IS NOT NULL
GROUP BY 1;