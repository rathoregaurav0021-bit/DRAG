import os
import osmnx as ox
import geopandas as gpd
import requests
import json
from config import BHURAGAON_BOUNDS

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

def setup_directories():
    os.makedirs(RAW_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DIR, exist_ok=True)

def fetch_osm_data():
    print("Fetching OSM Data (Roads & Shelters)...")
    # ox.graph_from_bbox uses (north, south, east, west)
    bbox = (
        BHURAGAON_BOUNDS["max_lat"], 
        BHURAGAON_BOUNDS["min_lat"],
        BHURAGAON_BOUNDS["max_lon"], 
        BHURAGAON_BOUNDS["min_lon"]
    )
    
    try:
        # 1. Download Road Network
        print(" -> Downloading Road Network...")
        G = ox.graph_from_bbox(*bbox, network_type="drive")
        nodes, edges = ox.graph_to_gdfs(G)
        edges.to_file(os.path.join(RAW_DIR, "roads.geojson"), driver="GeoJSON")
    except Exception as e:
        print(f" -> Error fetching roads: {e}")

    try:
        # 2. Download Buildings (Potential Shelters)
        print(" -> Downloading Building Footprints (Hospitals, Schools)...")
        tags = {"building": True, "amenity": ["hospital", "school", "clinic"]}
        buildings = ox.features_from_bbox(*bbox, tags=tags)
        buildings.to_file(os.path.join(RAW_DIR, "shelters.geojson"), driver="GeoJSON")
    except Exception as e:
        print(f" -> Error fetching buildings: {e}")
    
    print("OSM Data Fetch Complete.")

def fetch_weather_data():
    print("Fetching Open-Meteo Precipitation Forecast...")
    lat = (BHURAGAON_BOUNDS["min_lat"] + BHURAGAON_BOUNDS["max_lat"]) / 2
    lon = (BHURAGAON_BOUNDS["min_lon"] + BHURAGAON_BOUNDS["max_lon"]) / 2
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=precipitation"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        with open(os.path.join(RAW_DIR, "forecast.json"), "w") as f:
            json.dump(data, f, indent=4)
        print("Weather Data Fetch Complete.")
    except Exception as e:
        print(f" -> Error fetching weather: {e}")

if __name__ == "__main__":
    setup_directories()
    fetch_osm_data()
    fetch_weather_data()
    print(f"All data successfully saved to: {RAW_DIR}")
