from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import sys

# Add parent directory to path so we can import wflow_runner and hydraulic
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wflow_runner import calculate_runoff
from hydraulic import run_anuga_simulation

app = FastAPI(title="FloodShield API")

# Setup static files directory
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "FloodShield API is running"}

class SimulationRequest(BaseModel):
    csv_data: str
    soil_moisture: str = "Normal"

@app.post("/api/wflow/simulate")
def run_wflow_simulation(req: SimulationRequest):
    import json
    try:
        # Step 1: Wflow (Hydrology)
        results = calculate_runoff(req.csv_data, req.soil_moisture)
        
        # Step 2: ANUGA (Hydraulics)
        safe_spots = run_anuga_simulation(json.dumps(results))
        
        return {"status": "success", "data": results, "safe_spots": safe_spots}
    except Exception as e:
        return {"status": "error", "message": str(e)}
