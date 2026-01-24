CREATE MATERIALIZED VIEW `production-dashboard-482014.dashboard_data.ring_status_mv`
OPTIONS (
  enable_refresh = true,
  refresh_interval_minutes = 30
)
AS
WITH vqc_data AS (
  SELECT
    vqc_inward_date AS date,
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
),
ft_data AS (
  SELECT
    ft_inward_date AS date,
    COUNT(*) AS ft_output,
    COUNTIF(ft_status = 'ACCEPTED') AS ft_accepted,
    COUNTIF(ft_status IN ('REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED')) AS ft_rejected_new
  FROM `production-dashboard-482014.dashboard_data.master_station_data`
  WHERE ft_inward_date IS NOT NULL
  GROUP BY 1
)
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
  IFNULL(v.tech_3de_rejection_raw, 0) AS tech_3de_rejection_raw,
  IFNULL(v.ihc_rejection_raw, 0) AS ihc_rejection_raw,
  IFNULL(v.makenica_rejection_raw, 0) AS makenica_rejection_raw,
  IFNULL(v.vqc_rejection_legacy, 0) AS vqc_rejection,
  IFNULL(v.ft_rejection_on_vqc_date, 0) AS ft_rejection,
  IFNULL(v.cs_rejection, 0) AS cs_rejection
FROM vqc_data v
FULL OUTER JOIN ft_data f ON v.date = f.date