import rasterio
from rasterio.mask import mask
from shapely.geometry import box
import os

input_lulc = r"C:\Users\Lenovo\Documents\2nd year\data\ESA_WorldCover_10m_2021_v200_N24E090_Map.tif"
input_dem = r"C:\Users\Lenovo\Documents\2nd year\projects\DRAG\frontend\public\data\dem.tif"
output_lulc = r"C:\Users\Lenovo\Documents\2nd year\projects\DRAG\frontend\public\data\lulc.tif"

print("Reading DEM bounds...")
with rasterio.open(input_dem) as dem:
    bounds = dem.bounds
    minx, miny, maxx, maxy = bounds.left, bounds.bottom, bounds.right, bounds.top
    print(f"DEM Bounding Box: {minx}, {miny}, {maxx}, {maxy}")
    
    # Expand the bounding box slightly as requested to make it larger
    buffer = 0.02 # Roughly 2km buffer in all directions
    minx -= buffer
    miny -= buffer
    maxx += buffer
    maxy += buffer

bbox = box(minx, miny, maxx, maxy)
print(f"Target Expanded Bounding Box: {minx}, {miny}, {maxx}, {maxy}")

print(f"Cropping LULC to match DEM...")
try:
    with rasterio.open(input_lulc) as src:
        geo_json = [bbox.__geo_interface__]
        out_image, out_transform = mask(src, geo_json, crop=True)
        out_meta = src.meta.copy()

        out_meta.update({
            "driver": "GTiff",
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })

        with rasterio.open(output_lulc, "w", **out_meta) as dest:
            dest.write(out_image)
    print("Cropped successfully to:", output_lulc)
except Exception as e:
    print("Error:", e)
