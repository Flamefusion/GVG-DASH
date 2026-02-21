from google.cloud import bigquery
from google.cloud.bigquery import ScalarQueryParameter, QueryJobConfig, ArrayQueryParameter
from typing import Optional, List
from datetime import date, timedelta
import concurrent.futures

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

def build_where_clause(start_date: Optional[date], end_date: Optional[date], sizes: Optional[List[str]], skus: Optional[List[str]], date_column: str = 'vqc_inward_date', sku_column: str = 'sku', size_column: str = 'size', line: Optional[str] = None, stage: Optional[str] = None, vendor: Optional[str] = None) -> tuple[str, list]:
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
    
    if stage:
        where_conditions.append("stage = @stage")
        query_parameters.append(ScalarQueryParameter("stage", "STRING", stage))

    if vendor and vendor.lower() != 'all':
        where_conditions.append("vendor = @vendor")
        query_parameters.append(ScalarQueryParameter("vendor", "STRING", vendor))
    
    where_clause_str = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""
    return where_clause_str, query_parameters

def fetch_kpi_data(client: bigquery.Client, start_date: Optional[date], end_date: Optional[date], sizes: Optional[List[str]], skus: Optional[List[str]], line: Optional[str], stage: Optional[str], vendor: str, project_id: str, dataset_id: str, compare: bool = False):
    overview_table = f"`{project_id}.{dataset_id}.dash_overview`"
    overview_stage = stage if stage in ['VQC', 'FT', 'CS'] else 'VQC'
    
    target_start, target_end = start_date, end_date
    if compare and start_date and end_date:
        target_start = start_date - timedelta(days=30)
        target_end = end_date - timedelta(days=30)

    where_clause_str, query_parameters = build_where_clause(target_start, target_end, sizes, skus, 'event_date', 'sku', 'size', line, overview_stage, vendor)

    query = f"""
        SELECT
            SUM(total_inward) AS total_inward,
            SUM(qc_accepted) AS qc_accepted,
            SUM(testing_accepted) AS testing_accepted,
            SUM(total_rejection) AS total_rejected,
            SUM(moved_to_inventory) AS moved_to_inventory,
            SUM(work_in_progress) AS work_in_progress
        FROM {overview_table}
        {where_clause_str}
    """
    
    try:
        job_config = QueryJobConfig(query_parameters=query_parameters)
        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())
        result = results[0] if results else {}
        return {k: (v if v is not None else 0) for k, v in dict(result).items()}
    except Exception as e:
        print(f"Error in fetch_kpi_data (compare={compare}): {e}")
        return {"total_inward": 0, "qc_accepted": 0, "testing_accepted": 0, "total_rejected": 0, "moved_to_inventory": 0, "work_in_progress": 0}

def fetch_wip_charts_data(client: bigquery.Client, start_date: Optional[date], end_date: Optional[date], sizes: Optional[List[str]], skus: Optional[List[str]], line: Optional[str], project_id: str, dataset_id: str):
    wip_table = f"`{project_id}.{dataset_id}.wip_sku_wise`"

    vqc_where, vqc_params = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line, stage='VQC')
    vqc_wip_query = f"""
    SELECT sku, SUM(wip_count) as count FROM {wip_table} {vqc_where} GROUP BY sku ORDER BY sku ASC
    """

    ft_where, ft_params = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line)
    ft_wip_query = f"""
    SELECT sku, SUM(wip_count) as count FROM {wip_table} {ft_where + " AND " if ft_where else "WHERE "} stage IN ('FT', 'CS') GROUP BY sku ORDER BY sku ASC
    """

    def execute_bq(query, params):
        job = client.query(query, job_config=QueryJobConfig(query_parameters=params))
        return [dict(row) for row in job.result()]

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            vqc_future = executor.submit(execute_bq, vqc_wip_query, vqc_params)
            ft_future = executor.submit(execute_bq, ft_wip_query, ft_params)
            return {
                "vqc_wip_sku_wise": vqc_future.result(),
                "ft_wip_sku_wise": ft_future.result(),
            }
    except Exception as e:
        print(f"Error in fetch_wip_charts_data: {e}")
        return {"vqc_wip_sku_wise": [], "ft_wip_sku_wise": []}

