from google.cloud import bigquery
from typing import Optional
from datetime import date

def build_where_clause(start_date: Optional[date], end_date: Optional[date], size: Optional[str], sku: Optional[str], date_column: str = 'vqc_inward_date') -> str:
    where_conditions = []
    if start_date and end_date:
        where_conditions.append(f"{date_column} BETWEEN '{start_date}' AND '{end_date}'")
    if size and size.lower() != 'all':
        where_conditions.append(f"size = '{size}'")
    if sku and sku.lower() != 'all':
        where_conditions.append(f"sku = '{sku}'")
    
    return f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

def get_analysis_data(client: bigquery.Client, table: str, start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None, date_column: str = 'vqc_inward_date'):
    base_where_clause = build_where_clause(start_date, end_date, size, sku, date_column)

    # 1. KPIs
    kpi_query = f"""
    SELECT
        COUNT(DISTINCT CASE
            WHEN UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL THEN serial_number
            WHEN UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL THEN serial_number
            WHEN UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL THEN serial_number
            ELSE NULL
        END) AS total_rejected,
        COUNT(DISTINCT CASE
            WHEN vendor = '3DE TECH' AND (
                (UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL) OR
                (UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL) OR
                (UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL)
            ) THEN serial_number
            ELSE NULL
        END) AS de_tech_rejection,
        COUNT(DISTINCT CASE
            WHEN vendor = 'IHC' AND (
                (UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL) OR
                (UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL) OR
                (UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL)
            ) THEN serial_number
            ELSE NULL
        END) AS ihc_rejection,
        COUNT(DISTINCT CASE
            WHEN UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL THEN serial_number
            ELSE NULL
        END) AS vqc_rejection,
        COUNT(DISTINCT CASE
            WHEN UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL THEN serial_number
            ELSE NULL
        END) AS ft_rejection,
        COUNT(DISTINCT CASE
            WHEN UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL THEN serial_number
            ELSE NULL
        END) AS cs_rejection
    FROM {table}
    {base_where_clause}
    """

    # 2. Accepted Vs Rejected Chart
    accepted_vs_rejected_query = f"""
    WITH data AS (
        SELECT
            CASE
                WHEN UPPER(cs_status) = 'ACCEPTED' THEN 'Accepted'
                WHEN UPPER(vqc_status) = 'RT CONVERSION' THEN 'RT Conversion'
                WHEN UPPER(vqc_status) = 'WABI SABI' THEN 'Wabi Sabi'
                WHEN UPPER(vqc_status) = 'SCRAP' THEN 'Scrap'
                WHEN UPPER(ft_status) = 'FUNCTIONAL REJECTION' THEN 'Scrap'
                WHEN UPPER(cs_status) = 'REJECTED' THEN 'Scrap'
                ELSE 'Other'
            END AS name,
            serial_number
        FROM {table}
        {base_where_clause}
    )
    SELECT name, COUNT(DISTINCT serial_number) AS value
    FROM data
    WHERE name != 'Other'
    GROUP BY name
    """

    # 3. Rejection Breakdown chart
    rejection_breakdown_query = f"""
    SELECT vqc_status AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause + " AND " if base_where_clause else "WHERE "}UPPER(vqc_status) IN ('RT CONVERSION', 'WABI SABI', 'SCRAP')
    GROUP BY vqc_status
    """

    # 4. Rejection Trend chart
    rejection_trend_query = f"""
    SELECT
        FORMAT_DATE('%Y-%m-%d', {date_column}) AS day,
        COUNT(DISTINCT CASE
            WHEN UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL THEN serial_number
            WHEN UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL THEN serial_number
            WHEN UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL THEN serial_number
            ELSE NULL
        END) AS rejected
    FROM {table}
    {base_where_clause + " AND " if base_where_clause else "WHERE "}{date_column} IS NOT NULL
    GROUP BY day
    ORDER BY day
    """

    # 5. Top 10 VQC Rejection chart
    top_vqc_rejections_query = f"""
    SELECT vqc_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause + " AND " if base_where_clause else "WHERE "}vqc_reason IS NOT NULL
    GROUP BY vqc_reason
    ORDER BY value DESC
    LIMIT 10
    """

    # 6. Top 5 FT Rejection chart
    top_ft_rejections_query = f"""
    SELECT ft_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause + " AND " if base_where_clause else "WHERE "}ft_reason IS NOT NULL
    GROUP BY ft_reason
    ORDER BY value DESC
    LIMIT 5
    """
    
    # 7. Top 5 CS Rejection chart
    top_cs_rejections_query = f"""
    SELECT cs_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause + " AND " if base_where_clause else "WHERE "}cs_reason IS NOT NULL
    GROUP BY cs_reason
    ORDER BY value DESC
    LIMIT 5
    """

    # 8. 3DE TECH Vendor Top 10 Rejection
    de_tech_vendor_rejections_query = f"""
    SELECT vqc_reason as name, COUNT(DISTINCT serial_number) as value
    FROM {table}
    {base_where_clause + " AND " if base_where_clause else "WHERE "} vendor = '3DE TECH' AND vqc_reason IS NOT NULL
    GROUP BY vqc_reason
    ORDER BY value DESC
    LIMIT 10
    """

    # 9. IHC vendor top 10 Rejection
    ihc_vendor_rejections_query = f"""
    SELECT vqc_reason as name, COUNT(DISTINCT serial_number) as value
    FROM {table}
    {base_where_clause + " AND " if base_where_clause else "WHERE "} vendor = 'IHC' AND vqc_reason IS NOT NULL
    GROUP BY vqc_reason
    ORDER BY value DESC
    LIMIT 10
    """

    def execute_query(query):
        try:
            query_job = client.query(query)
            return [dict(row) for row in query_job.result()]
        except Exception as e:
            print(f"Error executing query: {e}")
            return []

    kpis_result = execute_query(kpi_query)
    
    return {
        "kpis": kpis_result[0] if kpis_result else {},
        "acceptedVsRejected": execute_query(accepted_vs_rejected_query),
        "rejectionBreakdown": execute_query(rejection_breakdown_query),
        "rejectionTrend": execute_query(rejection_trend_query),
        "topVqcRejections": execute_query(top_vqc_rejections_query),
        "topFtRejections": execute_query(top_ft_rejections_query),
        "topCsRejections": execute_query(top_cs_rejections_query),
        "deTechVendorRejections": execute_query(de_tech_vendor_rejections_query),
        "ihcVendorRejections": execute_query(ihc_vendor_rejections_query),
    }

