from google.cloud import bigquery
from google.cloud.bigquery import ScalarQueryParameter, QueryJobConfig, ArrayQueryParameter
from typing import Optional, List
from datetime import date

FIXED_REJECTION_ROWS = [
    ("ASSEMBLY", "BLACK GLUE"),
    ("ASSEMBLY", "ULTRAHUMAN TEXT SMUDGED"),
    ("ASSEMBLY", "WHITE PATCH ON BATTERY"),
    ("ASSEMBLY", "WHITE PATCH ON PCB"),
    ("ASSEMBLY", "WHITE PATCH ON BLACK TAPE"),
    ("ASSEMBLY", "WRONG RX COIL"),
    ("CASTING", "MICRO BUBBLES"),
    ("CASTING", "ALIGNMENT ISSUE"),
    ("CASTING", "DENT ON RESIN"),
    ("CASTING", "DUST INSIDE RESIN"),
    ("CASTING", "RESIN CURING ISSUE"),
    ("CASTING", "SHORT FILL OF RESIN"),
    ("CASTING", "SPM REJECTION"),
    ("CASTING", "TIGHT FIT FOR CHARGE"),
    ("CASTING", "LOOSE FITTING ON CHARGER"),
    ("CASTING", "RESIN SHRINKAGE"),
    ("CASTING", "WRONG MOULD"),
    ("CASTING", "GLOP TOP ISSUE"),
    ("FUNCTIONAL", "100% ISSUE"),
    ("FUNCTIONAL", "3 SENSOR ISSUE"),
    ("FUNCTIONAL", "BATTERY ISSUE"),
    ("FUNCTIONAL", "BLUETOOTH HEIGHT ISSUE"),
    ("FUNCTIONAL", "CE TAPE ISSUE"),
    ("FUNCTIONAL", "CHARGING CODE ISSUE"),
    ("FUNCTIONAL", "COIL THICKNESS ISSUE/BATTERY THICKNESS"),
    ("FUNCTIONAL", "COMPONENT HEIGHT ISSUE"),
    ("FUNCTIONAL", "CURRENT ISSUE"),
    ("FUNCTIONAL", "DISCONNECTING ISSUE"),
    ("FUNCTIONAL", "HRS BUBBLE"),
    ("FUNCTIONAL", "HRS COATING HEIGHT ISSUE"),
    ("FUNCTIONAL", "HRS DOUBLE LIGHT ISSUE"),
    ("FUNCTIONAL", "HRS HEIGHT ISSUE"),
    ("FUNCTIONAL", "NO NOTIFICATION IN CDT"),
    ("FUNCTIONAL", "NOT ADVERTISING (WINGLESS PCB)"),
    ("FUNCTIONAL", "NOT CHARGING"),
    ("FUNCTIONAL", "SENSOR ISSUE"),
    ("FUNCTIONAL", "STC ISSUE"),
    ("FUNCTIONAL", "R&D REJECTION"),
    ("POLISHING", "IMPROPER RESIN FINISH"),
    ("POLISHING", "RESIN DAMAGE"),
    ("POLISHING", "RX COIL SCRATCH"),
    ("POLISHING", "SCRATCHES ON RESIN"),
    ("POLISHING", "SIDE SCRATCH"),
    ("POLISHING", "SIDE SCRATCH (EMERY)"),
    ("POLISHING", "SHELL COATING REMOVED"),
    ("POLISHING", "UNEVEN POLISHING"),
    ("POLISHING", "WHITE PATCH ON SHELL AFTER POLISHING"),
    ("POLISHING", "SCRATCHES ON SHELL"),
    ("SHELL", "BLACK MARKS ON SHELL"),
    ("SHELL", "DENT ON SHELL"),
    ("SHELL", "DISCOLORATION"),
    ("SHELL", "IRREGULAR SHELL SHAPE"),
    ("SHELL", "SHELL COATING ISSUE"),
    ("SHELL", "WHITE MARKS ON SHELL")
]

def build_where_clause(start_date: Optional[date], end_date: Optional[date], sizes: Optional[List[str]], skus: Optional[List[str]], date_column: str = 'vqc_inward_date', sku_column: str = 'sku', size_column: str = 'size', line: Optional[str] = None) -> tuple[str, list]:
    where_conditions = []
    query_parameters = []

    if start_date and end_date:
        where_conditions.append(f"{date_column} BETWEEN @start_date AND @end_date")
        query_parameters.append(ScalarQueryParameter("start_date", "DATE", str(start_date)))
        query_parameters.append(ScalarQueryParameter("end_date", "DATE", str(end_date)))

    if sizes:
        where_conditions.append(f"{size_column} IN UNNEST(@sizes)")
        query_parameters.append(ArrayQueryParameter("sizes", "STRING", sizes))

    if skus:
        where_conditions.append(f"{sku_column} IN UNNEST(@skus)")
        query_parameters.append(ArrayQueryParameter("skus", "STRING", skus))
    
    if line:
        where_conditions.append("line = @line")
        query_parameters.append(ScalarQueryParameter("line", "STRING", line))
    
    where_clause_str = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""
    return where_clause_str, query_parameters

