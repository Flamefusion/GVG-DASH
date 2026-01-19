import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import bigquery
from pydantic_settings import BaseSettings

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
    # This will help in debugging connection issues, especially locally
    # In a production Cloud Run environment with correct IAM, this should not happen
    print(f"Error initializing BigQuery client: {e}")
    client = None
    TABLE = f"`{settings.BIGQUERY_PROJECT_ID}.{settings.BIGQUERY_DATASET_ID}.{settings.BIGQUERY_TABLE_ID}`"


@app.get("/")
def read_root():
    return {"message": "GVG Dashboard Backend is running"}

@app.get("/kpis")
async def get_kpis():
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    query = f"""
    WITH KpiMetrics AS (
        SELECT
            COUNT(DISTINCT serial_number) AS total_inward,
            COUNT(DISTINCT CASE WHEN vqc_status = 'ACCEPTED' THEN serial_number END) AS qc_accepted,
            COUNT(DISTINCT CASE WHEN ft_status = 'ACCEPTED' THEN serial_number END) AS testing_accepted,
            COUNT(DISTINCT CASE WHEN vqc_status = 'REJECTED' OR ft_status = 'REJECTED' THEN serial_number END) AS total_rejected,
            COUNT(DISTINCT CASE WHEN cs_status = 'ACCEPTED' THEN serial_number END) AS moved_to_inventory
        FROM
            {TABLE}
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
async def get_chart_data():
    if not client:
        raise HTTPException(status_code=500, detail="BigQuery client not initialized")

    vqc_wip_query = f"""
    SELECT
        sku,
        COUNT(DISTINCT serial_number) AS count
    FROM
        {TABLE}
    WHERE
        (vqc_status != 'REJECTED' OR vqc_status IS NULL)
        AND (ft_status != 'REJECTED' OR ft_status IS NULL)
        AND (cs_status != 'ACCEPTED' OR cs_status IS NULL)
        AND vqc_inward_date IS NOT NULL
        AND ft_inward_date IS NULL
    GROUP BY
        sku
    ORDER BY
        count DESC
    """

    ft_wip_query = f"""
    SELECT
        sku,
        COUNT(DISTINCT serial_number) AS count
    FROM
        {TABLE}
    WHERE
        (vqc_status != 'REJECTED' OR vqc_status IS NULL)
        AND (ft_status != 'REJECTED' OR ft_status IS NULL)
        AND (cs_status != 'ACCEPTED' OR cs_status IS NULL)
        AND vqc_inward_date IS NOT NULL
        AND ft_inward_date IS NOT NULL
    GROUP BY
        sku
    ORDER BY
        count DESC
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

