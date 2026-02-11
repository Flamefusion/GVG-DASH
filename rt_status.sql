CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.rt_status` AS
SELECT
  COALESCE(
    SAFE.PARSE_DATE('%Y-%m-%d', CAST(vqc_inward_date AS STRING)),
    SAFE.PARSE_DATE('%d-%m-%Y', CAST(vqc_inward_date AS STRING)),
    SAFE.PARSE_DATE('%d-%m-%y', CAST(vqc_inward_date AS STRING)),
    SAFE_CAST(vqc_inward_date AS DATE)
  ) AS date,
  -- VQC Metrics
  COUNT(*) AS vqc_output,
  COUNTIF(vqc_status = 'ACCEPTED') AS vqc_accepted,
  COUNTIF(vqc_status = 'SCRAP') AS vqc_rejected_new,
  
  -- FT Metrics
  COUNTIF(ft_inward_date IS NOT NULL) AS ft_output,
  COUNTIF(ft_status = 'ACCEPTED') AS ft_accepted,
  COUNTIF(ft_status = 'REJECTED') AS ft_rejected_new,
  
  -- Legacy Columns (matching ring_status)
  COUNTIF(cs_status = 'ACCEPTED') AS ACCEPTED,
  0 AS RT_CONVERSION,
  0 AS WABI_SABI,
  COUNTIF(vqc_status = 'SCRAP' OR ft_status = 'REJECTED' OR cs_status = 'REJECTED') AS SCRAP,
  0 AS `3DE_TECH_REJECTION`,
  0 AS IHC_REJECTION,
  0 AS MAKENICA_REJECTION,
  COUNTIF(vqc_status = 'SCRAP') AS vqc_rejection,
  COUNTIF(ft_status = 'REJECTED') AS ft_rejection,
  COUNTIF(cs_status = 'REJECTED') AS cs_rejection,
  
  -- Total Rejection Calculation
  COUNTIF(vqc_status = 'SCRAP' OR ft_status = 'REJECTED' OR cs_status = 'REJECTED') AS TOTAL_REJECTION

FROM `production-dashboard-482014.dashboard_data.rt_conversion_data`
WHERE vqc_inward_date IS NOT NULL
GROUP BY 1;
