import json
from shapely.geometry import shape
from pyproj import Transformer

def calculate_area_and_add_to_properties(geojson_data):
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:32632", always_xy=True)

    for feature in geojson_data["features"]:
        geometry = feature["geometry"]
        if geometry["type"] == "Polygon":
            polygon = shape(geometry)
            projected_polygon = shape({
                "type": "Polygon",
                "coordinates": [
                    [transformer.transform(*coord) for coord in ring] for ring in geometry["coordinates"]
                ]
            })

            area = projected_polygon.area  # Fläche in Quadratmetern
            feature["properties"]["area_sqm"] = area

    return geojson_data

with open("bw-geodata.geojson", "r") as infile:
    geojson_data = json.load(infile)

updated_geojson = calculate_area_and_add_to_properties(geojson_data)

with open("bw-geodata.geojson", "w") as outfile:
    json.dump(updated_geojson, outfile, indent=2)

print("Die Flächen wurden berechnet und hinzugefügt.")
