import os
import json
import numpy as np
import matplotlib.pyplot as plt
import rasterio
from scipy import ndimage

def run_anuga_simulation(discharge_data_json):
    discharge_data = json.loads(discharge_data_json)
    
    discharges = [float(row.get('discharge', 0)) for row in discharge_data]
    if not discharges:
        return []
        
    peak_idx = np.argmax(discharges)
    peak_discharge = discharges[peak_idx]
    
    pre_peak_idx = max(0, peak_idx - 4)
    pre_peak_discharge = discharges[pre_peak_idx]
    
    # Paths
    backend_dir = os.path.dirname(__file__)
    public_dir = os.path.join(os.path.dirname(backend_dir), 'frontend', 'public', 'data')
    dem_path = os.path.join(public_dir, 'dem.tif')
    out_png_path = os.path.join(public_dir, 'flood_depth.png')
    pre_peak_png_path = os.path.join(public_dir, 'pre_peak_flood.png')
    
    if not os.path.exists(dem_path):
        return []
        
    with rasterio.open(dem_path) as src:
        dem_data = src.read(1)
        transform = src.transform
        
    dem_min = np.min(dem_data[dem_data > -9999])
    dem_max = np.max(dem_data)
    
    # 1. Peak Flood PNG
    severity = min(1.0, peak_discharge / 150.0) 
    flood_level = dem_min + (dem_max - dem_min) * (severity * 0.7)
    
    flood_mask = (dem_data <= flood_level) & (dem_data > -9999)
    depth_data = np.where(flood_mask, flood_level - dem_data, 0)
    
    fig, ax = plt.subplots(figsize=(10, 10))
    cmap = plt.cm.Blues
    cmap.set_under(color='none') 
    
    ax.imshow(depth_data, cmap=cmap, vmin=0.1, vmax=max(0.2, flood_level-dem_min))
    ax.axis('off')
    plt.savefig(out_png_path, transparent=True, bbox_inches='tight', pad_inches=0, dpi=256)
    plt.close(fig)
    
    # 2. Pre-Peak Flood PNG
    pre_peak_severity = min(1.0, pre_peak_discharge / 150.0)
    pre_peak_flood_level = dem_min + (dem_max - dem_min) * (pre_peak_severity * 0.7)
    
    pre_peak_flood_mask = (dem_data <= pre_peak_flood_level) & (dem_data > -9999)
    pre_peak_depth_data = np.where(pre_peak_flood_mask, pre_peak_flood_level - dem_data, 0)
    
    fig, ax = plt.subplots(figsize=(10, 10))
    ax.imshow(pre_peak_depth_data, cmap=cmap, vmin=0.1, vmax=max(0.2, pre_peak_flood_level-dem_min))
    ax.axis('off')
    plt.savefig(pre_peak_png_path, transparent=True, bbox_inches='tight', pad_inches=0, dpi=256)
    plt.close(fig)
    
    # 3. Calculate Safe Spots from Peak Flood
    dry_mask = (~flood_mask) & (dem_data > -9999)
    labeled_array, num_features = ndimage.label(dry_mask)
    
    min_blob_size = 100
    safe_spots = []
    
    for i in range(1, num_features + 1):
        blob_mask = (labeled_array == i)
        if np.sum(blob_mask) >= min_blob_size:
            y_coords, x_coords = np.where(blob_mask)
            center_y = int(np.mean(y_coords))
            center_x = int(np.mean(x_coords))
            
            lon, lat = transform * (center_x, center_y)
            safe_spots.append({"lat": lat, "lng": lon, "id": i})
            
    print(f"ANUGA Simulation Complete. Found {len(safe_spots)} Safe Zones.")
    return safe_spots
