CREATE VIEW `production-dashboard-482014.dashboard_data.ring_status` AS
SELECT
  date,
  ACCEPTED,
  RT_CONVERSION,
  WABI_SABI,
  SCRAP,
  tech_3de_rejection_raw AS `3DE_TECH_REJECTION`,
  ihc_rejection_raw AS IHC_REJECTION,
  makenica_rejection_raw AS MAKENICA_REJECTION,
  vqc_rejection,
  ft_rejection,
  cs_rejection,
  -- Now we can safely do the math
  (vqc_rejection + ft_rejection + cs_rejection) AS TOTAL_REJECTION
FROM
  `production-dashboard-482014.dashboard_data.ring_status_mv`;