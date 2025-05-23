import subprocess
import sys

def install(package):
    """Installiert ein Python-Paket."""
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Installiere erforderliche Pakete
required_packages = ["flask", "flask-cors"]

for package in required_packages:
    try:
        __import__(package)
    except ImportError:
        print(f"Installiere fehlendes Paket: {package}")
        install(package)

from flask import Flask,jsonify
from flask_cors import CORS
from models import Schema
from plzService import PLZService
import json

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def getPLZ():
    json_response = jsonify(PLZService().get_all())
    formatted_data = {
        "PLZ_PV": [
            {"PLZ": str(entry[0]), "PV": str(entry[1])} for entry in json_response.get_json()
        ]
    }
    return json.dumps(formatted_data, indent=4)


if __name__ == "__main__":
    Schema()
    app.run()