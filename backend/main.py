import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Depends, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from google.cloud import bigquery
from google.cloud.bigquery import ScalarQueryParameter, QueryJobConfig, ArrayQueryParameter
from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, timedelta
from analysis import get_analysis_data, build_where_clause, get_report_data, get_rejection_report_data, get_category_report_data, get_forecast_data
from auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    BIGQUERY_PROJECT_ID: str = 'production-dashboard-482014'
    BIGQUERY_DATASET_ID: str = 'dashboard_data'
    BIGQUERY_TABLE_ID: str = 'master_station_data'
    RING_STATUS_TABLE_ID: str = 'ring_status'
    REJECTION_ANALYSIS_TABLE_ID: str = 'rejection_analysis'
    USERS_TABLE_ID: str = 'users'

settings = Settings()

app = FastAPI()

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    email: str
    role: Optional[str] = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fqc-dash.vercel.app",
        "https://fqc-dash-six.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_origin_regex=r"https://fqc-dash.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize BigQuery client
try:
    client = bigquery.Client(project=settings.BIGQUERY_PROJECT_ID)
    TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"
    RING_STATUS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID.replace('master_station_data', 'ring_status')}`"
    REJECTION_ANALYSIS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.REJECTION_ANALYSIS_TABLE_ID}`"
    USERS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.USERS_TABLE_ID}`"

except Exception as e:
    print(f"Error initializing BigQuery client: {e}")
    client = None
    TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"
    RING_STATUS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.ring_status`"
    REJECTION_ANALYSIS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.REJECTION_ANALYSIS_TABLE_ID}`"
    USERS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.users`"

