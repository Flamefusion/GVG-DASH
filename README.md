# Ultrahuman FQC Dashboard

## Description

This project is a comprehensive, multi-page dashboard for monitoring and analyzing the Final Quality Control (FQC) process at Ultrahuman. It provides a real-time overview of key performance indicators (KPIs), work-in-progress (WIP) tracking, rejection analysis, and detailed reporting functionalities. The dashboard is designed to be intuitive, visually appealing, and highly interactive, with features like dark mode, responsive design, and detailed data modals.

## Pages

The dashboard is organized into four main pages:

*   **Home**: Provides a high-level overview of the FQC process, including key performance indicators (KPIs) and work-in-progress (WIP) tracking across different stages.
*   **Analysis**: A dedicated page for in-depth rejection analysis. It features a variety of charts to visualize rejection data from different perspectives, such as by status, vendor, and rejection reason.
*   **Report**: A page for generating and exporting reports. It provides a summary of key metrics and a detailed breakdown of rejections by category, with automated rejection trend analysis.
*   **Search**: A powerful advanced search page for deep-diving into production data. It allows bulk searching by serial numbers or MO numbers and provides detailed record-level visibility.

## Features

*   **Advanced Filtering**: The dashboard features a powerful filtering system that allows users to slice and dice the data. The key filters are:
    *   **Stage**: Determines the data source and date field used for filtering. The available stages are:
        *   **VQC (Default)**: Uses `vqc inward date` and queries the `master_station_data` table.
        *   **FT**: Uses `ft inward date` and queries the `master_station_data` table.
        *   **CS**: Uses `cs complete date` and queries the `master_station_data` table.
        *   **RT**: Uses `vqc inward date` and queries the `rt_conversion_data` table.
        *   **RT CS**: Uses `cs_comp_date` and queries the `rt_conversion_data` table.
        *   **WABI SABI**: Uses `inward_date` and queries the `wabi_sabi_data` table.
    *   **Date Range**: Allows users to select a custom date range.
    *   **Size**: Multi-select filter for sizes.
    *   **SKU**: Multi-select filter for SKUs.
*   **Bulk Search**: On the Search page, users can input multiple serial numbers or MO numbers separated by commas or newlines for bulk lookup.
*   **Interactive Charts**: The dashboard uses a variety of interactive charts (bar, line, pie, doughnut) including vendor-wise rejection percentages and top rejection reasons.
*   **Data Export**: Users can export the data from KPI cards, the Report page, and Search results as CSV files.
*   **Fullscreen Mode**: For an immersive, distraction-free experience.
*   **Dark Mode**: A refined dark mode for comfortable viewing in low-light environments.
*   **Admin System**: Optional admin system for extra access and management within the dashboard.
*   **Last Data Sync Timestamp**: Shows the freshness of the data.

## Tech Stack

The dashboard is built with a modern and robust tech stack, ensuring a high-performance and scalable application.

### Frontend

*   **Framework:** React with Vite for a fast and efficient development experience.
*   **Language:** TypeScript for type safety and improved code quality.
*   **UI Components:** A custom component library built with `shadcn/ui`, which leverages Radix UI for accessibility and Tailwind CSS for styling.
*   **Routing:** `react-router-dom` is used for client-side routing, enabling navigation between Home, Analysis, Report, and Search pages.
*   **State Management:** Managed globally using React's Context API (`DashboardContext.tsx`).
*   **Charting Library:** `recharts` for interactive data visualization.
*   **Styling:** Tailwind CSS with support for dynamic Dark Mode.
*   **Animation:** `framer-motion` (or `motion/react`) for smooth transitions.

### Backend & Infrastructure