def get_analysis_data(client: bigquery.Client, table: str, start_date: Optional[date] = None, end_date: Optional[date] = None, sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, date_column: str = 'vqc_inward_date', sku_column: str = 'sku', size_column: str = 'size', line: Optional[str] = None):
    # For Top Rejections (which need reasons/SKUs), use master_station_data (table)
    base_where_clause_str, query_parameters = build_where_clause(start_date, end_date, sizes, skus, date_column, sku_column, size_column, line)

    # For Aggregated Stats (KPIs, Trends), use dash_overview
    # dash_overview now has sku/size, so we include them in overview where clause
    overview_where, overview_params = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line)
    
    # Construct overview table name
    # table is like `project.dataset.master_station_data`
    # overview needs `project.dataset.dash_overview`
    parts = table.replace('`', '').split('.')
    if len(parts) == 3:
        overview_table = f"`{parts[0]}.{parts[1]}.dash_overview`"
    else:
        # Fallback if table name format is unexpected, assuming same dataset
        overview_table = "dash_overview" # Or handle error

    # 1. KPIs
    kpi_query = f"""
    SELECT
        SUM(total_rejection) AS total_rejected,
        SUM(`3de_tech_rejection`) AS de_tech_rejection,
        SUM(ihc_rejection) AS ihc_rejection,
        SUM(vqc_rejection) AS vqc_rejection,
        SUM(ft_rejection) AS ft_rejection,
        SUM(cs_rejection) AS cs_rejection
    FROM {overview_table}
    {overview_where}
    """

    # 2. Accepted Vs Rejected Chart
    accepted_vs_rejected_query = f"""
    SELECT 'Accepted' as name, SUM(total_accepted) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'RT Conversion' as name, SUM(rt_conversion_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'Wabi Sabi' as name, SUM(wabi_sabi_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'Scrap' as name, SUM(scrap_count) as value FROM {overview_table} {overview_where}
    """

    # 3. Rejection Breakdown chart
    rejection_breakdown_query = f"""
    SELECT 'RT CONVERSION' as name, SUM(rt_conversion_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'WABI SABI' as name, SUM(wabi_sabi_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'SCRAP' as name, SUM(scrap_count) as value FROM {overview_table} {overview_where}
    """

    # 4. Rejection Trend chart
    rejection_trend_query = f"""
    SELECT
        FORMAT_DATE('%Y-%m-%d', event_date) AS day,
        SUM(total_rejection) AS rejected
    FROM {overview_table}
    {overview_where}
    GROUP BY day
    ORDER BY day
    """

    # 5. Top 10 VQC Rejection chart (Detailed - uses master_station_data)
    vqc_reason_col = "vqc_reason"
    top_vqc_rejections_query = f"""
    SELECT {vqc_reason_col} AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause_str + " AND " if base_where_clause_str else "WHERE "}{vqc_reason_col} IS NOT NULL
    GROUP BY {vqc_reason_col}
    ORDER BY value DESC
    LIMIT 10
    """

    # 6. Top 5 FT Rejection chart
    top_ft_rejections_query = f"""
    SELECT ft_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause_str + " AND " if base_where_clause_str else "WHERE "}ft_reason IS NOT NULL
    GROUP BY ft_reason
    ORDER BY value DESC
    LIMIT 5
    """
    
    # 7. Top 5 CS Rejection chart
    top_cs_rejections_query = f"""
    SELECT cs_reason AS name, COUNT(DISTINCT serial_number) AS value
    FROM {table}
    {base_where_clause_str + " AND " if base_where_clause_str else "WHERE "}cs_reason IS NOT NULL
    GROUP BY cs_reason
    ORDER BY value DESC
    LIMIT 5
    """

    # 8. Vendor queries
    de_tech_vendor_rejections_query = f"""
    SELECT {vqc_reason_col} as name, COUNT(DISTINCT serial_number) as value
    FROM {table}
    {base_where_clause_str + " AND " if base_where_clause_str else "WHERE "} vendor = '3DE TECH' AND {vqc_reason_col} IS NOT NULL
    GROUP BY {vqc_reason_col}
    ORDER BY value DESC
    LIMIT 10
    """

    ihc_vendor_rejections_query = f"""
    SELECT {vqc_reason_col} as name, COUNT(DISTINCT serial_number) as value
    FROM {table}
    {base_where_clause_str + " AND " if base_where_clause_str else "WHERE "} vendor = 'IHC' AND {vqc_reason_col} IS NOT NULL
    GROUP BY {vqc_reason_col}
    ORDER BY value DESC
    LIMIT 10
    """

    def execute_query(query, params=None):
        if params is None:
            params = []
        job_config = QueryJobConfig(query_parameters=params)
        try:
            query_job = client.query(query, job_config=job_config)
            return [dict(row) for row in query_job.result()]
        except Exception as e:
            print(f"Error executing query: {e}")
            return []

    # KPIs and Trends use overview_params (no sku/size)
    kpis_result = execute_query(kpi_query, overview_params)
    
    return {
        "kpis": kpis_result[0] if kpis_result else {},
        "acceptedVsRejected": execute_query(accepted_vs_rejected_query, overview_params),
        "rejectionBreakdown": execute_query(rejection_breakdown_query, overview_params),
        "rejectionTrend": execute_query(rejection_trend_query, overview_params),
        # Detailed charts use query_parameters (with sku/size)
        "topVqcRejections": execute_query(top_vqc_rejections_query, query_parameters),
        "topFtRejections": execute_query(top_ft_rejections_query, query_parameters),
        "topCsRejections": execute_query(top_cs_rejections_query, query_parameters),
        "deTechVendorRejections": execute_query(de_tech_vendor_rejections_query, query_parameters),
        "ihcVendorRejections": execute_query(ihc_vendor_rejections_query, query_parameters),
    }