def get_report_data(client: bigquery.Client, ring_status_table: str, rejection_analysis_table: str, start_date: Optional[date], end_date: Optional[date], stage: str, vendor: str):
    
    where_clause = ""
    conditions = []
    if start_date and end_date:
        conditions.append(f"date BETWEEN '{start_date}' AND '{end_date}'")
    
    if conditions:
        where_clause = f"WHERE {' AND '.join(conditions)}"
        
    # Defaults
    output_col = "vqc_output"
    accepted_col = "vqc_accepted"
    rejected_col = "vqc_rejected_new" 
    
    if stage == 'VQC':
        if vendor == '3DE TECH':
            output_col = "vqc_output_3de"
            accepted_col = "vqc_accepted_3de"
            rejected_col = "`3DE_TECH_REJECTION`"
        elif vendor == 'IHC':
            output_col = "vqc_output_ihc"
            accepted_col = "vqc_accepted_ihc"
            rejected_col = "IHC_REJECTION"
        elif vendor == 'MAKENICA':
            output_col = "vqc_output_makenica"
            accepted_col = "vqc_accepted_makenica"
            rejected_col = "MAKENICA_REJECTION"
        else: # All vendors
            output_col = "vqc_output"
            accepted_col = "vqc_accepted"
            rejected_col = "vqc_rejected_new"

    elif stage == 'FT':
        output_col = "ft_output"
        accepted_col = "ft_accepted"
        rejected_col = "ft_rejected_new"
        
    kpi_query = f"""
        SELECT 
            SUM({output_col}) as output,
            SUM({accepted_col}) as accepted,
            SUM({rejected_col}) as rejected
        FROM {ring_status_table}
        {where_clause}
    """
    
    rejection_where = where_clause
    if stage == 'VQC' and vendor and vendor.lower() != 'all':
        if rejection_where:
            rejection_where += f" AND vendor = '{vendor}'"
        else:
            rejection_where = f"WHERE vendor = '{vendor}'"
            
    rejection_query = f"""
        SELECT 
            rejection_category,
            vqc_reason as reason,
            SUM(count) as value
        FROM {rejection_analysis_table}
        {rejection_where}
        GROUP BY 1, 2
        ORDER BY 1, 3 DESC
    """
    
    kpis = {}
    try:
        job = client.query(kpi_query)
        res = list(job.result())
        if res:
            kpis = dict(res[0])
            # Handle nulls
            kpis = {k: (v if v is not None else 0) for k, v in kpis.items()}
    except Exception as e:
        print(f"KPI Query Error: {e}")
        kpis = {"output": 0, "accepted": 0, "rejected": 0}
        
    rejections = []
    try:
        job = client.query(rejection_query)
        rejections = [dict(row) for row in job.result()]
    except Exception as e:
        print(f"Rejection Query Error: {e}")

    grouped_rejections = {}
    for r in rejections:
        cat = r['rejection_category']
        if cat not in grouped_rejections:
            grouped_rejections[cat] = []
        grouped_rejections[cat].append({"name": r['reason'], "value": r['value']})
        
    return {
        "kpis": kpis,
        "rejections": grouped_rejections
    }