*   **Data Warehouse:** **Google BigQuery** storing all FQC production data.
*   **Backend Language:** **Python** with **FastAPI** for a high-performance, asynchronous API.
*   **Hosting:** Deployed as a **Docker container** on **Google Cloud Run** for serverless scaling.
*   **API Endpoints:**
    *   `/kpis`: Fetches Key Performance Indicators.
    *   `/charts`: Fetches data for WIP charts and trends.
    *   `/skus`, `/sizes`, `/vendors`: Fetches available filter options.
    *   `/search`: Handles advanced bulk search and filtering.
    *   `/analysis`: Fetches comprehensive rejection analysis data.
    *   `/report-data`: Fetches daily report summaries.
    *   `/rejection-report-data`: Fetches automated rejection trend reports.
    *   `/kpi-data/{kpiKey}`: Fetches detailed, paginated data for KPI drill-downs.
    *   `/last-updated`: Fetches the last data sync timestamp.

### Key Calculations

This section details the logic behind how the key metrics on the dashboard are calculated.

#### Frontend Calculations

*   **Yield Calculation:** On the Report page, the "YIELD" KPI is calculated using the formula: `(Total Accepted / (Total Accepted + Total Rejected)) * 100`. This excludes work-in-progress items from the calculation.
*   **WIP Serial Number Count:** The "VQC WIP" and "FT WIP" counters on the Home page are calculated on the frontend by summing the `count` of all items in the chart data arrays received from the backend.

#### Backend BigQuery Calculations

The backend queries the BigQuery table to aggregate data for the Home page KPIs. The logic is as follows (represented as pseudo-SQL):

*   **TOTAL INWARD:** `COUNT(DISTINCT serial_number)`
*   **QC ACCEPTED:** `COUNT(DISTINCT serial_number) WHERE vqc_status = 'accepted'`
*   **TESTING ACCEPTED:** `COUNT(DISTINCT serial_number) WHERE ft_status = 'accepted'`
*   **TOTAL REJECTED:** `COUNT(DISTINCT serial_number) WHERE vqc_status = 'rejected' OR ft_status = 'rejected' OR cs_status = 'rejected'`
*   **MOVED TO INVENTORY:** `COUNT(DISTINCT serial_number) WHERE inventory_status = 'moved'`
*   **WORK IN PROGRESS:** `COUNT(DISTINCT serial_number) WHERE status IN ('VQC_WIP', 'FT_WIP')`

The `WHERE` clauses for these queries are further filtered by the date range, size, and SKU parameters sent from the frontend.

## Setup Guide

To set up and run this project locally, follow these steps:

### 1. Frontend Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    This project uses `npm`. Run the following command to install all the necessary dependencies:
    ```bash
    npm install
    ```

3.  **Run the development server:**
    To start the frontend development server, run:
    ```bash
    npm run dev
    ```
    This will start the application, and you can view it in your browser at the local address provided (usually `http://localhost:5173`).

### 2. Backend Setup (Google Cloud Run)

The frontend expects the backend to be running as a service on Google Cloud Run.

1.  **Configure Environment Variable:**
    Create a `.env.local` file in the root of the project and add the URL of your deployed Cloud Run service:
    ```
    VITE_BACKEND_API_URL=https://your-cloud-run-service-url
    ```

2.  **Build the Docker Image:**
    Navigate to the `backend` directory and build the Docker image.
    ```bash
    cd backend
    docker build -t gcr.io/your-gcp-project-id/fqc-dashboard-backend .
    ```

3.  **Push to Artifact Registry:**
    Configure Docker to use `gcloud` as a credential helper and push the image to Google Artifact Registry.
    ```bash
    gcloud auth configure-docker
    docker push gcr.io/your-gcp-project-id/fqc-dashboard-backend
    ```

4.  **Deploy to Cloud Run:**
    Deploy the container image to Cloud Run.
    ```bash
    gcloud run deploy fqc-dashboard-backend \
      --image gcr.io/your-gcp-project-id/fqc-dashboard-backend \
      --platform managed \
      --region your-gcp-region \
      --allow-unauthenticated
    ```

5.  **Service Account Permissions:**
    Ensure the service account used by your Cloud Run service has the necessary IAM roles to access BigQuery (e.g., "BigQuery Data Viewer" and "BigQuery User").

---

Designed & Created By Flamefusion ( Shekhar Behera)