def get_report_data(client: bigquery.Client, ring_status_table: str, rejection_analysis_table: str, start_date: Optional[date], end_date: Optional[date], stage: str, vendor: str, sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, line: Optional[str] = None):
    
    # Use dash_overview for KPIs if possible (ignoring SKUs/Sizes as view doesn't have them)
    # ring_status_table param is actually ignored if we enforce dash_overview logic
    # But let's verify if we should use passed table or hardcode dash_overview. 
    # To be consistent with get_analysis_data, we'll derive overview table name.
    
    # Assuming ring_status_table is passed as `project.dataset.ring_status` or similar
    # We want `project.dataset.dash_overview`
    parts = ring_status_table.replace('`', '').split('.')
    if len(parts) >= 2:
        # dataset is parts[-2]
        overview_table = f"`{'.'.join(parts[:-1])}.dash_overview`"
    else:
        overview_table = "`production-dashboard-482014.dashboard_data.dash_overview`" # Fallback/Hardcode if needed

    # Build WHERE for Overview (Now with SKU/Size)
    overview_where, overview_params = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line)
    
    # Defaults
    output_expr = "SUM(total_inward)"
    accepted_expr = "SUM(total_accepted)" 
    rejected_expr = "SUM(total_rejection)"
    
    extra_conditions = []
    
    if stage == 'VQC':
        accepted_expr = "SUM(qc_accepted)"
        rejected_expr = "SUM(vqc_rejection)"
        if vendor != 'all':
             extra_conditions.append(f"vendor = @vendor_param")
             overview_params.append(ScalarQueryParameter("vendor_param", "STRING", vendor))
    elif stage == 'FT':
        accepted_expr = "SUM(testing_accepted)"
        rejected_expr = "SUM(ft_rejection)"
    elif stage == 'CS': 
        accepted_expr = "SUM(moved_to_inventory)"
        rejected_expr = "SUM(cs_rejection)"
    # Wabi Sabi line logic handled by filter on line='WABI SABI' which affects all rows
        
    if extra_conditions:
        if overview_where:
            overview_where += " AND " + " AND ".join(extra_conditions)
        else:
            overview_where = "WHERE " + " AND ".join(extra_conditions)

    kpi_query = f"""
        SELECT 
            {output_expr} as output,
            {accepted_expr} as accepted,
            {rejected_expr} as rejected
        FROM {overview_table}
        {overview_where}
    """
    
    # Rejection Analysis (Detailed) - keeps using filters (SKU/Size)
    rejection_where_conditions, rejection_query_parameters = build_where_clause(start_date, end_date, sizes, skus, 'date', 'sku', 'size', line)
    
    # Inject vendor if needed for rejection analysis
    if vendor and vendor.lower() != 'all':
        if rejection_where_conditions:
            rejection_where = f"{rejection_where_conditions} AND vendor = @vendor_param_rej"
        else:
            rejection_where = "WHERE vendor = @vendor_param_rej"
        rejection_query_parameters.append(ScalarQueryParameter("vendor_param_rej", "STRING", vendor))
    else:
        rejection_where = rejection_where_conditions

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
        job_config_kpi = QueryJobConfig(query_parameters=overview_params)
        job = client.query(kpi_query, job_config=job_config_kpi)
        res = list(job.result())
        if res:
            kpis = dict(res[0])
            kpis = {k: (v if v is not None else 0) for k, v in kpis.items()}
    except Exception as e:
        print(f"KPI Query Error: {e}")
        kpis = {"output": 0, "accepted": 0, "rejected": 0}
        
    rejections = []
    try:
        job_config_rejection = QueryJobConfig(query_parameters=rejection_query_parameters)
        job = client.query(rejection_query, job_config=job_config_rejection)
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

