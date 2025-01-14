import json
from shapely.geometry import shape
from pyproj import Transformer
import os

def filter_geojson(data, key, value):

    filtered_features = [
        feature for feature in data.get('features', [])
        if feature.get('properties', {}).get(key) == value
    ]

    filtered_geojson = {
        "type": "FeatureCollection",
        "features": filtered_features
    }

    return filtered_geojson


def calculate_area_and_add_to_properties(geojson_data):
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:32632", always_xy=True)

    for feature in geojson_data["features"]:
        geometry = feature["geometry"]
        if geometry["type"] == "Polygon":
            # Polygon transformieren
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


inputFile = "deutschland-postleitzahlen.geojson"  # Input file path
with open(inputFile, 'r', encoding='utf-8') as f:
    input_geojson = json.load(f)

outputFile = "bw-geodata.geojson"  # Output file path
filter_key = "lan_name"
filter_value = "Baden-Württemberg"

geojson=filter_geojson(input_geojson, filter_key, filter_value)
geojson=calculate_area_and_add_to_properties(geojson)

with open(outputFile, 'w', encoding='utf-8') as f:
    json.dump(geojson, f, ensure_ascii=False, indent=2)


js_dir = "../project"
os.makedirs(js_dir, exist_ok=True)


# Ergebnis speichern (JavaScript-Datei)
with open(os.path.join(js_dir, "bw-geodata.js"), "w") as jsfile:
    jsfile.write("var orte = ")
    json.dump(geojson, jsfile, indent=2)
    jsfile.write(";")

print("Die Flächen wurden berechnet und die Dateien erstellt.")