CREATE MATERIALIZED VIEW `production-dashboard-482014.dashboard_data.ring_status_mv`
OPTIONS (
  enable_refresh = true,
  refresh_interval_minutes = 30
)
AS
SELECT
  vqc_inward_date AS date,
  COUNTIF(cs_status = 'ACCEPTED') AS ACCEPTED,
  COUNTIF(vqc_status = 'RT CONVERSION') AS RT_CONVERSION,
  COUNTIF(vqc_status = 'WABI SABI' OR ft_status = 'WABI SABI') AS WABI_SABI,
  COUNTIF(
    vqc_status IN ('SCRAP', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'WABI SABI') OR 
    ft_status IN ('REJECTED', 'SCRAP', 'SHELL RELATED ', 'WABI SABI', 'FUNCTIONAL REJECTION') OR 
    cs_status = 'REJECTED'
  ) AS SCRAP,
  COUNTIF(vendor = '3DE TECH' AND (vqc_status = 'SCRAP' OR ft_status = 'Functional Rejection' OR cs_status = 'REJECTED')) AS tech_3de_rejection_raw,
  COUNTIF(vendor = 'IHC' AND (vqc_status = 'SCRAP' OR ft_status = 'Functional Rejection' OR cs_status = 'REJECTED')) AS ihc_rejection_raw,
  COUNTIF(vendor = 'MAKENICA' AND (vqc_status = 'SCRAP' OR ft_status = 'Functional Rejection' OR cs_status = 'REJECTED')) AS makenica_rejection_raw,
  COUNTIF(vqc_status IN ('RT CONVERSION', 'WABI SABI', 'SCRAP')) AS vqc_rejection,
  COUNTIF(ft_reason IS NOT NULL) AS ft_rejection,
  COUNTIF(cs_status = 'REJECTED') AS cs_rejection
FROM
  `production-dashboard-482014.dashboard_data.master_station_data`
WHERE
  vqc_inward_date IS NOT NULL
GROUP BY
  vqc_inward_date;