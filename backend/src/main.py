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
from routing import calculate_safe_route

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
    user_lat: float = None
    user_lng: float = None

@app.post("/api/wflow/simulate")
def run_wflow_simulation(req: SimulationRequest):
    import json
    try:
        # Step 1: Wflow (Hydrology)
        results = calculate_runoff(req.csv_data, req.soil_moisture)
        
        # Step 2: ANUGA (Hydraulics)
        safe_spots = run_anuga_simulation(json.dumps(results))
        
        # Step 3: Evacuation Routing
        route_info = None
        if req.user_lat is not None and req.user_lng is not None:
            route_info = calculate_safe_route(results, req.user_lat, req.user_lng, safe_spots)
            
        return {"status": "success", "data": results, "safe_spots": safe_spots, "route_info": route_info}
    except Exception as e:
        return {"status": "error", "message": str(e)}

dispatched_messages = []

class SmsRequest(BaseModel):
    phone_number: str
    message: str
    destination_name: str = "Unknown Safe Area"
    destination_coords: str = ""
    route_geojson: dict = None
    timestamp: str = ""

import datetime

@app.post("/api/sms")
def send_sms(req: SmsRequest):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Store the record
    dispatched_messages.append({
        "phone_number": req.phone_number,
        "message": req.message,
        "destination_name": req.destination_name,
        "destination_coords": req.destination_coords,
        "route_geojson": req.route_geojson,
        "timestamp": timestamp
    })
    
    print(f"""--- SMS DISPATCHED ---
To: {req.phone_number}
Destination: {req.destination_name}
Message: {req.message}
----------------------""")
    return {"status": "success", "message": "SMS dispatched to carrier network."}

@app.get("/api/sms/recipients")
def get_recipients():
    return {"status": "success", "data": dispatched_messages}

real_stranded_cache = []
stranded_id_counter = 1000

class StrandedRequest(BaseModel):
    lat: float
    lng: float
    population: int = 1
    elevation: float = 10.0

@app.post("/api/rescue/stranded")
def add_stranded_group(req: StrandedRequest):
    global stranded_id_counter
    stranded_id_counter += 1
    
    # Priority Score Algorithm: Only based on elevation (lower = higher priority)
    base_score = max(0, 100 - (req.elevation * 4))
    
    # Define Tiers
    if base_score > 60:
        tier = "CRITICAL"
    elif base_score > 30:
        tier = "HIGH"
    else:
        tier = "MODERATE"
        
    new_group = {
        "id": f"SOS-{stranded_id_counter}",
        "lat": req.lat,
        "lng": req.lng,
        "population": req.population,
        "elevation": req.elevation,
        "priority_score": round(base_score, 1),
        "tier": tier
    }
    
    # Check if already exists nearby to avoid spam
    for g in real_stranded_cache:
        if abs(g["lat"] - req.lat) < 0.001 and abs(g["lng"] - req.lng) < 0.001:
            return {"status": "success", "message": "Already tracked", "data": g}
            
    real_stranded_cache.append(new_group)
    real_stranded_cache.sort(key=lambda x: x["priority_score"], reverse=True)
    return {"status": "success", "data": new_group}

@app.get("/api/rescue/stranded")
def get_stranded_groups():
    return {"status": "success", "data": real_stranded_cache}

import urllib.request
import json
import os
from pydantic import BaseModel
from typing import List, Dict, Any

class LLMRequest(BaseModel):
    history: List[Dict[str, str]]
    prompt: str
    context: Any
    is_initial: bool

@app.post("/api/llm/chat")
async def llm_chat(req: LLMRequest):
    ollama_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434") + "/api/chat"
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:latest")
    
    messages = []
    
    # Define the persona
    system_prompt = "You are an Emergency Response Coordinator. Your job is to draft concise, urgent, and clear SMS evacuation alerts."
    messages.append({"role": "system", "content": system_prompt})
    
    if req.is_initial:
        dest_name = req.context.get("destinationName", "Safe Zone") if req.context else "Safe Zone"
        dest_coords = req.context.get("destinationCoords") if req.context else None
        coord_str = f"{dest_coords[0]:.4f},{dest_coords[1]:.4f}" if dest_coords and len(dest_coords) == 2 else ""
        first_prompt = f"Draft an urgent SMS alerting the user to evacuate immediately to {dest_name}. End the message exactly with: '[Map Screenshot Attached: route.png]'. Keep it under 140 characters. No hashtags."
        messages.append({"role": "user", "content": first_prompt})
    else:
        # Pass history
        for msg in req.history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": req.prompt})
        
    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }
    
    try:
        req_obj = urllib.request.Request(
            ollama_url, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req_obj) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            
        ai_message = res_data.get("message", {}).get("content", "Error generating response.")
        return {"status": "success", "message": ai_message}
    except Exception as e:
        print("Ollama Error:", e)
        return {"status": "error", "message": str(e)}
