CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.wabi_sabi_status` AS
SELECT
  COALESCE(
    SAFE.PARSE_DATE('%Y-%m-%d', CAST(inward_date AS STRING)),
    SAFE.PARSE_DATE('%d-%m-%Y', CAST(inward_date AS STRING)),
    SAFE.PARSE_DATE('%d-%m-%y', CAST(inward_date AS STRING)),
    SAFE_CAST(inward_date AS DATE)
  ) AS date,
  -- Summary Metrics
  COUNT(*) AS output,
  COUNTIF(cs_status = 'ACCEPTED') AS accepted,
  COUNTIF(cs_status = 'REJECTED') AS rejected,
  
  -- Legacy Columns (matching ring_status)
  COUNTIF(cs_status = 'ACCEPTED') AS ACCEPTED_LEGACY,
  0 AS RT_CONVERSION,
  COUNT(*) AS WABI_SABI,
  COUNTIF(cs_status = 'REJECTED') AS SCRAP,
  0 AS `3DE_TECH_REJECTION`,
  0 AS IHC_REJECTION,
  0 AS MAKENICA_REJECTION,
  0 AS vqc_rejection,
  0 AS ft_rejection,
  COUNTIF(cs_status = 'REJECTED') AS cs_rejection,
  
  -- Total Rejection Calculation
  COUNTIF(cs_status = 'REJECTED') AS TOTAL_REJECTION

FROM `production-dashboard-482014.dashboard_data.wabi_sabi_data`
WHERE inward_date IS NOT NULL
GROUP BY 1;
