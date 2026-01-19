# GVG Dashboard Backend

This directory contains the Python backend for the GVG Dashboard. It's a FastAPI application designed to be deployed as a serverless container on Google Cloud Run. It fetches data from a BigQuery table, performs calculations, and exposes a set of API endpoints for the frontend dashboard.

## Project Structure

- `main.py`: The main FastAPI application file. It contains all the API logic, including KPI and chart data calculations.
- `requirements.txt`: A list of all Python dependencies required for the project.
- `Dockerfile`: Instructions for building the application into a Docker container, ready for deployment on Google Cloud Run.
- `.dockerignore`: Specifies files to exclude from the Docker build to keep the image lightweight.

---

## Local Development

To run the backend server on your local machine for development and testing, follow these steps.

### Prerequisites

1.  **Python 3.9 or higher:** Make sure you have Python installed.
2.  **Google Cloud SDK:** Install the `gcloud` command-line tool. [Installation Guide](https://cloud.google.com/sdk/docs/install)
3.  **Docker:** Docker is needed if you want to build and run the container locally. [Install Docker](https://docs.docker.com/get-docker/)

### Setup & Running

1.  **Authenticate with Google Cloud:**
    Before running the application, you need to authenticate your local environment to access Google Cloud services like BigQuery. Run the following command and follow the instructions in your browser:
    ```sh
    gcloud auth application-default login
    ```
    This command grants your local application the necessary permissions to interact with your Google Cloud project.

2.  **Create a Virtual Environment (Recommended):**
    Navigate to the `backend` directory and create a virtual environment to manage dependencies.
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install Dependencies:**
    Install all the required Python packages.
    ```sh
    pip install -r requirements.txt
    ```

4.  **Run the Server:**
    Start the development server using Uvicorn. The application will be accessible at `http://127.0.0.1:8080`.
    ```sh
    uvicorn main:app --host 0.0.0.0 --port 8080 --reload
    ```

---

## Deployment to Google Cloud Run

This application is designed to be deployed as a containerized service on Google Cloud Run.

### Prerequisites

1.  **Enable APIs:** Ensure the Cloud Run, Cloud Build, and BigQuery APIs are enabled for your Google Cloud project. You can do this from the Google Cloud Console.
2.  **Set your Project ID:** Configure `gcloud` with your project ID.
    ```sh
    gcloud config set project production-dashboard-482014
    ```

### Deployment Steps

1.  **Deploy to Cloud Run:**
    Navigate to the `backend` directory in your terminal. Run the following `gcloud` command to build your container image using Cloud Build and deploy it to Cloud Run.

    Replace `gvg-dashboard-backend` with your desired service name and `us-central1` with your preferred region.

    ```sh
    gcloud run deploy gvg-dashboard-backend \
      --source . \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated
    ```
    - `--source .`: Tells Cloud Build to use the current directory.
    - `--platform managed`: Specifies the fully managed Cloud Run environment.
    - `--allow-unauthenticated`: Makes the service publicly accessible. This is necessary for your Vercel frontend to call the API.

2.  **Get the Service URL:**
    After a successful deployment, `gcloud` will output the URL for your new service. This is the URL you will use as the API endpoint in your frontend application.

    You can also find the URL in the Google Cloud Console under the Cloud Run section.