@app.get("/forecast")
async def get_forecast(
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None,
    vendor: str = Query('all', description="Vendor name"),
    sizes: Optional[List[str]] = Query(None, alias="size"),
    skus: Optional[List[str]] = Query(None, alias="sku"),
    line: Optional[str] = None
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    try:
        data = get_forecast_data(client, start_date, end_date, vendor, sizes, skus, line)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting forecast data: {e}")

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if not client:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    query = f"SELECT * FROM {USERS_TABLE} WHERE email = @email LIMIT 1"
    job_config = QueryJobConfig(query_parameters=[
        ScalarQueryParameter("email", "STRING", form_data.username)
    ])
    
    try:
        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())
        
        if not results:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        user_row = results[0]
        if not verify_password(form_data.password, user_row['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_row['email'], "role": user_row['role']}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# Helper endpoint to generate a hash for admins to use when manually creating users
@app.post("/generate-hash")
async def generate_hash(password: str = Body(..., embed=True)):
    return {"hash": get_password_hash(password)}

@app.get("/")
def read_root():
    return {"message": "GVG Dashboard Backend is running"}

@app.get("/analysis")
async def get_analysis(start_date: Optional[date] = None, end_date: Optional[date] = None, sizes: Optional[List[str]] = Query(None, alias="size"), skus: Optional[List[str]] = Query(None, alias="sku"), stage: Optional[str] = None, date_column: str = 'vqc_inward_date', line: Optional[str] = None, vendor: str = Query('all', description="Vendor name")):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    
    table_to_use = TABLE
    sku_col = 'sku'
    size_col = 'size'
    date_col = date_column

    try:
        analysis_data = get_analysis_data(client, table_to_use, start_date, end_date, sizes, skus, date_col, sku_col, size_col, line, stage, vendor)
        return analysis_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analysis data: {e}")

@app.get("/report-data")
async def get_report(
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None, 
    stage: str = Query('VQC', description="Stage: VQC, FT, or WABI SABI"),
    vendor: str = Query('all', description="Vendor name"),
    sizes: Optional[List[str]] = Query(None, alias="size"),
    skus: Optional[List[str]] = Query(None, alias="sku"),
    line: Optional[str] = None
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    
    table_to_use = RING_STATUS_TABLE
    # Assuming Wabi Sabi data (if separate) is now merged or handled appropriately in ring_status
    # If there are specific table requirements for Wabi Sabi reports, adjustments might be needed here.
    
    try:
        data = get_report_data(client, table_to_use, REJECTION_ANALYSIS_TABLE, start_date, end_date, stage, vendor, sizes, skus, line)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting report data: {e}")

@app.get("/rejection-report-data")
async def get_rejection_report(
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None, 
    stage: str = Query('VQC', description="Stage: VQC, FT, CS"),
    vendor: str = Query('all', description="Vendor name"),
    sizes: Optional[List[str]] = Query(None, alias="size"),
    skus: Optional[List[str]] = Query(None, alias="sku"),
    line: Optional[str] = None
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    try:
        data = get_rejection_report_data(client, REJECTION_ANALYSIS_TABLE, start_date, end_date, stage, vendor, sizes, skus, line)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting rejection report data: {e}")

@app.get("/category-report-data")
async def get_category_report(
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None, 
    vendor: str = Query('all', description="Vendor name"),
    sizes: Optional[List[str]] = Query(None, alias="size"),
    skus: Optional[List[str]] = Query(None, alias="sku"),
    line: Optional[str] = None
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    try:
        data = get_category_report_data(client, REJECTION_ANALYSIS_TABLE, start_date, end_date, vendor, sizes, skus, line)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting category report data: {e}")

@app.get("/kpis")
async def get_kpis(start_date: Optional[date] = None, end_date: Optional[date] = None, sizes: Optional[List[str]] = Query(None, alias="size"), skus: Optional[List[str]] = Query(None, alias="sku"), date_column: str = 'vqc_inward_date', stage: Optional[str] = None, line: Optional[str] = None, vendor: str = Query('all', description="Vendor name")):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    # Use dash_overview for aggregated KPIs.
    # Note: dash_overview does not have SKU/Size columns.
    # If filters include SKU/Size, this view returns global data (ignoring SKU/Size filters) or we must fallback to master_station_data.
    # User said "use views". Assuming overview level data is desired even if filters are present, OR filters apply to charts only.
    # However, build_where_clause generates WHERE clauses.
    # We will build a clause for the VIEW (only Date and Line).
    
    # Construct overview table name
    overview_table_name = 'dash_overview' if 'test' in settings.BIGQUERY_TABLE_ID else 'dash_overview'
    overview_table = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{overview_table_name}`"
    
    # Default to 'VQC' if stage is invalid for the overview table to avoid double counting
    overview_stage = stage if stage in ['VQC', 'FT', 'CS'] else 'VQC'
    where_clause_str, query_parameters = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line, overview_stage, vendor)

    # Base query on dash_overview
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
    
    # Stage-specific filtering is now handled by build_where_clause above
        
        # If stage is 'WABI SABI' or 'RT', usually handled by Line filter now. 
        # But if frontend still sends stage='WABI SABI' (legacy), we might want to map it or ignore if Line is set.
        # Assuming frontend updates send Line properly.

    try:
        job_config = QueryJobConfig(query_parameters=query_parameters)
        query_job = client.query(query, job_config=job_config)
        results = query_job.result()
        kpis = [dict(row) for row in results]
        # Handle case where sum is None
        result = kpis[0] if kpis else {}
        return {k: (v if v is not None else 0) for k, v in result.items()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for KPIs: {e}")

def combine_where_clauses(base_clause_str, base_params, additional_conditions):
    combined_conditions = []
    if base_clause_str and base_clause_str.strip().lower().startswith("where"):
        combined_conditions.append(base_clause_str[len("WHERE"):].strip())
    elif base_clause_str:
        combined_conditions.append(base_clause_str)

    combined_conditions.extend(additional_conditions)

    if combined_conditions:
        return f"WHERE {' AND '.join(combined_conditions)}", base_params
    return "", base_params

@app.get("/charts")
async def get_chart_data(start_date: Optional[date] = None, end_date: Optional[date] = None, sizes: Optional[List[str]] = Query(None, alias="size"), skus: Optional[List[str]] = Query(None, alias="sku"), date_column: str = 'vqc_inward_date', stage: Optional[str] = None, line: Optional[str] = None):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    wip_table = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.wip_sku_wise`"

    # VQC WIP Query
    vqc_where, vqc_params = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line, stage='VQC')
    vqc_wip_query = f"""
    SELECT sku, SUM(wip_count) as count
    FROM {wip_table}
    {vqc_where}
    GROUP BY sku
    ORDER BY sku ASC
    """

    # FT WIP Query
    ft_where, ft_params = build_where_clause(start_date, end_date, sizes, skus, 'event_date', 'sku', 'size', line, stage='FT')
    ft_wip_query = f"""
    SELECT sku, SUM(wip_count) as count
    FROM {wip_table}
    {ft_where}
    GROUP BY sku
    ORDER BY sku ASC
    """

    try:
        vqc_job = client.query(vqc_wip_query, job_config=QueryJobConfig(query_parameters=vqc_params))
        vqc_wip_results = [dict(row) for row in vqc_job.result()]

        ft_job = client.query(ft_wip_query, job_config=QueryJobConfig(query_parameters=ft_params))
        ft_wip_results = [dict(row) for row in ft_job.result()]

        return {
            "vqc_wip_sku_wise": vqc_wip_results,
            "ft_wip_sku_wise": ft_wip_results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for charts: {e}")

@app.get("/skus")
async def get_skus(table: str = 'master_station_data'):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    table_to_use = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"
    sku_col = 'sku'
    
    query = f"SELECT DISTINCT {sku_col} as sku FROM {table_to_use} WHERE {sku_col} IS NOT NULL ORDER BY sku"
    try:
        query_job = client.query(query)
        results = [row['sku'] for row in query_job.result()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for SKUs: {e}")

@app.get("/sizes")
async def get_sizes(table: str = 'master_station_data'):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    table_to_use = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"
    size_col = 'size'

    query = f"SELECT DISTINCT {size_col} as size FROM {table_to_use} WHERE {size_col} IS NOT NULL ORDER BY size"
    try:
        query_job = client.query(query)
        results = [row['size'] for row in query_job.result()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for sizes: {e}")

@app.get("/lines")
async def get_lines():
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    query = f"SELECT DISTINCT line FROM {TABLE} WHERE line IS NOT NULL ORDER BY line"
    try:
        query_job = client.query(query)
        results = [row['line'] for row in query_job.result()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for lines: {e}")

@app.get("/vendors")
async def get_vendors():
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    query = f"SELECT DISTINCT vendor FROM {TABLE} WHERE vendor IS NOT NULL ORDER BY vendor"
    try:
        job_config = QueryJobConfig(query_parameters=[])
        query_job = client.query(query, job_config=job_config)
        results = [row['vendor'] for row in query_job.result()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for vendors: {e}")


@app.get("/last-updated")
async def get_last_updated():
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    query = f"SELECT MAX(last_updated_at) as last_updated FROM {TABLE}"
    try:
        job_config = QueryJobConfig(query_parameters=[])
        query_job = client.query(query, job_config=job_config)
        results = list(query_job.result())
        last_updated = results[0]['last_updated'] if results and results[0]['last_updated'] else None
        return {"last_updated_at": last_updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for last updated time: {e}")


@app.get("/kpi-data/{kpi_name}")
async def get_kpi_data(kpi_name: str, page: int = 1, limit: int = 100, start_date: Optional[date] = None, end_date: Optional[date] = None, sizes: Optional[List[str]] = Query(None, alias="size"), skus: Optional[List[str]] = Query(None, alias="sku"), download: bool = False, date_column: str = 'vqc_inward_date', stage: Optional[str] = None, line: Optional[str] = None):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    table_to_use = TABLE
    sku_col = 'sku'
    size_col = 'size'
    date_col = date_column

    kpi_conditions = {
        'total_inward': "serial_number IS NOT NULL",
        'qc_accepted': "vqc_status = 'ACCEPTED'",
        'testing_accepted': "UPPER(ft_status) = 'ACCEPTED'",
        'total_rejected': """
            UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR
            UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR
            UPPER(cs_status) = 'REJECTED'
        """,
        'moved_to_inventory': "cs_status = 'ACCEPTED'",
        'work_in_progress': """
            (UPPER(vqc_status) NOT IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR vqc_status IS NULL) AND
            (UPPER(ft_status) NOT IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR ft_status IS NULL) AND
            (UPPER(cs_status) != 'REJECTED' OR cs_status IS NULL) AND
            (UPPER(cs_status) != 'ACCEPTED' OR cs_status IS NULL) AND
            vqc_inward_date IS NOT NULL
        """
    }

    if kpi_name not in kpi_conditions:
        raise HTTPException(status_code=404, detail="KPI name not found")

    base_where_clause_str, query_parameters = build_where_clause(start_date, end_date, sizes, skus, date_col, sku_col, size_col, line)
    kpi_where_condition = kpi_conditions[kpi_name]

    if base_where_clause_str:
        full_where_clause = f"{base_where_clause_str} AND ({kpi_where_condition})"
    else:
        full_where_clause = f"WHERE {kpi_where_condition}"
    
    select_clause = "*"

    offset = (page - 1) * limit

    job_config = QueryJobConfig(query_parameters=query_parameters)

    if download:
        data_query = f"""
            SELECT {select_clause}
            FROM {table_to_use}
            {full_where_clause}
            ORDER BY {date_column} DESC
        """
    else:
        data_query = f"""
            SELECT {select_clause}
            FROM {table_to_use}
            {full_where_clause}
            ORDER BY {date_column} DESC
            LIMIT {limit} OFFSET {offset}
        """

    try:
        if download:
            data_job = client.query(data_query, job_config=job_config)
            data = [dict(row) for row in data_job.result()]
            return {"data": data}
        else:
            count_query = f"SELECT COUNT(DISTINCT serial_number) as total FROM {table_to_use} {full_where_clause}"
            count_job = client.query(count_query, job_config=job_config)
            total_rows = list(count_job.result())[0]['total']
            total_pages = (total_rows + limit - 1) // limit

            data_job = client.query(data_query, job_config=job_config)
            data = [dict(row) for row in data_job.result()]

            return {
                "data": data,
                "total_pages": total_pages,
                "current_page": page,
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for KPI data: {e}")


@app.get("/search")
async def search_data(
    page: int = 1,
    limit: int = 100,
    serial_numbers: Optional[str] = Query(None, description="Comma-separated serial numbers"),
    stage: str = Query('All', description="Stage: VQC, FT, CS, All"),
    vendor: Optional[str] = None,
    vqc_status: Optional[List[str]] = Query(None),
    rejection_reasons: Optional[List[str]] = Query(None),
    mo_numbers: Optional[str] = Query(None, description="Comma-separated MO numbers"),
    sizes: Optional[List[str]] = Query(None, alias="size"),
    skus: Optional[List[str]] = Query(None, alias="sku"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    line: Optional[str] = None,
    download: bool = False,
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    # Determine Table and Date Column
    table_to_use = TABLE
    date_column = 'vqc_inward_date' # Default
    sku_column = 'sku'
    size_column = 'size'

    if stage == 'FT':
        date_column = 'ft_inward_date'
    elif stage == 'CS':
        date_column = 'cs_comp_date'
    
    # Unified Query Construction
    conditions = []
    query_parameters = []

    # 1. Serial Numbers (Bulk Search)
    if serial_numbers:
        sn_list = [sn.strip() for sn in serial_numbers.split(',') if sn.strip()]
        if sn_list:
            conditions.append(f"serial_number IN UNNEST(@serial_numbers)")
            query_parameters.append(ArrayQueryParameter("serial_numbers", "STRING", sn_list))

    # 2. Date Range
    if start_date and end_date:
        conditions.append(f"{date_column} BETWEEN @start_date AND @end_date")
        query_parameters.append(ScalarQueryParameter("start_date", "DATE", str(start_date)))
        query_parameters.append(ScalarQueryParameter("end_date", "DATE", str(end_date)))

    # 3. Vendor
    if vendor and vendor.lower() != 'all':
        conditions.append("vendor = @vendor")
        query_parameters.append(ScalarQueryParameter("vendor", "STRING", vendor))

    # 4. Ring Status (Multi-select)
    if vqc_status:
        if stage == 'All':
            conditions.append("(vqc_status IN UNNEST(@vqc_status_list) OR ft_status IN UNNEST(@vqc_status_list) OR cs_status IN UNNEST(@vqc_status_list))")
        elif stage == 'VQC':
            conditions.append("vqc_status IN UNNEST(@vqc_status_list)")
        elif stage == 'FT':
            conditions.append("ft_status IN UNNEST(@vqc_status_list)")
        elif stage == 'CS':
            conditions.append("cs_status IN UNNEST(@vqc_status_list)")
        else:
            conditions.append("vqc_status IN UNNEST(@vqc_status_list)")
        query_parameters.append(ArrayQueryParameter("vqc_status_list", "STRING", vqc_status))

    # 5. Rejection Reason (Multi-select across columns)
    if rejection_reasons:
        if stage == 'All':
            conditions.append("(vqc_reason IN UNNEST(@rejection_reasons) OR ft_reason IN UNNEST(@rejection_reasons) OR cs_reason IN UNNEST(@rejection_reasons))")
        elif stage == 'VQC':
            conditions.append("vqc_reason IN UNNEST(@rejection_reasons)")
        elif stage == 'FT':
            conditions.append("ft_reason IN UNNEST(@rejection_reasons)")
        elif stage == 'CS':
            conditions.append("cs_reason IN UNNEST(@rejection_reasons)")
        else:
            conditions.append("(vqc_reason IN UNNEST(@rejection_reasons) OR ft_reason IN UNNEST(@rejection_reasons) OR cs_reason IN UNNEST(@rejection_reasons))")
        query_parameters.append(ArrayQueryParameter("rejection_reasons", "STRING", rejection_reasons))

    # 6. MO Number (Bulk Search)
    if mo_numbers:
        mo_list = [mo.strip() for mo in mo_numbers.split(',') if mo.strip()]
        if mo_list:
             conditions.append("(ctpf_mo IN UNNEST(@mo_list) OR air_mo IN UNNEST(@mo_list))")
             query_parameters.append(ArrayQueryParameter("mo_list", "STRING", mo_list))

    # 7. Sizes (Multi-select)
    if sizes:
        conditions.append(f"{size_column} IN UNNEST(@sizes_list)")
        query_parameters.append(ArrayQueryParameter("sizes_list", "STRING", sizes))

    # 8. SKUs (Multi-select)
    if skus:
        conditions.append(f"{sku_column} IN UNNEST(@skus_list)")
        query_parameters.append(ArrayQueryParameter("skus_list", "STRING", skus))

    # 9. Line
    if line:
        conditions.append("line = @line")
        query_parameters.append(ScalarQueryParameter("line", "STRING", line))

    # Construct WHERE clause
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    select_clause = "*"

    # Pagination
    offset = (page - 1) * limit

    if download:
        data_query = f"""
            SELECT {select_clause}
            FROM {table_to_use}
            {where_clause}
            ORDER BY {date_column} DESC
        """
        # No LIMIT/OFFSET for download
    else:
        # Count Query
        count_query = f"SELECT COUNT(*) as total FROM {table_to_use} {where_clause}"
        
        # Data Query
        data_query = f"""
            SELECT {select_clause}
            FROM {table_to_use}
            {where_clause}
            ORDER BY {date_column} DESC
            LIMIT @limit OFFSET @offset
        """
        query_parameters.append(ScalarQueryParameter("limit", "INT64", limit))
        query_parameters.append(ScalarQueryParameter("offset", "INT64", offset))

    try:
        if download:
            job_config_data = QueryJobConfig(query_parameters=query_parameters)
            data_job = client.query(data_query, job_config=job_config_data)
            data = [dict(row) for row in data_job.result()]
            return {"data": data}
        else:
            # Execute Count
            job_config_count = QueryJobConfig(query_parameters=[p for p in query_parameters if p.name not in ['limit', 'offset']])
            count_job = client.query(count_query, job_config=job_config_count)
            total_rows = list(count_job.result())[0]['total']
            total_pages = (total_rows + limit - 1) // limit

            # Execute Data
            job_config_data = QueryJobConfig(query_parameters=query_parameters)
            data_job = client.query(data_query, job_config=job_config_data)
            data = [dict(row) for row in data_job.result()]

            return {
                "data": data,
                "total_pages": total_pages,
                "current_page": page,
                "total_records": total_rows
            }

    except Exception as e:
        print(f"Search Query Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error executing search: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))