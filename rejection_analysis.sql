CREATE OR REPLACE TABLE `production-dashboard-482014.dashboard_data.rejection_analysis` AS
    WITH rejection_unpivoted AS (
        -- Single scan approach similar to dash_overview
        SELECT
            COALESCE(
                SAFE_CAST(entry.event_date AS DATE),
                SAFE.PARSE_DATE('%Y-%m-%d', CAST(entry.event_date AS STRING)),
                SAFE.PARSE_DATE('%d-%m-%Y', CAST(entry.event_date AS STRING)),
                SAFE.PARSE_DATE('%d-%m-%y', CAST(entry.event_date AS STRING))
            ) AS date,
            line,
            entry.stage,
            sku,
            size,
            vendor,
            entry.reason,
            entry.status
        FROM `production-dashboard-482014.dashboard_data.master_station_data`,
        UNNEST([
            STRUCT(vqc_inward_date AS event_date, vqc_reason AS reason, 'VQC' AS stage, vqc_status AS status),
            STRUCT(ft_inward_date AS event_date, ft_reason AS reason, 'FT' AS stage, ft_status AS status),
            STRUCT(cs_comp_date AS event_date, cs_reason AS reason, 'CS' AS stage, cs_status AS status)
        ]) AS entry
        WHERE entry.reason IS NOT NULL 
        AND entry.event_date IS NOT NULL
        -- Consistent with funnel rules: filter out WABI SABI line for VQC entry point
        AND NOT (entry.stage = 'VQC' AND (line = 'WABI SABI'))
    )
    SELECT
        date,
        line,
        stage,
        sku,
        size,
        vendor,
        status,
        -- Map and merge reasons (PRE NA/POST NA merged into NOT ADVERTISING)
        CASE 
            WHEN reason IN ('PRE NA', 'POST NA') THEN 'NOT ADVERTISING (WINGLESS PCB)'
            ELSE reason 
        END AS vqc_reason,
        CASE
            WHEN reason IN ('BLACK GLUE', 'ULTRAHUMAN TEXT SMUDGED', 'WHITE PATCH ON BATTERY', 'WHITE PATCH ON PCB', 'WHITE PATCH ON BLACK TAPE', 'WRONG RX COIL') THEN 'ASSEMBLY'
            WHEN reason IN ('MICRO BUBBLES', 'ALIGNMENT ISSUE', 'DENT ON RESIN', 'DUST INSIDE RESIN', 'RESIN CURING ISSUE', 'SHORT FILL OF RESIN', 'SPM REJECTION', 'TIGHT FIT FOR CHARGE', 'LOOSE FITTING ON CHARGER', 'RESIN SHRINKAGE', 'WRONG MOULD', 'GLOP TOP ISSUE') THEN 'CASTING'
            WHEN reason IN ('100% ISSUE', '3 SENSOR ISSUE', 'BATTERY ISSUE', 'BLUETOOTH HEIGHT ISSUE', 'CE TAPE ISSUE', 'CHARGING CODE ISSUE', 'COIL THICKNESS ISSUE/BATTERY THICKNESS', 'COMPONENT HEIGHT ISSUE', 'CURRENT ISSUE', 'DISCONNECTING ISSUE', 'HRS BUBBLE', 'HRS COATING HEIGHT ISSUE', 'HRS DOUBLE LIGHT ISSUE', 'HRS HEIGHT ISSUE', 'NO NOTIFICATION IN CDT', 'NOT ADVERTISING (WINGLESS PCB)', 'PRE NA', 'POST NA', 'NOT CHARGING', 'SENSOR ISSUE', 'STC ISSUE', 'R&D REJECTION') THEN 'FUNCTIONAL'
            WHEN reason IN ('IMPROPER RESIN FINISH', 'RESIN DAMAGE', 'RX COIL SCRATCH', 'SCRATCHES ON RESIN', 'SIDE SCRATCH', 'SIDE SCRATCH (EMERY)', 'SHELL COATING REMOVED', 'UNEVEN POLISHING', 'WHITE PATCH ON SHELL AFTER POLISHING', 'SCRATCHES ON SHELL') THEN 'POLISHING'
            WHEN reason IN ('BLACK MARKS ON SHELL', 'DENT ON SHELL', 'DISCOLORATION', 'IRREGULAR SHELL SHAPE', 'SHELL COATING ISSUE', 'WHITE MARKS ON SHELL') THEN 'SHELL'
            ELSE 'OTHER'
        END AS rejection_category,
        COUNT(*) AS count
    FROM rejection_unpivoted
    GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9;