def fetch_analysis_data(client: bigquery.Client, table: str, start_date: Optional[date] = None, end_date: Optional[date] = None, sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, date_column: str = 'vqc_inward_date', sku_column: str = 'sku', size_column: str = 'size', line: Optional[str] = None, stage: Optional[str] = None, vendor: Optional[str] = None, compare: bool = False):
    target_start, target_end = start_date, end_date
    if compare and start_date and end_date:
        target_start = start_date - timedelta(days=30)
        target_end = end_date - timedelta(days=30)

    base_where_clause_str, query_parameters = build_where_clause(target_start, target_end, sizes, skus, date_column, sku_column, size_column, line, vendor=vendor)
    overview_stage = stage if stage in ['VQC', 'FT', 'CS'] else 'VQC'
    overview_where, overview_params = build_where_clause(target_start, target_end, sizes, skus, 'event_date', 'sku', 'size', line, overview_stage, vendor=vendor)
    
    parts = table.replace('`', '').split('.')
    overview_base = 'dash_overview' if 'test' in table else 'dash_overview'
    if len(parts) == 3:
        overview_table = f"`{parts[0]}.{parts[1]}.{overview_base}`"
    else:
        overview_table = overview_base 

    stage_rejection_expr = "(stage_rt_conversion_count + stage_wabi_sabi_count + stage_scrap_count)"
    kpi_query = f"""
    SELECT
        SUM({stage_rejection_expr}) AS total_rejected,
        SUM(IF(vendor = '3DE TECH', {stage_rejection_expr}, 0)) AS de_tech_stage_rejection,
        SUM(IF(vendor = 'IHC', {stage_rejection_expr}, 0)) AS ihc_stage_rejection,
        SUM(vqc_rejection) AS vqc_rejection,
        SUM(ft_rejection) AS ft_rejection,
        SUM(cs_rejection) AS cs_rejection
    FROM {overview_table}
    {overview_where}
    """

    if compare:
        job_config = QueryJobConfig(query_parameters=overview_params)
        try:
            query_job = client.query(kpi_query, job_config=job_config)
            res = list(query_job.result())
            return res[0] if res else {}
        except Exception as e:
            print(f"Error in fetch_analysis_data comparison: {e}")
            return {}

    accepted_col = 'qc_accepted'
    if overview_stage == 'FT':
        accepted_col = 'testing_accepted'
    elif overview_stage == 'CS':
        accepted_col = 'moved_to_inventory'

    accepted_vs_rejected_query = f"""
    SELECT 'Accepted' as name, SUM({accepted_col}) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'RT Conversion' as name, SUM(stage_rt_conversion_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'Wabi Sabi' as name, SUM(stage_wabi_sabi_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'Scrap' as name, SUM(stage_scrap_count) as value FROM {overview_table} {overview_where}
    """

    rejection_breakdown_query = f"""
    SELECT 'RT CONVERSION' as name, SUM(stage_rt_conversion_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'WABI SABI' as name, SUM(stage_wabi_sabi_count) as value FROM {overview_table} {overview_where}
    UNION ALL
    SELECT 'SCRAP' as name, SUM(stage_scrap_count) as value FROM {overview_table} {overview_where}
    """

    rejection_trend_query = f"""
    SELECT
        FORMAT_DATE('%Y-%m-%d', event_date) AS day,
        SUM({stage_rejection_expr}) AS rejected
    FROM {overview_table}
    {overview_where}
    GROUP BY day
    ORDER BY day
    """

    parts = table.replace('`', '').split('.')
    rejection_base = 'rejection_analysis' if 'test' in table else 'rejection_analysis'
    if len(parts) == 3:
        rejection_table = f"`{parts[0]}.{parts[1]}.{rejection_base}`"
    else:
        rejection_table = rejection_base

    rej_where_clause_str, rej_query_parameters = build_where_clause(target_start, target_end, sizes, skus, 'date', 'sku', 'size', line)

    top_vqc_rejections_query = f"""
    SELECT vqc_reason AS name, SUM(count) AS value FROM {rejection_table} {rej_where_clause_str + " AND " if rej_where_clause_str else "WHERE "}stage = 'VQC' GROUP BY 1 ORDER BY value DESC LIMIT 10
    """

    top_ft_rejections_query = f"""
    SELECT vqc_reason AS name, SUM(count) AS value FROM {rejection_table} {rej_where_clause_str + " AND " if rej_where_clause_str else "WHERE "}stage = 'FT' GROUP BY 1 ORDER BY value DESC LIMIT 5
    """
    
    top_cs_rejections_query = f"""
    SELECT vqc_reason AS name, SUM(count) AS value FROM {rejection_table} {rej_where_clause_str + " AND " if rej_where_clause_str else "WHERE "}stage = 'CS' GROUP BY 1 ORDER BY value DESC LIMIT 5
    """

    de_tech_vendor_rejections_query = f"""
    SELECT vqc_reason as name, SUM(count) as value FROM {rejection_table} {rej_where_clause_str + " AND " if rej_where_clause_str else "WHERE "} vendor = '3DE TECH' AND stage = 'VQC' GROUP BY 1 ORDER BY value DESC LIMIT 10
    """

    ihc_vendor_rejections_query = f"""
    SELECT vqc_reason as name, SUM(count) as value FROM {rejection_table} {rej_where_clause_str + " AND " if rej_where_clause_str else "WHERE "} vendor = 'IHC' AND stage = 'VQC' GROUP BY 1 ORDER BY value DESC LIMIT 10
    """

    def execute_query_parallel(query, params=None):
        if params is None:
            params = []
        job_config = QueryJobConfig(query_parameters=params)
        try:
            query_job = client.query(query, job_config=job_config)
            return [dict(row) for row in query_job.result()]
        except Exception as e:
            print(f"Error executing query: {e}")
            return []

    queries = [
        (kpi_query, overview_params, "kpis"),
        (accepted_vs_rejected_query, overview_params, "acceptedVsRejected"),
        (rejection_breakdown_query, overview_params, "rejectionBreakdown"),
        (rejection_trend_query, overview_params, "rejectionTrend"),
        (top_vqc_rejections_query, query_parameters, "topVqcRejections"),
        (top_ft_rejections_query, query_parameters, "topFtRejections"),
        (top_cs_rejections_query, query_parameters, "topCsRejections"),
        (de_tech_vendor_rejections_query, query_parameters, "deTechVendorRejections"),
        (ihc_vendor_rejections_query, query_parameters, "ihcVendorRejections"),
    ]

    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(queries)) as executor:
        future_to_key = {executor.submit(execute_query_parallel, q, p): k for q, p, k in queries}
        for future in concurrent.futures.as_completed(future_to_key):
            key = future_to_key[future]
            try:
                data = future.result()
                if key == "kpis":
                    results[key] = data[0] if data else {}
                else:
                    results[key] = data
            except Exception as e:
                print(f"Query {key} generated an exception: {e}")
                results[key] = {} if key == "kpis" else []

    # Post-process to add "Others" category to rejection charts for accurate percentage calculation
    if results.get('kpis'):
        k = results['kpis']
        
        # Map chart keys to their respective total rejection KPI keys
        rejection_mapping = {
            "topVqcRejections": k.get("vqc_rejection", 0),
            "topFtRejections": k.get("ft_rejection", 0),
            "topCsRejections": k.get("cs_rejection", 0),
            "deTechVendorRejections": k.get("de_tech_stage_rejection", 0),
            "ihcVendorRejections": k.get("ihc_stage_rejection", 0)
        }

        for chart_key, total_val in rejection_mapping.items():
            if chart_key in results and results[chart_key] and total_val:
                current_sum = sum(item['value'] for item in results[chart_key])
                others_val = (total_val or 0) - current_sum
                if others_val > 0:
                    results[chart_key].append({"name": "Others", "value": int(others_val)})

    return results

