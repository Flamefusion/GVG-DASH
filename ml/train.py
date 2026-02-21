# =============================================================================
# train_and_forecast.py — Main ML Pipeline
# Run: python train_and_forecast.py
# =============================================================================

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date

from google.cloud import bigquery

from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error
import xgboost as xgb

import config

# =============================================================================
# STEP 0 — BigQuery Connection
# =============================================================================
def get_bq_client():
    print("\n[BQ] Connecting to BigQuery using Application Default Credentials...")
    client = bigquery.Client(project=config.BQ_PROJECT_ID)
    print("[BQ] Connected successfully.")
    return client


# =============================================================================
# STEP 1 — Load Training Data from BigQuery
# =============================================================================
def load_data(client):
    print(f"\n[DATA] Loading master data from {config.TRAIN_START_DATE} to {config.TRAIN_END_DATE}...")

    # Pull the full cohort data in a single query
    # We use the master table directly for maximum feature richness
    query = f"""
        SELECT
            vqc_inward_date         AS event_date,
            line,
            sku,
            size,
            vendor,
            vqc_status,
            ft_status,
            cs_status,
            vqc_reason,
            ft_reason,
            cs_reason
        FROM `{config.TABLE_MASTER}`
        WHERE vqc_inward_date BETWEEN '{config.TRAIN_START_DATE}' AND '{config.TRAIN_END_DATE}'
          AND vqc_inward_date IS NOT NULL
          AND NOT (line = 'WABI SABI')
        ORDER BY vqc_inward_date
    """
    df = client.query(query).to_dataframe()
    print(f"[DATA] Loaded {len(df):,} records.")
    return df


# =============================================================================
# STEP 2 — Feature Engineering
# =============================================================================
def engineer_features(df):
    print("\n[FEAT] Engineering features...")

    df = df.copy()
    df['event_date'] = pd.to_datetime(df['event_date'])

    # --- Target: was this unit ultimately accepted? ---
    df['is_accepted'] = (df['cs_status'] == 'ACCEPTED').astype(int)

    # --- Was this unit rejected at any stage? ---
    df['is_rejected'] = (
        df['vqc_status'].str.upper().isin(config.VQC_REJECTED_STATUSES) |
        df['ft_status'].str.upper().isin(config.FT_REJECTED_STATUSES) |
        df['cs_status'].str.upper().isin(config.CS_REJECTED_STATUSES)
    ).astype(int)

    # --- Time features ---
    df['day_of_week']  = df['event_date'].dt.dayofweek   # 0=Mon, 6=Sun
    df['week_of_year'] = df['event_date'].dt.isocalendar().week.astype(int)
    df['month']        = df['event_date'].dt.month
    df['day_of_month'] = df['event_date'].dt.day

    # --- Daily batch size per SKU+Vendor ---
    batch_daily = (
        df.groupby(['event_date', 'sku', 'vendor'])
        .size()
        .reset_index(name='batch_size')
    )
    df = df.merge(batch_daily, on=['event_date', 'sku', 'vendor'], how='left')

    # --- Daily yield per SKU+Vendor (for rolling calc) ---
    daily_yield = (
        df.groupby(['event_date', 'sku', 'vendor'])['is_accepted']
        .mean()
        .reset_index(name='daily_yield')
    )

    # --- Rolling 7-day & 14-day yield per SKU+Vendor ---
    daily_yield = daily_yield.sort_values('event_date')
    daily_yield['roll7_yield'] = (
        daily_yield.groupby(['sku', 'vendor'])['daily_yield']
        .transform(lambda x: x.shift(1).rolling(7, min_periods=1).mean())
    )
    daily_yield['roll14_yield'] = (
        daily_yield.groupby(['sku', 'vendor'])['daily_yield']
        .transform(lambda x: x.shift(1).rolling(14, min_periods=1).mean())
    )

    df = df.merge(daily_yield[['event_date', 'sku', 'vendor', 'roll7_yield', 'roll14_yield']],
                  on=['event_date', 'sku', 'vendor'], how='left')

    # --- Rolling 14-day batch size per SKU+Vendor (used for future batch estimation) ---
    batch_rolling = (
        batch_daily.sort_values('event_date')
        .groupby(['sku', 'vendor'])['batch_size']
        .transform(lambda x: x.shift(1).rolling(14, min_periods=1).mean())
    )
    batch_daily['roll14_batch'] = batch_rolling
    df = df.merge(
        batch_daily[['event_date', 'sku', 'vendor', 'roll14_batch']],
        on=['event_date', 'sku', 'vendor'], how='left'
    )

    # Fill NaN rolling values with the global mean (cold start safety)
    df['roll7_yield']   = df['roll7_yield'].fillna(df['is_accepted'].mean())
    df['roll14_yield']  = df['roll14_yield'].fillna(df['is_accepted'].mean())
    df['roll14_batch']  = df['roll14_batch'].fillna(df['batch_size'])

    print(f"[FEAT] Feature engineering complete. Shape: {df.shape}")
    return df, batch_daily


