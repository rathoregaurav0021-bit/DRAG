# FloodShield 🌊

FloodShield is an AI-Powered Flood Decision Intelligence System. It features an automated data pipeline, an ANUGA hydraulic flood simulation engine, and a premium interactive Next.js web dashboard.

This repository is split into two components:
1. `backend/`: Python-based data automation, hydraulic simulation, and FastAPI server.
2. `frontend/`: Next.js (React) premium UI for the flood dashboard.

---

## 🏗️ Backend Setup

The backend handles the heavy lifting, including data fetching (OpenStreetMap, Weather) and running the flood propagation simulations.

### Prerequisites
- Python 3.9+
- Docker (optional, for PostGIS)
- QGIS & ANUGA Viewer Plugin (to view simulation results)

### Installation
```bash
cd backend
pip install -r requirements.txt
```

### Running the Data Pipeline
Automate the downloading of road networks, shelters, and precipitation forecasts for the Bhuragaon region:
```bash
python src/data_pipeline.py
```
*Data is saved to `backend/data/raw/`.*

### Running the ANUGA Simulation
Generate the computational mesh and run the shallow water flood wave simulation:
```bash
python src/hydraulic.py
```
*Simulation results are saved as `.sww` files in `backend/data/processed/`.*

### Running the FastAPI Server
To serve the API for the frontend dashboard:
```bash
uvicorn src.main:app --reload
```
The backend API will run on `http://localhost:8000`.

---

## 💻 Frontend Setup

The frontend provides a premium, interactive web interface built with Next.js, TailwindCSS, and Leaflet.

### Prerequisites
- Node.js & npm

### Installation
```bash
cd frontend
npm install
```

### Running the Dashboard
Start the development server:
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

> **Note:** The frontend automatically proxies API calls to the Python backend on port 8000. Make sure the backend server (`uvicorn`) is running simultaneously!