def fetch_report_data(client: bigquery.Client, ring_status_table: str, rejection_analysis_table: str, start_date: Optional[date], end_date: Optional[date], stage: str, vendor: str, sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, line: Optional[str] = None, compare: bool = False):
    target_start, target_end = start_date, end_date
    if compare and start_date and end_date:
        target_start = start_date - timedelta(days=30)
        target_end = end_date - timedelta(days=30)

    parts = ring_status_table.replace('`', '').split('.')
    overview_base = 'dash_overview' if 'test' in ring_status_table else 'dash_overview'
    if len(parts) >= 2:
        overview_table = f"`{'.'.join(parts[:-1])}.{overview_base}`"
    else:
        overview_table = f"`production-dashboard-482014.dashboard_data.{overview_base}`" 

    overview_stage = stage if stage in ['VQC', 'FT', 'CS'] else 'VQC'
    overview_where, overview_params = build_where_clause(target_start, target_end, sizes, skus, 'event_date', 'sku', 'size', line, overview_stage, vendor)
    
    output_expr = "SUM(total_inward)"
    accepted_expr = "SUM(total_accepted)" 
    rejected_expr = "SUM(total_rejection)"
    
    if stage == 'VQC':
        accepted_expr = "SUM(qc_accepted)"
        rejected_expr = "SUM(vqc_rejection)"
    elif stage == 'FT':
        accepted_expr = "SUM(testing_accepted)"
        rejected_expr = "SUM(ft_rejection)"
    elif stage == 'CS': 
        accepted_expr = "SUM(moved_to_inventory)"
        rejected_expr = "SUM(cs_rejection)"

    kpi_query = f"""
        SELECT 
            {output_expr} as output,
            {accepted_expr} as accepted,
            {rejected_expr} as rejected
        FROM {overview_table}
        {overview_where}
    """
    
    if compare:
        job_config_kpi = QueryJobConfig(query_parameters=overview_params)
        try:
            job = client.query(kpi_query, job_config=job_config_kpi)
            res = list(job.result())
            return dict(res[0]) if res else {"output": 0, "accepted": 0, "rejected": 0}
        except Exception as e:
            print(f"Comparison KPI Error in Report: {e}")
            return {"output": 0, "accepted": 0, "rejected": 0}

    # Rejection Analysis (Detailed) - keeps using filters (SKU/Size)
    rejection_where, rejection_query_parameters = build_where_clause(target_start, target_end, sizes, skus, 'date', 'sku', 'size', line, stage=stage, vendor=vendor)

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

