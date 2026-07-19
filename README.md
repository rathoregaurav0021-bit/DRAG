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
- PostgreSQL 16+ (installed natively)
- PostGIS Extension (installed via PostgreSQL Stack Builder -> Spatial Extensions)
- QGIS & ANUGA Viewer Plugin (to view simulation results)

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
   *Note for Windows users: If you run into a `WinError 2` file not found error, run `python -m venv venv` (without the dot).*

3. Activate the virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   * **Linux / macOS:**
     ```bash
     source venv/bin/activate
     ```

4. Install the standard dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Install ANUGA (Hydraulic Simulation Engine):
   ANUGA is a heavy scientific module written in Python and C that requires C-compilation. Choose the method for your operating system:

   * **Windows (Highly Recommended to use Conda)**
     Natively compiling C-extensions on Windows via pip requires the heavy Microsoft C++ Build Tools. It is highly recommended to use Conda to get the pre-compiled binaries instead:
     ```bash
     conda install -c conda-forge anuga
     ```

   * **Linux / Ubuntu (via Pip)**
     To install ANUGA natively on Linux, you must first install the system-level C compilers and Python development headers so `pip` can compile the physics engine from source:
     ```bash
     sudo apt-get update
     sudo apt-get install build-essential python3-dev
     pip install anuga
     ```

   * **macOS (via Pip)**
     Ensure you have the Xcode Command Line Tools installed (`xcode-select --install`), then run:
     ```bash
     pip install anuga
     ```

6. Install Wflow.jl (Hydrological Routing Engine):
   Wflow is a highly optimized mathematical routing engine written in Julia. To integrate it into our Python pipeline:
   * **Install Julia:** Download it from [julialang.org](https://julialang.org/downloads/) or run `winget install julia -s msstore` on Windows.
   * **Install Wflow:** Open your terminal, type `julia` to enter the Julia REPL, and run:
     ```julia
     using Pkg
     Pkg.add("Wflow")
     ```
   * **Install the Python Connector:** In your Python virtual environment, run `pip install juliacall` so our Python backend scripts can talk directly to the Wflow engine.

### Automated Pipeline Execution (Recommended)
Instead of running scripts individually, use the master automation script. This script automatically:
1. Initializes the PostGIS database.
2. Fetches OpenStreetMap road networks, shelters, and Open-Meteo weather data.
3. Executes the ANUGA hydraulic simulation.

* **Windows (PowerShell):**
  ```powershell
  .\run_pipeline.ps1
  ```
* **Linux / macOS:**
  ```bash
  chmod +x run_pipeline.sh
  ./run_pipeline.sh
  ```

*Note: Raw data is saved to `backend/data/raw/` and simulation `.sww` files are saved to `backend/data/processed/`.*

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
