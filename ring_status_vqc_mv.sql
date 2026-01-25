CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.ring_status_vqc_mv`
AS
SELECT
  -- Try parsing multiple formats: YYYY-MM-DD, DD-MM-YYYY, DD-MM-YY
  COALESCE(
    SAFE.PARSE_DATE('%Y-%m-%d', CAST(vqc_inward_date AS STRING)),
    SAFE.PARSE_DATE('%d-%m-%Y', CAST(vqc_inward_date AS STRING)),
    SAFE.PARSE_DATE('%d-%m-%y', CAST(vqc_inward_date AS STRING)),
    SAFE_CAST(vqc_inward_date AS DATE)
  ) AS date,
  -- Total VQC Counts
  COUNT(*) AS vqc_output,
  COUNTIF(vqc_status = 'ACCEPTED') AS vqc_accepted,
  COUNTIF(vqc_status IN ('RT CONVERSION', 'WABI SABI', 'SCRAP', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED')) AS vqc_rejected_new,
  
  -- Vendor Specific VQC Counts
  COUNTIF(vendor = '3DE TECH') AS vqc_output_3de,
  COUNTIF(vendor = 'IHC') AS vqc_output_ihc,
  COUNTIF(vendor = 'MAKENICA') AS vqc_output_makenica,
  
  COUNTIF(vendor = '3DE TECH' AND vqc_status = 'ACCEPTED') AS vqc_accepted_3de,
  COUNTIF(vendor = 'IHC' AND vqc_status = 'ACCEPTED') AS vqc_accepted_ihc,
  COUNTIF(vendor = 'MAKENICA' AND vqc_status = 'ACCEPTED') AS vqc_accepted_makenica,
  
  -- Existing Legacy Logic (mapped to VQC date)
  COUNTIF(cs_status = 'ACCEPTED') AS cs_accepted_on_vqc_date,
  COUNTIF(vqc_status = 'RT CONVERSION') AS rt_conversion,
  COUNTIF(vqc_status = 'WABI SABI' OR ft_status = 'WABI SABI') AS wabi_sabi,
  COUNTIF(
      vqc_status IN ('SCRAP', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'WABI SABI') OR 
      ft_status IN ('REJECTED', 'SCRAP', 'SHELL RELATED ', 'WABI SABI', 'FUNCTIONAL REJECTION') OR 
      cs_status = 'REJECTED'
  ) AS scrap,
  COUNTIF(vendor = '3DE TECH' AND (vqc_status = 'SCRAP' OR ft_status = 'Functional Rejection' OR cs_status = 'REJECTED')) AS tech_3de_rejection_raw,
  COUNTIF(vendor = 'IHC' AND (vqc_status = 'SCRAP' OR ft_status = 'Functional Rejection' OR cs_status = 'REJECTED')) AS ihc_rejection_raw,
  COUNTIF(vendor = 'MAKENICA' AND (vqc_status = 'SCRAP' OR ft_status = 'Functional Rejection' OR cs_status = 'REJECTED')) AS makenica_rejection_raw,
  COUNTIF(vqc_status IN ('RT CONVERSION', 'WABI SABI', 'SCRAP')) AS vqc_rejection_legacy,
  COUNTIF(ft_reason IS NOT NULL) AS ft_rejection_on_vqc_date,
  COUNTIF(cs_status = 'REJECTED') AS cs_rejection
FROM `production-dashboard-482014.dashboard_data.master_station_data`
WHERE vqc_inward_date IS NOT NULL
GROUP BY 1