def get_rejection_report_data(client: bigquery.Client, rejection_analysis_table: str, start_date: date, end_date: date, stage: str, vendor: Optional[str] = 'all', sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, line: Optional[str] = None, download: bool = False):
    where_conditions = []
    query_parameters = []

    if start_date and end_date:
        where_conditions.append(f"date BETWEEN @start_date AND @end_date")
        query_parameters.append(ScalarQueryParameter("start_date", "DATE", str(start_date)))
        query_parameters.append(ScalarQueryParameter("end_date", "DATE", str(end_date)))
    
    if stage:
        where_conditions.append("stage = @stage")
        query_parameters.append(ScalarQueryParameter("stage", "STRING", stage))

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
        
        if download:
            return {"table_data": rows}
            
    except Exception as e:
        print(f"Rejection Report Query Error: {e}")
        return {"error": str(e)}

    kpis = {
        "TOTAL REJECTIONS": 0,
        "ASSEMBLY": 0,
        "CASTING": 0,
        "FUNCTIONAL": 0,
        "POLISHING": 0,
        "SHELL": 0
    }
    
    table_data_map = {}
    all_dates = set()

    for row in rows:
        row_date = row['date'].strftime('%Y-%m-%d') if row['date'] else None
        if not row_date: continue
        
        all_dates.add(row_date)
        cat = row['rejection_category']
        reason = row['reason']
        count = row['count']

        kpis["TOTAL REJECTIONS"] += count
        if cat in kpis:
            kpis[cat] += count
        
        if reason in ['PRE NA', 'POST NA']:
            reason = 'NOT ADVERTISING (WINGLESS PCB)'
            cat = 'FUNCTIONAL' 
        
        if cat not in table_data_map:
            table_data_map[cat] = {}
        if reason not in table_data_map[cat]:
            table_data_map[cat][reason] = {"total": 0, "dates": {}}
        
        if row_date not in table_data_map[cat][reason]["dates"]:
            table_data_map[cat][reason]["dates"][row_date] = 0
            
        table_data_map[cat][reason]["dates"][row_date] += count
        table_data_map[cat][reason]["total"] += count

    table_rows = []
    sorted_dates = sorted(list(all_dates))

    for stage, rejection_type in FIXED_REJECTION_ROWS:
        row = {
            "stage": stage,
            "rejection_type": rejection_type,
            "total": 0
        }
        
        if stage in table_data_map and rejection_type in table_data_map[stage]:
             data = table_data_map[stage][rejection_type]
             row["total"] = data["total"]
             for d in sorted_dates:
                 row[d] = data["dates"].get(d, 0)
        else:
             for d in sorted_dates:
                 row[d] = 0
        
        table_rows.append(row)

    return {
        "kpis": kpis,
        "table_data": table_rows,
        "dates": sorted_dates
    }

