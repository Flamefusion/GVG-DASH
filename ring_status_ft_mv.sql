CREATE MATERIALIZED VIEW `production-dashboard-482014.dashboard_data.ring_status_ft_mv`
OPTIONS (
  enable_refresh = true,
  refresh_interval_minutes = 30
)
AS
SELECT
  CAST(ft_inward_date AS DATE) AS date,
  COUNT(*) AS ft_output,
  COUNTIF(ft_status = 'ACCEPTED') AS ft_accepted,
  COUNTIF(ft_status IN ('REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED')) AS ft_rejected_new
FROM `production-dashboard-482014.dashboard_data.master_station_data`
WHERE ft_inward_date IS NOT NULL
GROUP BY 1