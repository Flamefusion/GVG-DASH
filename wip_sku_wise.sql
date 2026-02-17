CREATE OR REPLACE TABLE `production-dashboard-482014.dashboard_data.wip_sku_wise` AS
SELECT
    vqc_inward_date AS event_date,
    line,
    CASE 
        WHEN cs_comp_date IS NOT NULL THEN 'CS'
        WHEN ft_inward_date IS NOT NULL THEN 'FT'
        ELSE 'VQC'
    END AS stage,
    sku,
    size,
    vendor,
    COUNT(*) AS wip_count
FROM `production-dashboard-482014.dashboard_data.master_station_data`
WHERE vqc_inward_date IS NOT NULL
AND (UPPER(vqc_status) NOT IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR vqc_status IS NULL)
AND (UPPER(ft_status) NOT IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR ft_status IS NULL)
AND (UPPER(cs_status) != 'REJECTED' OR cs_status IS NULL)
AND (cs_status != 'ACCEPTED' OR cs_status IS NULL)
GROUP BY 1, 2, 3, 4, 5, 6;
