CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.ring_status` AS
SELECT
  COALESCE(v.date, f.date) AS date,
  -- VQC Metrics
  IFNULL(v.vqc_output, 0) AS vqc_output,
  IFNULL(v.vqc_accepted, 0) AS vqc_accepted,
  IFNULL(v.vqc_rejected_new, 0) AS vqc_rejected_new,
  
  IFNULL(v.vqc_output_3de, 0) AS vqc_output_3de,
  IFNULL(v.vqc_output_ihc, 0) AS vqc_output_ihc,
  IFNULL(v.vqc_output_makenica, 0) AS vqc_output_makenica,
  
  IFNULL(v.vqc_accepted_3de, 0) AS vqc_accepted_3de,
  IFNULL(v.vqc_accepted_ihc, 0) AS vqc_accepted_ihc,
  IFNULL(v.vqc_accepted_makenica, 0) AS vqc_accepted_makenica,
  
  -- FT Metrics
  IFNULL(f.ft_output, 0) AS ft_output,
  IFNULL(f.ft_accepted, 0) AS ft_accepted,
  IFNULL(f.ft_rejected_new, 0) AS ft_rejected_new,
  
  -- Legacy Columns
  IFNULL(v.cs_accepted_on_vqc_date, 0) AS ACCEPTED,
  IFNULL(v.rt_conversion, 0) AS RT_CONVERSION,
  IFNULL(v.wabi_sabi, 0) AS WABI_SABI,
  IFNULL(v.scrap, 0) AS SCRAP,
  IFNULL(v.tech_3de_rejection_raw, 0) AS `3DE_TECH_REJECTION`,
  IFNULL(v.ihc_rejection_raw, 0) AS IHC_REJECTION,
  IFNULL(v.makenica_rejection_raw, 0) AS MAKENICA_REJECTION,
  IFNULL(v.vqc_rejection_legacy, 0) AS vqc_rejection,
  IFNULL(v.ft_rejection_on_vqc_date, 0) AS ft_rejection,
  IFNULL(v.cs_rejection, 0) AS cs_rejection,
  
  -- Total Rejection Calculation
  (IFNULL(v.vqc_rejection_legacy, 0) + IFNULL(v.ft_rejection_on_vqc_date, 0) + IFNULL(v.cs_rejection, 0)) AS TOTAL_REJECTION

FROM `production-dashboard-482014.dashboard_data.ring_status_vqc_mv` v
FULL OUTER JOIN `production-dashboard-482014.dashboard_data.ring_status_ft_mv` f ON v.date = f.date;