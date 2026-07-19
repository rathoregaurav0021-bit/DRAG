import rasterio
from rasterio.mask import mask
from shapely.geometry import box
import os

input_file = r"C:\Users\Lenovo\Documents\2nd year\data\ESA_WorldCover_10m_2021_v200_N24E090_Map.tif"
output_dir = r"C:\Users\Lenovo\Documents\2nd year\projects\DRAG\frontend\public\data"
os.makedirs(output_dir, exist_ok=True)
output_file = os.path.join(output_dir, "lulc.tif")

# Bhuragaon Bounds from config.py
min_lon, min_lat, max_lon, max_lat = 92.15, 26.21, 92.30, 26.31
bbox = box(min_lon, min_lat, max_lon, max_lat)

print(f"Cropping {input_file}...")
try:
    with rasterio.open(input_file) as src:
        # WorldCover is EPSG:4326, which matches our bbox coordinates perfectly
        geo_json = [bbox.__geo_interface__]
        out_image, out_transform = mask(src, geo_json, crop=True)
        out_meta = src.meta.copy()

        out_meta.update({
            "driver": "GTiff",
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })

        with rasterio.open(output_file, "w", **out_meta) as dest:
            dest.write(out_image)
    print("Cropped successfully to:", output_file)
    
    # Check the size of the output file
    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    print(f"New optimized size: {size_mb:.2f} MB")
except Exception as e:
    print("Error:", e)
