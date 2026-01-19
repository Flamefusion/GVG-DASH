import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import bigquery
from pydantic_settings import BaseSettings
from typing import Optional
from datetime import date

class Settings(BaseSettings):
    BIGQUERY_PROJECT_ID: str = 'production-dashboard-482014'
    BIGQUERY_DATASET_ID: str = 'dashboard_data'
    BIGQUERY_TABLE_ID: str = 'master_station_data'

settings = Settings()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize BigQuery client
try:
    client = bigquery.Client(project=settings.BIGQUERY_PROJECT_ID)
    TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"
except Exception as e:
    print(f"Error initializing BigQuery client: {e}")
    client = None
    TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"


def build_where_clause(start_date: Optional[date], end_date: Optional[date], size: Optional[str], sku: Optional[str]) -> str:
    where_conditions = []
    if start_date and end_date:
        where_conditions.append(f"vqc_inward_date BETWEEN '{start_date}' AND '{end_date}'")
    if size and size.lower() != 'all':
        where_conditions.append(f"size = '{size}'")
    if sku and sku.lower() != 'all':
        where_conditions.append(f"sku = '{sku}'")
    
    return f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

@app.get("/")
def read_root():
    return {"message": "GVG Dashboard Backend is running"}

@app.get("/kpis")
async def get_kpis(start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    where_clause = build_where_clause(start_date, end_date, size, sku)

    query = f"""
    WITH KpiMetrics AS (
        SELECT
            COUNT(DISTINCT serial_number) AS total_inward,
            
            COUNT(DISTINCT CASE WHEN vqc_status = 'ACCEPTED' THEN serial_number END) AS qc_accepted,
            
            COUNT(DISTINCT CASE WHEN UPPER(ft_status) = 'ACCEPTED' THEN serial_number END) AS testing_accepted,
            
            COUNT(DISTINCT CASE 
                WHEN UPPER(vqc_status) IN ('SCRAP', 'WABI SABI', 'RT CONVERSION') AND vqc_reason IS NOT NULL THEN serial_number
                WHEN UPPER(ft_status) IN ('REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION') AND ft_reason IS NOT NULL THEN serial_number
                WHEN UPPER(cs_status) = 'REJECTED' AND cs_reason IS NOT NULL THEN serial_number
                ELSE NULL
            END) AS total_rejected,

            COUNT(DISTINCT CASE WHEN cs_status = 'ACCEPTED' THEN serial_number END) AS moved_to_inventory
            
        FROM {TABLE}
        {where_clause}
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
        query_job = client.query(query)
        results = query_job.result()
        kpis = [dict(row) for row in results]
        return kpis[0] if kpis else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for KPIs: {e}")

@app.get("/charts")
async def get_chart_data(start_date: Optional[date] = None, end_date: Optional[date] = None, size: Optional[str] = None, sku: Optional[str] = None):
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    base_where_clause = build_where_clause(start_date, end_date, size, sku)

    def combine_where_clauses(base_clause, additional_conditions):
        if base_clause:
            return f"{base_clause} AND {' AND '.join(additional_conditions)}"
        return f"WHERE {' AND '.join(additional_conditions)}"

    vqc_wip_conditions = [
        "(vqc_status != 'REJECTED' OR vqc_status IS NULL)",
        "(ft_status != 'REJECTED' OR ft_status IS NULL)",
        "(cs_status != 'ACCEPTED' OR cs_status IS NULL)",
        "vqc_inward_date IS NOT NULL",
        "ft_inward_date IS NULL"
    ]
    vqc_wip_where_clause = combine_where_clauses(base_where_clause, vqc_wip_conditions)

    vqc_wip_query = f"""
    SELECT sku, COUNT(DISTINCT serial_number) AS count
    FROM {TABLE}
    {vqc_wip_where_clause}
    GROUP BY sku
    ORDER BY count DESC
    """

    ft_wip_conditions = [
        "(vqc_status != 'REJECTED' OR vqc_status IS NULL)",
        "(ft_status != 'REJECTED' OR ft_status IS NULL)",
        "(cs_status != 'ACCEPTED' OR cs_status IS NULL)",
        "vqc_inward_date IS NOT NULL",
        "ft_inward_date IS NOT NULL"
    ]
    ft_wip_where_clause = combine_where_clauses(base_where_clause, ft_wip_conditions)

    ft_wip_query = f"""
    SELECT sku, COUNT(DISTINCT serial_number) AS count
    FROM {TABLE}
    {ft_wip_where_clause}
    GROUP BY sku
    ORDER BY count DESC
    """
    try:
        vqc_wip_job = client.query(vqc_wip_query)
        vqc_wip_results = [dict(row) for row in vqc_wip_job.result()]

        ft_wip_job = client.query(ft_wip_query)
        ft_wip_results = [dict(row) for row in ft_wip_job.result()]

        return {
            "vqc_wip_sku_wise": vqc_wip_results,
            "ft_wip_sku_wise": ft_wip_results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for charts: {e}")

@app.get("/skus")
async def get_skus():
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    query = f"SELECT DISTINCT sku FROM {TABLE} WHERE sku IS NOT NULL ORDER BY sku"
    try:
        query_job = client.query(query)
        results = [row['sku'] for row in query_job.result()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for SKUs: {e}")

@app.get("/sizes")
async def get_sizes():
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")
    query = f"SELECT DISTINCT size FROM {TABLE} WHERE size IS NOT NULL ORDER BY size"
    try:
        query_job = client.query(query)
        results = [row['size'] for row in query_job.result()]
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying BigQuery for sizes: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

