CREATE MATERIALIZED VIEW `production-dashboard-482014.dashboard_data.ring_status`
OPTIONS (
  enable_refresh = true,
  refresh_interval_minutes = 30
)
AS
SELECT
  vqc_inward_date AS date,
  COUNTIF(cs_status = 'ACCEPTED') AS ACCEPTED,
  COUNTIF(vqc_status = 'RT CONVERSION' OR ft_status = 'SHELL RELATED') AS RT_CONVERSION,
  COUNTIF(vqc_status = 'WABI SABI' OR ft_status = 'WABI SABI') AS WABI_SABI,
  COUNTIF(vqc_status = 'SCRAP' OR ft_status = 'Functional Rejection' OR cs_status = 'REJECTED') AS SCRAP
FROM
  `production-dashboard-482014.dashboard_data.master_station_data`
WHERE
  vqc_inward_date IS NOT NULL
GROUP BY
  vqc_inward_date;