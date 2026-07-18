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