# =============================================================================
# STEP 3 — Encode Categorical Variables
# =============================================================================
def encode_categoricals(df):
    print("\n[ENC] Encoding categorical columns...")

    encoders = {}
    cat_cols = ['sku', 'vendor', 'size', 'line']

    for col in cat_cols:
        le = LabelEncoder()
        df[col + '_enc'] = le.fit_transform(df[col].fillna('UNKNOWN').astype(str))
        encoders[col] = le
        print(f"  └─ {col}: {le.classes_.tolist()}")

    return df, encoders


# =============================================================================
# STEP 4A — Train Yield Forecasting Models (Ensemble)
# =============================================================================
def train_yield_models(df):
    print("\n[MODEL-YIELD] Training yield forecasting ensemble...")

    # Aggregate to daily level for yield model
    # Target = daily yield rate (0.0 to 1.0)
    daily = (
        df.groupby(['event_date', 'sku_enc', 'vendor_enc', 'size_enc', 'line_enc',
                    'day_of_week', 'week_of_year', 'month', 'day_of_month',
                    'roll7_yield', 'roll14_yield', 'roll14_batch'])
        .agg(
            total_units   = ('is_accepted', 'count'),
            accepted_units= ('is_accepted', 'sum')
        )
        .reset_index()
    )
    daily['yield_rate'] = daily['accepted_units'] / daily['total_units']

    FEATURE_COLS = [
        'sku_enc', 'vendor_enc', 'size_enc', 'line_enc',
        'day_of_week', 'week_of_year', 'month', 'day_of_month',
        'roll7_yield', 'roll14_yield', 'roll14_batch', 'total_units'
    ]

    X = daily[FEATURE_COLS]
    y = daily['yield_rate']

    print(f"  └─ Training on {len(X):,} daily aggregated records...")

    # --- Random Forest ---
    rf = RandomForestRegressor(
        n_estimators = config.RF_N_ESTIMATORS,
        max_depth    = config.RF_MAX_DEPTH,
        random_state = config.RF_RANDOM_STATE,
        n_jobs       = -1
    )
    rf.fit(X, y)
    rf_cv = cross_val_score(rf, X, y, cv=5, scoring='neg_mean_absolute_error')
    print(f"  └─ Random Forest | MAE (CV): {-rf_cv.mean():.4f} ± {rf_cv.std():.4f}")

    # --- XGBoost ---
    xgb_model = xgb.XGBRegressor(
        n_estimators  = config.XGB_N_ESTIMATORS,
        learning_rate = config.XGB_LEARNING_RATE,
        max_depth     = config.XGB_MAX_DEPTH,
        random_state  = config.XGB_RANDOM_STATE,
        n_jobs        = -1,
        verbosity     = 0
    )
    xgb_model.fit(X, y)
    xgb_cv = cross_val_score(xgb_model, X, y, cv=5, scoring='neg_mean_absolute_error')
    print(f"  └─ XGBoost       | MAE (CV): {-xgb_cv.mean():.4f} ± {xgb_cv.std():.4f}")

    print(f"  └─ Ensemble weights: RF={config.RF_WEIGHT} | XGB={config.XGB_WEIGHT}")

    return rf, xgb_model, FEATURE_COLS, daily


