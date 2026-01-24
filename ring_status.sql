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
  (vqc_rejection + ft_rejection + cs_rejection) AS TOTAL_REJECTION,
  vqc_output,
  vqc_accepted,
  vqc_rejected_new,
  vqc_output_3de,
  vqc_output_ihc,
  vqc_output_makenica,
  vqc_accepted_3de,
  vqc_accepted_ihc,
  vqc_accepted_makenica,
  ft_output,
  ft_accepted,
  ft_rejected_new
FROM
  `production-dashboard-482014.dashboard_data.ring_status_mv`;