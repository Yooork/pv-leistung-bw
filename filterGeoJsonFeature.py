import json

def filter_geojson(input_file, output_file, key, value):
    
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    filtered_features = [
        feature for feature in data.get('features', [])
        if feature.get('properties', {}).get(key) == value
    ]
    
    filtered_geojson = {
        "type": "FeatureCollection",
        "features": filtered_features
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(filtered_geojson, f, ensure_ascii=False, indent=2)

input_geojson = "/Users/flrnvsc/Downloads/Geo Vis 2.1/nrw-postleitzahlen.geojson"  # Input file path
output_geojson = "/Users/flrnvsc/Downloads/Geo Vis 2.1/bw-postleitzahlen.geojson"  # Output file path
filter_key = "lan_name"
filter_value = "Baden-Württemberg"


filter_geojson(input_geojson, output_geojson, filter_key, filter_value)
