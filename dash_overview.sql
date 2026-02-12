CREATE OR REPLACE VIEW `production-dashboard-482014.dashboard_data.dash_overview` AS
WITH vqc_data AS (
    SELECT
        vqc_inward_date AS event_date,
        line,
        'VQC' AS stage,
        vqc_status AS status,
        vendor,
        sku,
        size
    FROM `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE vqc_inward_date IS NOT NULL AND (line != 'WABI SABI' OR line IS NULL)
),
ft_data AS (
    SELECT
        ft_inward_date AS event_date,
        line,
        'FT' AS stage,
        ft_status AS status,
        vendor,
        sku,
        size
    FROM `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE ft_inward_date IS NOT NULL
),
cs_data AS (
    SELECT
        cs_comp_date AS event_date,
        line,
        'CS' AS stage,
        cs_status AS status,
        vendor,
        sku,
        size
    FROM `production-dashboard-482014.dashboard_data.master_station_data`
    WHERE cs_comp_date IS NOT NULL
),
combined AS (
    SELECT * FROM vqc_data
    UNION ALL
    SELECT * FROM ft_data
    UNION ALL
    SELECT * FROM cs_data
)
SELECT
    event_date,
    line,
    stage,
    sku,
    size,
    COUNT(*) AS total_inward,
    
    -- Accepted Metrics
    COUNTIF(stage = 'VQC' AND status = 'ACCEPTED') AS qc_accepted,
    COUNTIF(stage = 'FT' AND status = 'ACCEPTED') AS testing_accepted,
    COUNTIF(stage = 'CS' AND status = 'ACCEPTED') AS moved_to_inventory,
    COUNTIF(status = 'ACCEPTED') AS total_accepted,

    -- Rejection Metrics
    COUNTIF(status IN ('SCRAP', 'WABI SABI', 'RT CONVERSION', 'REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SHELL RELATED', 'FUNCTIONAL REJECTION')) AS total_rejection,
    
    COUNTIF(vendor = '3DE TECH' AND status IN ('SCRAP', 'WABI SABI', 'RT CONVERSION', 'REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SHELL RELATED', 'FUNCTIONAL REJECTION')) AS `3de_tech_rejection`,
    COUNTIF(vendor = 'IHC' AND status IN ('SCRAP', 'WABI SABI', 'RT CONVERSION', 'REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SHELL RELATED', 'FUNCTIONAL REJECTION')) AS ihc_rejection,
    
    COUNTIF(stage = 'VQC' AND status IN ('SCRAP', 'WABI SABI', 'RT CONVERSION', 'REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED')) AS vqc_rejection,
    COUNTIF(stage = 'FT' AND status IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION')) AS ft_rejection,
    COUNTIF(stage = 'CS' AND status = 'REJECTED') AS cs_rejection,

    -- Breakdown for Charts
    COUNTIF(status = 'RT CONVERSION') AS rt_conversion_count,
    COUNTIF(status = 'WABI SABI') AS wabi_sabi_count,
    COUNTIF(status IN ('SCRAP', 'REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SHELL RELATED', 'FUNCTIONAL REJECTION')) AS scrap_count,

    -- Work In Progress (Pending Status on the day of inward)
    COUNTIF(status IS NULL) AS work_in_progress,

    -- Yield
    SAFE_DIVIDE(COUNTIF(status = 'ACCEPTED'), COUNT(*)) AS yield

FROM combined
GROUP BY 1, 2, 3, 4, 5;