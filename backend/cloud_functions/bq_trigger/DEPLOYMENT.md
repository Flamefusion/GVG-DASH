# Deployment Instructions for BigQuery Trigger Cloud Function

Follow these steps to deploy the Cloud Function that automatically updates your summary tables.

## Prerequisites
1. Ensure the Pub/Sub topic `bq-master-table-updates` exists.
2. Ensure the Cloud Logging Sink is configured to send logs to that topic.

## Deployment Command

Run the following command from the `backend/cloud_functions/bq_trigger` directory:

```powershell
gcloud functions deploy bq-trigger-handler `
  --runtime python311 `
  --trigger-topic bq-master-table-updates `
  --entry-point bq_trigger_handler `
  --region us-central1
```

## Troubleshooting
- If you get a permission error, ensure your gcloud account has the `Cloud Functions Developer` and `Pub/Sub Publisher` roles.
- Ensure you have the BigQuery Admin role assigned to the Cloud Function's service account so it can create/replace tables.