# =============================================================================
# STEP 4B — Train Rejection Reason Classifier
# =============================================================================
def train_rejection_classifier(df):
    print("\n[MODEL-REJECTION] Training rejection reason classifier...")

    # Only rows with a rejection reason at any stage
    # Build a unified "rejection_reason" column from whichever stage rejected
    rej = df[df['is_rejected'] == 1].copy()

    def get_primary_reason(row):
        if pd.notna(row['vqc_reason']) and str(row['vqc_status']).upper() in config.VQC_REJECTED_STATUSES:
            return str(row['vqc_reason']).strip()
        if pd.notna(row['ft_reason']) and str(row['ft_status']).upper() in config.FT_REJECTED_STATUSES:
            return str(row['ft_reason']).strip()
        if pd.notna(row['cs_reason']) and str(row['cs_status']).upper() in config.CS_REJECTED_STATUSES:
            return str(row['cs_reason']).strip()
        return 'UNKNOWN'

    rej['primary_reason'] = rej.apply(get_primary_reason, axis=1)

    # Drop rare reasons (< 5 occurrences) — too sparse to learn from
    reason_counts = rej['primary_reason'].value_counts()
    valid_reasons = reason_counts[reason_counts >= 5].index
    rej = rej[rej['primary_reason'].isin(valid_reasons)]

    if len(rej) < 50:
        print("  └─ Not enough rejection data to train classifier. Skipping.")
        return None, None, None

    FEATURE_COLS_CLF = [
        'sku_enc', 'vendor_enc', 'size_enc', 'line_enc',
        'day_of_week', 'month', 'roll14_yield'
    ]

    X_clf = rej[FEATURE_COLS_CLF]
    y_clf = rej['primary_reason']

    le_reason = LabelEncoder()
    y_enc = le_reason.fit_transform(y_clf)

    clf = RandomForestClassifier(
        n_estimators = config.RF_N_ESTIMATORS,
        max_depth    = config.RF_MAX_DEPTH,
        random_state = config.RF_RANDOM_STATE,
        n_jobs       = -1
    )
    clf.fit(X_clf, y_enc)

    clf_cv = cross_val_score(clf, X_clf, y_enc, cv=5, scoring='accuracy')
    print(f"  └─ Classifier Accuracy (CV): {clf_cv.mean():.2%} ± {clf_cv.std():.2%}")
    print(f"  └─ Rejection reason classes: {len(le_reason.classes_)}")

    return clf, le_reason, FEATURE_COLS_CLF


