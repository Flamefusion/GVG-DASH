from google.cloud import bigquery
from typing import Optional
from datetime import date

def build_where_clause(start_date: Optional[date], end_date: Optional[date], size: Optional[str], sku: Optional[str]) -> str:
    where_conditions = []
    if start_date and end_date:
        where_conditions.append(f"vqc_inward_date BETWEEN '{start_date}' AND '{end_date}'")
    if size and size.lower() != 'all':
        where_conditions.append(f"size = '{size}'")
    if sku and sku.lower() != 'all':
        where_conditions.append(f"sku = '{sku}'")
    
    return f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

def get_analysis_data(client: bigquery.Client, table: str, start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None):
    base_where_clause = build_where_clause(start_date, end_date, size, sku)

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
    SELECT 
        CASE
            WHEN UPPER(cs_status) = 'ACCEPTED' THEN 'Accepted'
            WHEN UPPER(vqc_status) = 'RT CONVERSION' THEN 'RT CONVERSION'
            WHEN UPPER(vqc_status) = 'WABI SABI' THEN 'WABI SABI'
            WHEN UPPER(vqc_status) = 'SCRAP' THEN 'SCRAP'
            WHEN UPPER(ft_status) = 'FUNCTIONAL REJECTION' THEN 'Functional Rejection'
            WHEN UPPER(cs_status) = 'REJECTED' THEN 'Charging Station Rejection'
            ELSE 'Other'
        END AS status,
        COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause}
    GROUP BY status
    """

    # 3. Rejection Breakdown chart
    rejection_breakdown_query = f"""
    SELECT vqc_status AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause}
    WHERE UPPER(vqc_status) IN ('RT CONVERSION', 'WABI SABI', 'SCRAP')
    GROUP BY vqc_status
    """

    # 4. Rejection Trend chart
    rejection_trend_query = f"""
    SELECT
        FORMAT_DATE('%Y-%m', vqc_inward_date) AS month,
        COUNT(DISTINCT CASE
            WHEN UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL THEN serial_number
            WHEN UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL THEN serial_number
            WHEN UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL THEN serial_number
            ELSE NULL
        END) AS rejected
    FROM {table}
    {base_where_clause}
    GROUP BY month
    ORDER BY month
    """

    # 5. Top 10 VQC Rejection chart
    top_vqc_rejections_query = f"""
    SELECT vqc_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause}
    WHERE vqc_reason IS NOT NULL
    GROUP BY vqc_reason
    ORDER BY value DESC
    LIMIT 10
    """

    # 6. Top 5 FT Rejection chart
    top_ft_rejections_query = f"""
    SELECT ft_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause}
    WHERE ft_reason IS NOT NULL
    GROUP BY ft_reason
    ORDER BY value DESC
    LIMIT 5
    """
    
    # 7. Top 5 CS Rejection chart
    top_cs_rejections_query = f"""
    SELECT cs_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause}
    WHERE cs_reason IS NOT NULL
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
