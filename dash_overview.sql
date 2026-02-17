CREATE OR REPLACE TABLE `production-dashboard-482014.dashboard_data.dash_overview`
    CLUSTER BY event_date, line, vendor, sku
    AS
    WITH single_scan_funnel AS (
        -- Single scan of the master table
        SELECT
            entry.event_date,
            line,
            entry.stage,
            sku,
            size,
            vendor,
            vqc_status,
            ft_status,
            cs_status
        FROM `production-dashboard-482014.dashboard_data.master_station_data`,
        -- This unpivots the dates into stages without scanning the table 3 times
        UNNEST([
            STRUCT(vqc_inward_date AS event_date, 'VQC' AS stage),
            STRUCT(ft_inward_date AS event_date, 'FT' AS stage),
            STRUCT(cs_comp_date AS event_date, 'CS' AS stage)
        ]) AS entry
        WHERE entry.event_date IS NOT NULL
        -- Filter out WABI SABI for the VQC entry point as per your rules
        AND NOT (entry.stage = 'VQC' AND (line = 'WABI SABI'))
    )
    SELECT
        event_date,
        line,
        stage,
        sku,
        size,
        vendor,
        COUNT(*) AS total_inward,
        
        -- Funnel Metrics: Tracks the cohort's progress through all stages
        COUNTIF(vqc_status = 'ACCEPTED') AS qc_accepted,
        COUNTIF(UPPER(ft_status) = 'ACCEPTED') AS testing_accepted,
        COUNTIF(cs_status = 'ACCEPTED') AS moved_to_inventory,
        COUNTIF(cs_status = 'ACCEPTED') AS total_accepted, -- Success = Finished the funnel

        -- Rejection Metrics (Calculated across the entire funnel for this cohort)
        COUNTIF(
            UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR
            UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR
            UPPER(cs_status) = 'REJECTED'
        ) AS total_rejection,
        
        COUNTIF(vendor = '3DE TECH' AND (
            UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR 
            UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR
            UPPER(cs_status) = 'REJECTED'
        )) AS `3de_tech_rejection`,
        
        COUNTIF(vendor = 'IHC' AND (
            UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR 
            UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR
            UPPER(cs_status) = 'REJECTED'
        )) AS ihc_rejection,
        
        -- Individual stage rejection counts for that cohort
        COUNTIF(UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION')) AS vqc_rejection,
        COUNTIF(UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION')) AS ft_rejection,
        COUNTIF(UPPER(cs_status) = 'REJECTED') AS cs_rejection,

        -- Chart Breakdown (Cohort based - for Accepted vs Rejected)
        COUNTIF(vqc_status = 'RT CONVERSION') AS rt_conversion_count,
        COUNTIF(vqc_status = 'WABI SABI' OR ft_status = 'WABI SABI') AS wabi_sabi_count,
        COUNTIF(
            UPPER(vqc_status) = 'SCRAP' OR 
            UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'FUNCTIONAL REJECTION') OR 
            UPPER(cs_status) = 'REJECTED'
        ) AS scrap_count,

        -- Rejection Breakdown (Stage specific - for Breakdown chart)
        COUNTIF(stage = 'VQC' AND vqc_status = 'RT CONVERSION') AS stage_rt_conversion_count,
        COUNTIF((stage = 'VQC' AND vqc_status = 'WABI SABI') OR (stage = 'FT' AND ft_status = 'WABI SABI')) AS stage_wabi_sabi_count,
        COUNTIF(
            (stage = 'VQC' AND UPPER(vqc_status) = 'SCRAP') OR 
            (stage = 'FT' AND UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'FUNCTIONAL REJECTION')) OR 
            (stage = 'CS' AND UPPER(cs_status) = 'REJECTED')
        ) AS stage_scrap_count,

        -- Work In Progress (Cohorts still in the system)
        COUNTIF(
            (UPPER(vqc_status) NOT IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR vqc_status IS NULL) AND
            (UPPER(ft_status) NOT IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR ft_status IS NULL) AND
            (UPPER(cs_status) != 'REJECTED' OR cs_status IS NULL) AND
            (cs_status != 'ACCEPTED' OR cs_status IS NULL)
        ) AS work_in_progress,

        SAFE_DIVIDE(COUNTIF(cs_status = 'ACCEPTED'), COUNT(*)) AS yield

    FROM single_scan_funnel
    GROUP BY 1, 2, 3, 4, 5, 6;