# =============================================================================
# STEP 5 — Build Forecast Rows for Next 7 Days
# =============================================================================
def build_forecast(df, batch_daily, rf, xgb_model, clf, le_reason,
                   yield_features, clf_features, encoders):
    print(f"\n[FORECAST] Generating {config.FORECAST_DAYS}-day forecast...")

    # 1. Filter combos: Suppress rare/inactive SKUs
    # Calculate total frequency per combo
    freq = (
        df.groupby(['sku', 'vendor', 'size', 'line'])
        .size()
        .reset_index(name='total_freq')
    )
    
    # Calculate recency per combo (last seen date)
    recency = (
        df.groupby(['sku', 'vendor', 'size', 'line'])['event_date']
        .max()
        .reset_index(name='last_seen')
    )
    
    # Get all unique SKU+Vendor+Size+Line combos seen in training data
    combos = (
        df[['sku', 'vendor', 'size', 'line',
            'sku_enc', 'vendor_enc', 'size_enc', 'line_enc']]
        .drop_duplicates()
        .reset_index(drop=True)
    )
    
    combos = combos.merge(freq, on=['sku', 'vendor', 'size', 'line'], how='left')
    combos = combos.merge(recency, on=['sku', 'vendor', 'size', 'line'], how='left')
    
    total_found = len(combos)
    
    # Apply Suppression:
    # - Must have appeared in the last N days
    # - Must have a minimum total frequency
    cutoff_date = pd.to_datetime(config.TRAIN_END_DATE) - timedelta(days=config.SUPPRESS_RARE_THRESHOLD_DAYS)
    
    combos = combos[
        (combos['last_seen'] >= cutoff_date) & 
        (combos['total_freq'] >= config.MIN_FREQUENCY_TOTAL)
    ].reset_index(drop=True)
    
    print(f"  └─ Filtered {total_found} combos down to {len(combos)} active combinations.")
    print(f"  └─ (Thresholds: Recency >= {config.SUPPRESS_RARE_THRESHOLD_DAYS}d, Freq >= {config.MIN_FREQUENCY_TOTAL})")

    # Latest rolling stats per SKU+Vendor (from the last day in training data)
    latest_stats = (
        df.groupby(['sku', 'vendor'])
        .apply(lambda g: g.sort_values('event_date').iloc[-1])
        .reset_index(drop=True)
        [['sku', 'vendor', 'roll7_yield', 'roll14_yield', 'roll14_batch']]
    )

    # Estimate batch qty per SKU+Vendor: rolling 14-day average
    last_14 = batch_daily[
        batch_daily['event_date'] >= (
            pd.to_datetime(config.TRAIN_END_DATE) - timedelta(days=14)
        )
    ]
    avg_batch = (
        last_14.groupby(['sku', 'vendor'])['batch_size']
        .mean()
        .reset_index(name='predicted_batch_qty')
    )

    # Merge combos with stats
    combos = combos.merge(latest_stats, on=['sku', 'vendor'], how='left')
    combos = combos.merge(avg_batch, on=['sku', 'vendor'], how='left')

    # Fallback fills
    combos['roll7_yield']         = combos['roll7_yield'].fillna(df['is_accepted'].mean())
    combos['roll14_yield']        = combos['roll14_yield'].fillna(df['is_accepted'].mean())
    combos['roll14_batch']        = combos['roll14_batch'].fillna(df['batch_size'].mean())
    combos['predicted_batch_qty'] = combos['predicted_batch_qty'].fillna(combos['roll14_batch'])

    forecast_rows = []
    base_date = pd.to_datetime(config.TRAIN_END_DATE) + timedelta(days=1)

    for day_offset in range(config.FORECAST_DAYS):
        forecast_date = base_date + timedelta(days=day_offset)
        dow  = forecast_date.dayofweek
        week = forecast_date.isocalendar()[1]
        mon  = forecast_date.month
        dom  = forecast_date.day

        for _, combo in combos.iterrows():
            feat_yield = pd.DataFrame([{
                'sku_enc'       : combo['sku_enc'],
                'vendor_enc'    : combo['vendor_enc'],
                'size_enc'      : combo['size_enc'],
                'line_enc'      : combo['line_enc'],
                'day_of_week'   : dow,
                'week_of_year'  : week,
                'month'         : mon,
                'day_of_month'  : dom,
                'roll7_yield'   : combo['roll7_yield'],
                'roll14_yield'  : combo['roll14_yield'],
                'roll14_batch'  : combo['roll14_batch'],
                'total_units'   : combo['predicted_batch_qty']
            }])

            # Ensemble yield prediction
            rf_pred  = rf.predict(feat_yield)[0]
            xgb_pred = xgb_model.predict(feat_yield)[0]
            ensemble_yield = (
                config.RF_WEIGHT * rf_pred +
                config.XGB_WEIGHT * xgb_pred
            )
            # Clamp to [0, 1]
            ensemble_yield = float(np.clip(ensemble_yield, 0.0, 1.0))
            predicted_good_units = round(ensemble_yield * combo['predicted_batch_qty'])

            # Confidence: how close are RF and XGB? Closer = more confident
            model_agreement = 1.0 - abs(rf_pred - xgb_pred)
            confidence = round(float(np.clip(model_agreement, 0.0, 1.0)), 4)

            # Rejection reason prediction
            top_reasons = [{
                "reason": "N/A", "probability": 0.0
            }] * config.TOP_N_REJECTION_REASONS

            if clf is not None:
                feat_clf = pd.DataFrame([{
                    'sku_enc'     : combo['sku_enc'],
                    'vendor_enc'  : combo['vendor_enc'],
                    'size_enc'    : combo['size_enc'],
                    'line_enc'    : combo['line_enc'],
                    'day_of_week' : dow,
                    'month'       : mon,
                    'roll14_yield': combo['roll14_yield']
                }])
                proba = clf.predict_proba(feat_clf)[0]
                top_idx = np.argsort(proba)[::-1][:config.TOP_N_REJECTION_REASONS]
                top_reasons = [
                    {"reason": le_reason.classes_[i], "probability": round(float(proba[i]), 4)}
                    for i in top_idx
                ]
                # Pad if fewer reasons than TOP_N
                while len(top_reasons) < config.TOP_N_REJECTION_REASONS:
                    top_reasons.append({"reason": "N/A", "probability": 0.0})

            row = {
                "forecast_date"          : forecast_date.date(),
                "sku"                    : combo['sku'],
                "vendor"                 : combo['vendor'],
                "size"                   : combo['size'],
                "line"                   : combo['line'],
                "predicted_batch_qty"    : int(round(combo['predicted_batch_qty'])),
                "forecasted_yield_rate"  : round(ensemble_yield, 4),
                "forecasted_good_units"  : int(predicted_good_units),
                "rf_yield_prediction"    : round(float(np.clip(rf_pred, 0, 1)), 4),
                "xgb_yield_prediction"   : round(float(np.clip(xgb_pred, 0, 1)), 4),
                "model_confidence"       : confidence,
                "top_rejection_reason_1" : top_reasons[0]["reason"],
                "rejection_prob_1"       : top_reasons[0]["probability"],
                "top_rejection_reason_2" : top_reasons[1]["reason"],
                "rejection_prob_2"       : top_reasons[1]["probability"],
                "top_rejection_reason_3" : top_reasons[2]["reason"],
                "rejection_prob_3"       : top_reasons[2]["probability"],
                "generated_at"           : datetime.utcnow()
            }
            forecast_rows.append(row)

    forecast_df = pd.DataFrame(forecast_rows)
    print(f"  └─ Generated {len(forecast_df):,} forecast rows "
          f"({config.FORECAST_DAYS} days × {len(combos)} combos).")
    return forecast_df


