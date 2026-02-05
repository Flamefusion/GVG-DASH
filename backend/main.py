import os
from fastapi import FastAPI, HTTPException, Query, Depends, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from google.cloud import bigquery
from google.cloud.bigquery import ScalarQueryParameter, QueryJobConfig, ArrayQueryParameter
from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, timedelta
from analysis import get_analysis_data, build_where_clause, get_report_data, get_rejection_report_data
from auth import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash

class Settings(BaseSettings):
    BIGQUERY_PROJECT_ID: str = 'production-dashboard-482014'
    BIGQUERY_DATASET_ID: str = 'dashboard_data'
    BIGQUERY_TABLE_ID: str = 'master_station_data'
    RT_CONVERSION_TABLE_ID: str = 'rt_conversion_data'
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
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize BigQuery client
try:
    client = bigquery.Client(project=settings.BIGQUERY_PROJECT_ID)
    TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"
    RT_CONVERSION_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.RT_CONVERSION_TABLE_ID}`"
    RING_STATUS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID.replace('master_station_data', 'ring_status')}`"
    REJECTION_ANALYSIS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID.replace('master_station_data', 'rejection_analysis')}`"
    USERS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.USERS_TABLE_ID}`"

except Exception as e:
    print(f"Error initializing BigQuery client: {e}")
    client = None
    TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"
    RT_CONVERSION_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.RT_CONVERSION_TABLE_ID}`"
    RING_STATUS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.ring_status`"
    REJECTION_ANALYSIS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.rejection_analysis`"
    USERS_TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.users`"

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
async def get_analysis(start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None, stage: Optional[str] = None, date_column: str = 'vqc_inward_date'):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    try:
        analysis_data = get_analysis_data(client, TABLE, start_date, end_date, size, sku, date_column)
        return analysis_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analysis data: {e}")

