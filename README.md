# FloodShield

FloodShield is an end-to-end AI-Powered Flood Decision Intelligence System designed to transform weather forecasts into actionable evacuation plans. It goes beyond traditional flood warnings by predicting inundation, identifying safe shelters, computing safe evacuation routes, and delivering personalized recommendations.

## Study Area
Bhuragaon, Morigaon District, Assam

## Prerequisites
- Docker (for PostGIS)
- Python 3.9+

## Setup Instructions

1. **Environment Variables**:
   Copy the example environment file and configure it with your settings:
   ```bash
   cp .env.example .env
   ```

2. **Database (PostGIS)**:
   Start the PostGIS database using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. **Python Environment**:
   Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Ensure you have `wflow` and `anuga` appropriately configured in your environment if not installed via pip.*

4. **Run the Server**:
   Start the FastAPI backend:
   ```bash
   uvicorn src.main:app --reload
   ```

5. **Dashboard**:
   Open your browser and navigate to `http://localhost:8000` to view the FloodShield dashboard.

## Architecture
- **Hydrology**: `wflow`
- **Hydraulic**: ANUGA
- **Database**: PostgreSQL + PostGIS
- **AI Recommendation**: OpenAI / Local LLM
- **Routing**: NetworkX over OSM data
- **Web Dashboard**: FastAPI, Leaflet, TailwindCSS