# =============================================================================
# STEP 6 — Write Forecast to BigQuery
# =============================================================================
def write_to_bigquery(client, forecast_df):
    print(f"\n[BQ] Writing forecast to `{config.TABLE_FORECAST}`...")

    schema = [
        bigquery.SchemaField("forecast_date",          "DATE"),
        bigquery.SchemaField("sku",                    "STRING"),
        bigquery.SchemaField("vendor",                 "STRING"),
        bigquery.SchemaField("size",                   "STRING"),
        bigquery.SchemaField("line",                   "STRING"),
        bigquery.SchemaField("predicted_batch_qty",    "INTEGER"),
        bigquery.SchemaField("forecasted_yield_rate",  "FLOAT"),
        bigquery.SchemaField("forecasted_good_units",  "INTEGER"),
        bigquery.SchemaField("rf_yield_prediction",    "FLOAT"),
        bigquery.SchemaField("xgb_yield_prediction",   "FLOAT"),
        bigquery.SchemaField("model_confidence",       "FLOAT"),
        bigquery.SchemaField("top_rejection_reason_1", "STRING"),
        bigquery.SchemaField("rejection_prob_1",       "FLOAT"),
        bigquery.SchemaField("top_rejection_reason_2", "STRING"),
        bigquery.SchemaField("rejection_prob_2",       "FLOAT"),
        bigquery.SchemaField("top_rejection_reason_3", "STRING"),
        bigquery.SchemaField("rejection_prob_3",       "FLOAT"),
        bigquery.SchemaField("generated_at",           "DATETIME"),
    ]

    job_config = bigquery.LoadJobConfig(
        schema          = schema,
        write_disposition = bigquery.WriteDisposition.WRITE_TRUNCATE,  # Full refresh each run
    )

    job = client.load_table_from_dataframe(
        forecast_df,
        config.TABLE_FORECAST,
        job_config=job_config
    )
    job.result()  # Wait for job to finish
    print(f"  └─ Successfully written {len(forecast_df):,} rows to BigQuery.")


