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

class SmsRequest(BaseModel):
    phone_number: str
    message: str

@app.post("/api/sms")
def send_sms(req: SmsRequest):
    print(f"""--- SMS DISPATCHED ---
To: {req.phone_number}
Message: {req.message}
----------------------""")
    return {"status": "success", "message": "SMS dispatched to carrier network."}

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
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:0.5b")
    
    messages = []
    
    # Define the persona
    system_prompt = "You are an Emergency Response Coordinator. Your job is to draft concise, urgent, and clear SMS evacuation alerts."
    messages.append({"role": "system", "content": system_prompt})
    
    if req.is_initial:
        dest_name = req.context.get("destinationName", "Safe Zone") if req.context else "Safe Zone"
        first_prompt = f"Draft an urgent SMS alerting the user to evacuate immediately to {dest_name} due to rising flood waters. Keep it under 160 characters. Do not include hashtags or pleasantries."
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