def get_category_report_data(client: bigquery.Client, rejection_analysis_table: str, start_date: date, end_date: date, vendor: Optional[str] = 'all', sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, line: Optional[str] = None, download: bool = False):
    where_conditions = ["stage = 'VQC'"]
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
            status,
            rejection_category,
            vqc_reason as reason,
            SUM(count) as count
        FROM {rejection_analysis_table}
        {where_clause}
        GROUP BY 1, 2, 3
    """
    
    try:
        job_config = QueryJobConfig(query_parameters=query_parameters)
        job = client.query(query, job_config=job_config)
        rows = [dict(row) for row in job.result()]
        
        if download:
            return rows
            
    except Exception as e:
        print(f"Category Report Query Error: {e}")
        return {"error": str(e)}

    parts = rejection_analysis_table.replace('`', '').split('.')
    overview_base = 'dash_overview' if 'test' in rejection_analysis_table else 'dash_overview'
    if len(parts) >= 2:
        overview_table = f"`{'.'.join(parts[:-1])}.{overview_base}`"
    else:
        overview_table = f"`production-dashboard-482014.dashboard_data.{overview_base}`"

    overview_where, overview_params = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line, 'VQC', vendor)
    
    total_inward_for_pct = 0
    try:
        inward_job_config = QueryJobConfig(query_parameters=overview_params)
        inward_query = f"SELECT SUM(qc_accepted) as accepted, SUM(vqc_rejection) as rejected FROM {overview_table} {overview_where}"
        inward_job = client.query(inward_query, job_config=inward_job_config)
        inward_res = list(inward_job.result())
        if inward_res:
            acc = inward_res[0]['accepted'] or 0
            rej = inward_res[0]['rejected'] or 0
            total_inward_for_pct = int(acc + rej)
    except Exception as e:
        print(f"Inward Query Error in Category Report: {e}")

    kpis = {
        "TOTAL REJECTION": 0,
        "RT CONVERSION": 0,
        "WABI SABI": 0,
        "SCRAP": 0,
        "total_inward": total_inward_for_pct
    }
    
    breakdown = {
        "TOTAL REJECTION": {},
        "RT CONVERSION": {},
        "WABI SABI": {},
        "SCRAP": {}
    }
    
    categories = ["ASSEMBLY", "CASTING", "FUNCTIONAL", "SHELL", "POLISHING"]
    agg = {outcome: {cat: {} for cat in categories} for outcome in breakdown}

    for row in rows:
        status = (row['status'] or "").upper()
        cat = (row['rejection_category'] or "").upper()
        reason = row['reason']
        count = row['count']
        
        if cat not in categories: continue

        kpis["TOTAL REJECTION"] += count
        
        if reason in agg["TOTAL REJECTION"][cat]:
            agg["TOTAL REJECTION"][cat][reason] += count
        else:
            agg["TOTAL REJECTION"][cat][reason] = count
        
        outcome_key = None
        if status == 'RT CONVERSION':
            outcome_key = 'RT CONVERSION'
        elif status == 'WABI SABI':
            outcome_key = 'WABI SABI'
        elif status == 'SCRAP':
            outcome_key = 'SCRAP'
            
        if outcome_key:
            kpis[outcome_key] += count
            if reason in agg[outcome_key][cat]:
                agg[outcome_key][cat][reason] += count
            else:
                agg[outcome_key][cat][reason] = count

    for outcome in breakdown:
        for cat in categories:
            rejections_list = [
                {"name": name, "value": int(count)} 
                for name, count in agg[outcome][cat].items()
            ]
            rejections_list.sort(key=lambda x: x["value"], reverse=True)
            
            total_count = sum(item["value"] for item in rejections_list)
            breakdown[outcome][cat] = {
                "total": total_count,
                "rejections": rejections_list
            }

    return {
        "kpis": kpis,
        "breakdown": breakdown
    }

def get_forecast_data(client: bigquery.Client, start_date: date, end_date: date, vendor: Optional[str] = 'all', sizes: Optional[List[str]] = None, skus: Optional[List[str]] = None, line: Optional[str] = None):
    # The new view created by the ML pipeline
    forecast_view = "`production-dashboard-482014.dashboard_data.forecast_7day_view`"
    
    # We use a broader where clause for the view since it only has 7 days of data
    # Filters: SKU, Size, Vendor, Line
    where_conditions = []
    query_parameters = []

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

    # 1. Overall KPIs (Average across all forecasted rows)
    kpi_query = f"""
        SELECT 
            AVG(forecasted_yield_pct) as forecasted_yield,
            SUM(forecasted_good_units) as forecasted_good_units,
            SUM(forecasted_rejection_units) as forecasted_rejection_units,
            AVG(model_confidence_pct) as model_confidence
        FROM {forecast_view}
        {where_clause}
    """

    # 2. Daily Trend (Aggregated by Date)
    trend_query = f"""
        SELECT 
            FORMAT_DATE('%a, %d %b', forecast_date) as day,
            AVG(forecasted_yield_pct) as predicted_yield,
            SUM(forecasted_good_units) as good_units,
            SUM(forecasted_rejection_units) as rejection_units,
            AVG(rf_yield_pct) as rf_yield,
            AVG(xgb_yield_pct) as xgb_yield
        FROM {forecast_view}
        {where_clause}
        GROUP BY forecast_date, day
        ORDER BY forecast_date
    """

    # 3. Top Predicted Rejection Reasons (Aggregated)
    rejection_reasons_query = f"""
        SELECT reason, AVG(prob) as probability
        FROM (
            SELECT top_rejection_reason_1 as reason, rejection_prob_1_pct as prob FROM {forecast_view} {where_clause}
            UNION ALL
            SELECT top_rejection_reason_2 as reason, rejection_prob_2_pct as prob FROM {forecast_view} {where_clause}
            UNION ALL
            SELECT top_rejection_reason_3 as reason, rejection_prob_3_pct as prob FROM {forecast_view} {where_clause}
        )
        WHERE reason != 'N/A'
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 10
    """

    # 4. Detailed Data Table (for Predicted reasons table)
    detailed_table_query = f"""
        SELECT 
            sku, vendor, size, line,
            forecasted_yield_pct,
            forecasted_good_units,
            forecasted_rejection_units,
            model_confidence_pct,
            top_rejection_reason_1, rejection_prob_1_pct,
            top_rejection_reason_2, rejection_prob_2_pct,
            top_rejection_reason_3, rejection_prob_3_pct
        FROM {forecast_view}
        {where_clause}
        ORDER BY forecasted_yield_pct ASC
        LIMIT 50
    """

    try:
        job_config = QueryJobConfig(query_parameters=query_parameters)
        
        kpis_res = list(client.query(kpi_query, job_config=job_config).result())
        kpis = dict(kpis_res[0]) if kpis_res else {}
        
        trend_data = [dict(row) for row in client.query(trend_query, job_config=job_config).result()]
        rejection_reasons = [dict(row) for row in client.query(rejection_reasons_query, job_config=job_config).result()]
        detailed_data = [dict(row) for row in client.query(detailed_table_query, job_config=job_config).result()]

        return {
            "kpis": {
                "forecasted_yield": round(kpis.get('forecasted_yield', 0), 1),
                "forecasted_good_units": int(kpis.get('forecasted_good_units', 0)),
                "forecasted_rejection_units": int(kpis.get('forecasted_rejection_units', 0)),
                "model_confidence": round(kpis.get('model_confidence', 0), 1)
            },
            "yieldTrend": trend_data,
            "topPredictedRejections": [{"name": r['reason'], "value": round(r['probability'], 1)} for r in rejection_reasons],
            "detailedForecast": detailed_data
        }
    except Exception as e:
        print(f"Forecast Query Error: {e}")
        return {"error": str(e)}