# =============================================================================
# STEP 7 — Create BigQuery View for Dashboard
# =============================================================================
def create_dashboard_view(client):
    view_id = f"{config.BQ_PROJECT_ID}.{config.BQ_DATASET}.forecast_7day_view"
    print(f"\n[VIEW] Creating/replacing BigQuery view `{view_id}`...")

    view_query = f"""
        SELECT
            forecast_date,
            sku,
            vendor,
            size,
            line,
            predicted_batch_qty,
            ROUND(forecasted_yield_rate * 100, 2)   AS forecasted_yield_pct,
            forecasted_good_units,
            predicted_batch_qty - forecasted_good_units AS forecasted_rejection_units,
            ROUND(rf_yield_prediction * 100, 2)     AS rf_yield_pct,
            ROUND(xgb_yield_prediction * 100, 2)    AS xgb_yield_pct,
            ROUND(model_confidence * 100, 2)        AS model_confidence_pct,
            top_rejection_reason_1,
            ROUND(rejection_prob_1 * 100, 2)        AS rejection_prob_1_pct,
            top_rejection_reason_2,
            ROUND(rejection_prob_2 * 100, 2)        AS rejection_prob_2_pct,
            top_rejection_reason_3,
            ROUND(rejection_prob_3 * 100, 2)        AS rejection_prob_3_pct,
            generated_at
        FROM `{config.TABLE_FORECAST}`
        ORDER BY forecast_date, sku, vendor
    """

    view = bigquery.Table(view_id)
    view.view_query = view_query

    try:
        client.delete_table(view_id, not_found_ok=True)
        client.create_table(view)
        print(f"  └─ View created. Connect your dashboard to: `{view_id}`")
    except Exception as e:
        print(f"  └─ View creation failed: {e}")


# =============================================================================
# MAIN — Orchestrator
# =============================================================================
def main():
    print("=" * 65)
    print("  PRODUCTION FORECAST PIPELINE")
    print(f"  Training window : {config.TRAIN_START_DATE} → {config.TRAIN_END_DATE}")
    print(f"  Forecast horizon: Next {config.FORECAST_DAYS} days")
    print("=" * 65)

    start_time = datetime.now()

    # 0. Connect
    client = get_bq_client()

    # 1. Load
    df_raw = load_data(client)

    # 2. Feature engineering
    df, batch_daily = engineer_features(df_raw)

    # 3. Encode
    df, encoders = encode_categoricals(df)

    # 4a. Train yield ensemble
    rf, xgb_model, yield_features, daily_agg = train_yield_models(df)

    # 4b. Train rejection classifier
    clf, le_reason, clf_features = train_rejection_classifier(df)

    # 5. Build 7-day forecast
    forecast_df = build_forecast(
        df, batch_daily,
        rf, xgb_model,
        clf, le_reason,
        yield_features, clf_features,
        encoders
    )

    # 6. Write to BigQuery
    write_to_bigquery(client, forecast_df)

    # 7. Create/replace dashboard view
    create_dashboard_view(client)

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"\n{'=' * 65}")
    print(f"  Pipeline complete in {elapsed:.1f}s")
    print(f"  Dashboard view ready: {config.BQ_PROJECT_ID}.{config.BQ_DATASET}.forecast_7day_view")
    print("=" * 65)


if __name__ == "__main__":
    main()