def get_rejection_report_data(client: bigquery.Client, rejection_analysis_table: str, start_date: date, end_date: date, vendor: Optional[str] = 'all', sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, line: Optional[str] = None):
    where_conditions = []
    query_parameters = []

    if start_date and end_date:
        where_conditions.append(f"date BETWEEN @start_date AND @end_date")
        query_parameters.append(ScalarQueryParameter("start_date", "DATE", str(start_date)))
        query_parameters.append(ScalarQueryParameter("end_date", "DATE", str(end_date)))
    
    if vendor and vendor.lower() != 'all':
        where_conditions.append("vendor = @vendor")
        query_parameters.append(ScalarQueryParameter("vendor", "STRING", vendor))
    
    if sizes:
        where_conditions.append("size IN UNNEST(@sizes)")
        query_parameters.append(ArrayQueryParameter("sizes", "STRING", sizes))

    if skus:
        where_conditions.append("sku IN UNNEST(@skus)")
        query_parameters.append(ArrayQueryParameter("skus", "STRING", skus))
        
    if line:
        where_conditions.append("line = @line")
        query_parameters.append(ScalarQueryParameter("line", "STRING", line))
    
    where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

    query = f"""
        SELECT 
            date,
            rejection_category,
            vqc_reason as reason,
            SUM(count) as count
        FROM {rejection_analysis_table}
        {where_clause}
        GROUP BY 1, 2, 3
        ORDER BY date
    """
    
    try:
        job_config = QueryJobConfig(query_parameters=query_parameters)
        job = client.query(query, job_config=job_config)
        rows = [dict(row) for row in job.result()]
    except Exception as e:
        print(f"Rejection Report Query Error: {e}")
        return {"error": str(e)}

    # Process data for KPIs and Table
    
    # KPIs
    kpis = {
        "TOTAL REJECTIONS": 0,
        "ASSEMBLY": 0,
        "CASTING": 0,
        "FUNCTIONAL": 0,
        "POLISHING": 0,
        "SHELL": 0
    }
    
    # Table Data Structure
    # Map: category -> reason -> { date: count, total: sum }
    table_data_map = {}
    all_dates = set()

    for row in rows:
        row_date = row['date'].strftime('%Y-%m-%d') if row['date'] else None
        if not row_date: continue
        
        all_dates.add(row_date)
        cat = row['rejection_category']
        reason = row['reason']
        count = row['count']

        # Update KPIs (Include everything in KPIs even if not in table)
        kpis["TOTAL REJECTIONS"] += count
        if cat in kpis:
            kpis[cat] += count
        
        # Merge "PRE NA" and "POST NA" into "NOT ADVERTISING (WINGLESS PCB)" for the table
        if reason in ['PRE NA', 'POST NA']:
            reason = 'NOT ADVERTISING (WINGLESS PCB)'
            # Ensure category is correct for merged item if needed, but assuming FUNCTIONAL is correct
            cat = 'FUNCTIONAL' 
        
        # Only process reasons that are in the fixed list (after merging)
        # Note: This means reasons not in the list (and not merged to one in the list) are excluded from the table
        # but included in KPIs above.
        
        # Update Table Map
        if cat not in table_data_map:
            table_data_map[cat] = {}
        if reason not in table_data_map[cat]:
            table_data_map[cat][reason] = {"total": 0, "dates": {}}
        
        if row_date not in table_data_map[cat][reason]["dates"]:
            table_data_map[cat][reason]["dates"][row_date] = 0
            
        table_data_map[cat][reason]["dates"][row_date] += count
        table_data_map[cat][reason]["total"] += count

    # Format Table Data List using FIXED_REJECTION_ROWS
    table_rows = []
    sorted_dates = sorted(list(all_dates))

    for stage, rejection_type in FIXED_REJECTION_ROWS:
        row = {
            "stage": stage,
            "rejection_type": rejection_type,
            "total": 0
        }
        
        # Check if we have data for this row
        if stage in table_data_map and rejection_type in table_data_map[stage]:
             data = table_data_map[stage][rejection_type]
             row["total"] = data["total"]
             for d in sorted_dates:
                 row[d] = data["dates"].get(d, 0)
        else:
             # No data, fill 0s
             for d in sorted_dates:
                 row[d] = 0
        
        table_rows.append(row)

    return {
        "kpis": kpis,
        "table_data": table_rows,
        "dates": sorted_dates
    }