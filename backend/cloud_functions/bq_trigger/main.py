import base64
import json
from google.cloud import bigquery

# Configuration
PROJECT_ID = "production-dashboard-482014"
DATASET_ID = "dashboard_data"
MASTER_TABLE = "master_station_data"

client = bigquery.Client()

def bq_trigger_handler(event, context):
    """
    Triggered by a Pub/Sub message from a Cloud Logging sink.
    Expects BigQuery Audit Logs for 'google.cloud.bigquery.v2.JobService.InsertJob'
    """

    # 1. Parse the log entry from Pub/Sub
    if 'data' in event:
        log_data = base64.b64decode(event['data']).decode('utf-8')
        log_json = json.loads(log_data)
        
        # Optional: Add extra validation to ensure it was a successful MERGE on the right table
        # proto_payload = log_json.get('protoPayload', {})
        # query = proto_payload.get('serviceData', {}).get('jobInsertResponse', {}).get('resource', {}).get('jobConfiguration', {}).get('query', {}).get('query', "")
    print(f"Triggered by ETL completion signal. Updating live summary tables...")
    try:
        update_dash_overview()
        update_rejection_analysis()
        print("Successfully updated all live summary tables.")
    except Exception as e:
        print(f"Error during update: {e}")

def update_dash_overview():
    sql = """
    CREATE OR REPLACE TABLE `production-dashboard-482014.dashboard_data.dash_overview` AS
    WITH single_scan_funnel AS (
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
        UNNEST([
            STRUCT(vqc_inward_date AS event_date, 'VQC' AS stage),
            STRUCT(ft_inward_date AS event_date, 'FT' AS stage),
            STRUCT(cs_comp_date AS event_date, 'CS' AS stage)
        ]) AS entry
        WHERE entry.event_date IS NOT NULL
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
        COUNTIF(vqc_status = 'ACCEPTED') AS qc_accepted,
        COUNTIF(UPPER(ft_status) = 'ACCEPTED') AS testing_accepted,
        COUNTIF(cs_status = 'ACCEPTED') AS moved_to_inventory,
        COUNTIF(cs_status = 'ACCEPTED') AS total_accepted,
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
            UPPER(ft_status) IN ('REJECTED', 'AEST_REJECTED', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR
            UPPER(cs_status) = 'REJECTED'
        )) AS ihc_rejection,
        COUNTIF(UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION')) AS vqc_rejection,
        COUNTIF(UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION')) AS ft_rejection,
        COUNTIF(UPPER(cs_status) = 'REJECTED') AS cs_rejection,
        COUNTIF(vqc_status = 'RT CONVERSION') AS rt_conversion_count,
        COUNTIF(vqc_status = 'WABI SABI' OR ft_status = 'WABI SABI') AS wabi_sabi_count,
        COUNTIF(
            UPPER(vqc_status) = 'SCRAP' OR 
            UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'FUNCTIONAL REJECTION') OR 
            UPPER(cs_status) = 'REJECTED'
        ) AS scrap_count,
        COUNTIF(stage = 'VQC' AND vqc_status = 'RT CONVERSION') AS stage_rt_conversion_count,
        COUNTIF((stage = 'VQC' AND vqc_status = 'WABI SABI') OR (stage = 'FT' AND ft_status = 'WABI SABI')) AS stage_wabi_sabi_count,
        COUNTIF(
            (stage = 'VQC' AND UPPER(vqc_status) = 'SCRAP') OR 
            (stage = 'FT' AND UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'FUNCTIONAL REJECTION')) OR 
            (stage = 'CS' AND UPPER(cs_status) = 'REJECTED')
        ) AS stage_scrap_count,
        COUNTIF(
            (UPPER(vqc_status) NOT IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR vqc_status IS NULL) AND
            (UPPER(ft_status) NOT IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR ft_status IS NULL) AND
            (UPPER(cs_status) != 'REJECTED' OR cs_status IS NULL) AND
            (cs_status != 'ACCEPTED' OR cs_status IS NULL)
        ) AS work_in_progress,
        SAFE_DIVIDE(COUNTIF(cs_status = 'ACCEPTED'), COUNT(*)) AS yield
    FROM single_scan_funnel
    GROUP BY 1, 2, 3, 4, 5, 6;
    """
    query_job = client.query(sql)
    query_job.result()
    print("dash_overview updated.")

def update_rejection_analysis():
    sql = """
    CREATE OR REPLACE TABLE `production-dashboard-482014.dashboard_data.rejection_analysis` AS
    WITH rejection_unpivoted AS (
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
    """
    query_job = client.query(sql)
    query_job.result()
    print("rejection_analysis updated.")
