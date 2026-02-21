# =============================================================================
# config.py — All settings in one place. Edit this file only.
# =============================================================================

# --- BigQuery Credentials ---
# Uses Application Default Credentials (ADC)
# Run once in your terminal before using the pipeline:
#   gcloud auth application-default login
# No key file needed.

# --- BigQuery Project & Dataset ---
BQ_PROJECT_ID       = "production-dashboard-482014"
BQ_DATASET          = "dashboard_data"

# --- Source Tables (read from) ---
TABLE_MASTER        = f"{BQ_PROJECT_ID}.{BQ_DATASET}.master_station_data"
TABLE_OVERVIEW      = f"{BQ_PROJECT_ID}.{BQ_DATASET}.dash_overview"
TABLE_REJECTION     = f"{BQ_PROJECT_ID}.{BQ_DATASET}.rejection_analysis"

# --- Destination (write forecast results to) ---
TABLE_FORECAST      = f"{BQ_PROJECT_ID}.{BQ_DATASET}.forecast_7day"

# --- Training Date Range ---
# Only use data from this window to train the models
TRAIN_START_DATE    = "2025-12-01"
TRAIN_END_DATE      = "2026-02-19"

# --- Forecast Horizon ---
FORECAST_DAYS       = 7   # How many days ahead to forecast

# --- Batch Size Estimation ---
ROLLING_WINDOW_DAYS = 14  # Rolling average window for predicting upcoming batch qty

# --- Model Settings ---
# Number of trees in the Random Forest (higher = more accurate but slower)
RF_N_ESTIMATORS     = 300
RF_MAX_DEPTH        = 10
RF_RANDOM_STATE     = 42

# XGBoost settings
XGB_N_ESTIMATORS    = 300
XGB_LEARNING_RATE   = 0.05
XGB_MAX_DEPTH       = 6
XGB_RANDOM_STATE    = 42

# Ensemble weight: final_pred = RF_WEIGHT * rf_pred + XGB_WEIGHT * xgb_pred
# Must sum to 1.0
RF_WEIGHT           = 0.5
XGB_WEIGHT          = 0.5

# Top N rejection reasons to surface per SKU+Vendor combo in the forecast
TOP_N_REJECTION_REASONS = 3

# --- Suppression Settings (for Rare SKUs) ---
# Only include SKUs that have appeared in the last 14 days
SUPPRESS_RARE_THRESHOLD_DAYS = 14
# Only include SKUs that have appeared at least 5 times in the total training window
MIN_FREQUENCY_TOTAL = 5

# --- Status values considered as REJECTED at each stage ---
VQC_REJECTED_STATUSES = {'SCRAP', 'WABI SABI', 'RT CONVERSION'}
FT_REJECTED_STATUSES  = {
    'REJECTED', 'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED',
    'SCRAP', 'SHELL RELATED', 'WABI SABI', 'FUNCTIONAL REJECTION'
}
CS_REJECTED_STATUSES  = {'REJECTED'}