@app.get("/report-data")
async def get_report(
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None, 
    stage: str = Query('VQC', description="Stage: VQC or FT"),
    vendor: str = Query('all', description="Vendor name")
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    try:
        data = get_report_data(client, RING_STATUS_TABLE, REJECTION_ANALYSIS_TABLE, start_date, end_date, stage, vendor)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting report data: {e}")

@app.get("/rejection-report-data")
async def get_rejection_report(
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None, 
    vendor: str = Query('all', description="Vendor name")
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    try:
        data = get_rejection_report_data(client, REJECTION_ANALYSIS_TABLE, start_date, end_date, vendor)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting rejection report data: {e}")

@app.get("/kpis")
async def get_kpis(start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None, date_column: str = 'vqc_inward_date', stage: Optional[str] = None):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    table_to_use = TABLE
    if stage in ['RT', 'RT CS']:
        table_to_use = RT_CONVERSION_TABLE

    where_clause_str, query_parameters = build_where_clause(start_date, end_date, size, sku, date_column)

    if stage in ['RT', 'RT CS']:
        query = f"""
        WITH KpiMetrics AS (
            SELECT
                COUNT(DISTINCT CASE WHEN vqc_inward_date IS NOT NULL THEN serial_number END) AS total_inward,
                COUNT(DISTINCT CASE WHEN vqc_status = 'ACCEPTED' THEN serial_number END) AS qc_accepted,
                COUNT(DISTINCT CASE WHEN ft_status = 'ACCEPTED' THEN serial_number END) AS testing_accepted,
                
                COUNT(DISTINCT CASE WHEN vqc_status = 'SCRAP' AND vqc_reason IS NOT NULL THEN serial_number END) +
                COUNT(DISTINCT CASE WHEN ft_status = 'REJECTED' AND ft_reason IS NOT NULL THEN serial_number END) +
                COUNT(DISTINCT CASE WHEN cs_status = 'REJECTED' THEN serial_number END) AS total_rejected,

                COUNT(DISTINCT CASE WHEN cs_status = 'ACCEPTED' THEN serial_number END) AS moved_to_inventory,

                COUNT(DISTINCT CASE WHEN vqc_inward_date IS NOT NULL AND ft_inward_date IS NULL THEN serial_number END) +
                COUNT(DISTINCT CASE WHEN ft_inward_date IS NOT NULL AND cs_comp_date IS NULL AND cs_status IS NULL THEN serial_number END) AS work_in_progress
                
            FROM {table_to_use}
            {where_clause_str}
        )
        SELECT
            total_inward,
            qc_accepted,
            testing_accepted,
            total_rejected,
            moved_to_inventory,
            (total_inward - total_rejected - moved_to_inventory) AS work_in_progress
        FROM KpiMetrics
        """
    else:
        query = f"""
        WITH KpiMetrics AS (
            SELECT
                COUNT(DISTINCT serial_number) AS total_inward,
                
                COUNT(DISTINCT CASE WHEN vqc_status = 'ACCEPTED' THEN serial_number END) AS qc_accepted,
                
                COUNT(DISTINCT CASE WHEN UPPER(ft_status) = 'ACCEPTED' THEN serial_number END) AS testing_accepted,
                
                COUNT(DISTINCT CASE 
                    WHEN UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') THEN serial_number
                    WHEN UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') THEN serial_number
                    WHEN UPPER(cs_status) = 'REJECTED' THEN serial_number
                    ELSE NULL
                END) AS total_rejected,

                COUNT(DISTINCT CASE WHEN cs_status = 'ACCEPTED' THEN serial_number END) AS moved_to_inventory
                
            FROM {table_to_use}
            {where_clause_str}
        )
        SELECT
            total_inward,
            qc_accepted,
            testing_accepted,
            total_rejected,
            moved_to_inventory,
            (total_inward - total_rejected - moved_to_inventory) AS work_in_progress
        FROM KpiMetrics
        """
    try:
        job_config = QueryJobConfig(query_parameters=query_parameters)
        query_job = client.query(query, job_config=job_config)
        results = query_job.result()
        kpis = [dict(row) for row in results]
        return kpis[0] if kpis else {}
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
async def get_chart_data(start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None, date_column: str = 'vqc_inward_date', stage: Optional[str] = None):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    table_to_use = TABLE
    if stage in ['RT', 'RT CS']:
        table_to_use = RT_CONVERSION_TABLE

    base_where_clause_str, query_parameters = build_where_clause(start_date, end_date, size, sku, date_column)

    if stage in ['RT', 'RT CS']:
        vqc_wip_where_clause_str, _ = combine_where_clauses(base_where_clause_str, query_parameters, ["vqc_inward_date IS NOT NULL", "ft_inward_date IS NULL", "(vqc_status != 'SCRAP' OR vqc_status IS NULL)"])
        ft_wip_where_clause_str, _ = combine_where_clauses(base_where_clause_str, query_parameters, ["ft_inward_date IS NOT NULL", "cs_comp_date IS NULL", "(ft_status != 'REJECTED' OR ft_status IS NULL)", "(cs_status != 'REJECTED' OR cs_status IS NULL)"])
    else:
        vqc_wip_conditions = [
            "(UPPER(vqc_status) NOT IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR vqc_status IS NULL)",
            "(UPPER(ft_status) NOT IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR ft_status IS NULL)",
            "(UPPER(cs_status) != 'REJECTED' OR cs_status IS NULL)",
            "(cs_status != 'ACCEPTED' OR cs_status IS NULL)",
            "vqc_inward_date IS NOT NULL",
            "ft_inward_date IS NULL"
        ]
        vqc_wip_where_clause_str, _ = combine_where_clauses(base_where_clause_str, query_parameters, vqc_wip_conditions)

        ft_wip_conditions = [
            "(UPPER(vqc_status) NOT IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR vqc_status IS NULL)",
            "(UPPER(ft_status) NOT IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR ft_status IS NULL)",
            "(UPPER(cs_status) != 'REJECTED' OR cs_status IS NULL)",
            "(cs_status != 'ACCEPTED' OR cs_status IS NULL)",
            "vqc_inward_date IS NOT NULL",
            "ft_inward_date IS NOT NULL"
        ]
        ft_wip_where_clause_str, _ = combine_where_clauses(base_where_clause_str, query_parameters, ft_wip_conditions)

    vqc_wip_query = f"""
    SELECT sku, COUNT(DISTINCT serial_number) AS count
    FROM {table_to_use}
    {vqc_wip_where_clause_str}
    GROUP BY sku
    ORDER BY sku ASC
    """

    ft_wip_query = f"""
    SELECT sku, COUNT(DISTINCT serial_number) AS count
    FROM {table_to_use}
    {ft_wip_where_clause_str}
    GROUP BY sku
    ORDER BY sku ASC
    """
    try:
        job_config_vqc = QueryJobConfig(query_parameters=query_parameters)
        vqc_wip_job = client.query(vqc_wip_query, job_config=job_config_vqc)
        vqc_wip_results = [dict(row) for row in vqc_wip_job.result()]

        job_config_ft = QueryJobConfig(query_parameters=query_parameters)
        ft_wip_job = client.query(ft_wip_query, job_config=job_config_ft)
        ft_wip_results = [dict(row) for row in ft_wip_job.result()]

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

    allowed_tables = [
        settings.BIGQUERY_TABLE_ID,
        settings.RT_CONVERSION_TABLE_ID,
        settings.RING_STATUS_TABLE_ID,
        settings.REJECTION_ANALYSIS_TABLE_ID
    ]

    if table not in allowed_tables:
        raise HTTPException(status_code=400, detail=f"Invalid table name: {table}. Allowed tables are: {', '.join(allowed_tables)}")
    
    table_to_use = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{table}`"
    
    query = f"SELECT DISTINCT sku FROM {table_to_use} WHERE sku IS NOT NULL ORDER BY sku"
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

    allowed_tables = [
        settings.BIGQUERY_TABLE_ID,
        settings.RT_CONVERSION_TABLE_ID,
        settings.RING_STATUS_TABLE_ID,
        settings.REJECTION_ANALYSIS_TABLE_ID
    ]

    if table not in allowed_tables:
        raise HTTPException(status_code=400, detail=f"Invalid table name: {table}. Allowed tables are: {', '.join(allowed_tables)}")

    table_to_use = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{table}`"

    query = f"SELECT DISTINCT size FROM {table_to_use} WHERE size IS NOT NULL ORDER BY size"
    try:
        query_job = client.query(query)
        results = [row['size'] for row in query_job.result()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for sizes: {e}")

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
async def get_kpi_data(kpi_name: str, page: int = 1, limit: int = 100, start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None, download: bool = False, date_column: str = 'vqc_inward_date', stage: Optional[str] = None):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    table_to_use = TABLE
    if stage in ['RT', 'RT CS']:
        table_to_use = RT_CONVERSION_TABLE

    if stage in ['RT', 'RT CS']:
        kpi_conditions = {
            'total_inward': "vqc_inward_date IS NOT NULL",
            'qc_accepted': "vqc_status = 'ACCEPTED'",
            'testing_accepted': "ft_status = 'ACCEPTED'",
            'total_rejected': "(vqc_status = 'SCRAP' AND vqc_reason IS NOT NULL) OR (ft_status = 'REJECTED' AND ft_reason IS NOT NULL) OR (cs_status = 'REJECTED')",
            'moved_to_inventory': "cs_status = 'ACCEPTED'",
            'work_in_progress': "serial_number IS NOT NULL AND (vqc_status != 'SCRAP' OR vqc_status IS NULL) AND (ft_status != 'REJECTED' OR ft_status IS NULL) AND (cs_status != 'REJECTED' OR cs_status IS NULL) AND (cs_status != 'ACCEPTED' OR cs_status IS NULL)"

        }
    else:
        kpi_conditions = {
            'total_inward': "serial_number IS NOT NULL",
            'qc_accepted': "vqc_status = 'ACCEPTED'",
            'testing_accepted': "UPPER(ft_status) = 'ACCEPTED'",
            'total_rejected': """
                (UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL) OR
                (UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL) OR
                (UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL)
            """,
            'moved_to_inventory': "cs_status = 'ACCEPTED'",
            'work_in_progress': """
                (UPPER(vqc_status) NOT IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') OR vqc_status IS NULL) AND
                (UPPER(ft_status) NOT IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') OR ft_status IS NULL) AND
                (UPPER(cs_status) != 'REJECTED' OR cs_status IS NULL) AND
                (UPPER(cs_status) != 'ACCEPTED' OR cs_status IS NULL) AND
                serial_number IS NOT NULL
            """
        }

    if kpi_name not in kpi_conditions:
        raise HTTPException(status_code=404, detail="KPI name not found")

    base_where_clause_str, query_parameters = build_where_clause(start_date, end_date, size, sku, date_column)
    kpi_where_condition = kpi_conditions[kpi_name]

    if base_where_clause_str:
        full_where_clause = f"{base_where_clause_str} AND ({kpi_where_condition})"
    else:
        full_where_clause = f"WHERE {kpi_where_condition}"
    
    offset = (page - 1) * limit

    job_config = QueryJobConfig(query_parameters=query_parameters)

    if download:
        data_query = f"""
            SELECT *
            FROM {table_to_use}
            {full_where_clause}
            ORDER BY {date_column} DESC
        """
    else:
        data_query = f"""
            SELECT *
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
    stage: str = Query('All', description="Stage: VQC, FT, CS, RT, All"),
    vendor: Optional[str] = None,
    vqc_status: Optional[List[str]] = Query(None),
    rejection_reasons: Optional[List[str]] = Query(None),
    mo_numbers: Optional[str] = Query(None, description="Comma-separated MO numbers"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    download: bool = False,
):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    # Determine Table and Date Column
    table_to_use = TABLE
    date_column = 'vqc_inward_date' # Default

    if stage == 'RT':
        table_to_use = RT_CONVERSION_TABLE
        date_column = 'vqc_inward_date'
    elif stage == 'FT':
        date_column = 'ft_inward_date'
    elif stage == 'CS':
        date_column = 'cs_comp_date'
    # 'VQC' and 'All' use default date_column 'vqc_inward_date' and default TABLE

    conditions = []
    query_parameters = []

    # 1. Serial Numbers (Bulk Search)
    if serial_numbers:
        # Split by comma, strip whitespace, and filter empty strings
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

    # 4. VQC Status (Multi-select)
    if vqc_status:
        conditions.append("vqc_status IN UNNEST(@vqc_status_list)")
        query_parameters.append(ArrayQueryParameter("vqc_status_list", "STRING", vqc_status))

    # 5. Rejection Reason (Multi-select across columns)
    if rejection_reasons:
        # Logic: (vqc_reason IN list OR ft_reason IN list OR cs_reason IN list)
        conditions.append("""
            (vqc_reason IN UNNEST(@rejection_reasons) OR 
             ft_reason IN UNNEST(@rejection_reasons) OR 
             cs_reason IN UNNEST(@rejection_reasons))
        """)
        query_parameters.append(ArrayQueryParameter("rejection_reasons", "STRING", rejection_reasons))

    # 6. MO Number (Bulk Search)
    if mo_numbers:
        mo_list = [mo.strip() for mo in mo_numbers.split(',') if mo.strip()]
        if mo_list:
            if stage == 'RT':
                # For RT: ctpf_po OR air_mo
                conditions.append("""
                    (ctpf_po IN UNNEST(@mo_list) OR air_mo IN UNNEST(@mo_list))
                """)
            else:
                # For others: ctpf_mo OR air_mo
                conditions.append("""
                    (ctpf_mo IN UNNEST(@mo_list) OR air_mo IN UNNEST(@mo_list))
                """)
            query_parameters.append(ArrayQueryParameter("mo_list", "STRING", mo_list))

    # Construct WHERE clause
    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # Pagination
    offset = (page - 1) * limit

    if download:
        data_query = f"""
            SELECT *
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
            SELECT *
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