import rasterio
import numpy as np
from PIL import Image
import os

lulc_path = r"C:\Users\Lenovo\Documents\2nd year\projects\DRAG\frontend\public\data\lulc_v2.tif"
out_png = r"C:\Users\Lenovo\Documents\2nd year\projects\DRAG\frontend\public\data\lulc_color.png"

print("Converting GeoTIFF to colored PNG...")
with rasterio.open(lulc_path) as src:
    data = src.read(1)
    
    # Create an empty RGBA array
    h, w = data.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    
    # ESA WorldCover Mapping
    rgba[data == 10] = [0, 100, 0, 200]    # Trees (Green, slightly transparent)
    rgba[data == 40] = [255, 255, 0, 150]  # Cropland (Yellow)
    rgba[data == 50] = [255, 0, 0, 200]    # Built-up (Red)
    rgba[data == 80] = [0, 0, 255, 200]    # Water (Blue)
    
    # Save as PNG
    img = Image.fromarray(rgba, 'RGBA')
    img.save(out_png)
    
    bounds = src.bounds
    print(f"Bounds for Leaflet: [[{bounds.bottom}, {bounds.left}], [{bounds.top}, {bounds.right}]]")
    print(f"Saved optimized PNG to: {out_png}")
