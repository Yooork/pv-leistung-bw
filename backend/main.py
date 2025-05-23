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
    app.run(host='0.0.0.0', port=5000)