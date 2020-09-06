import json
import io
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

import urllib.request

app = Flask(__name__)
CORS(app)


@app.route("/")
def hello():
    return "ОЛОЛОЛО"

def handle_value(value):
    if value == "EPSG:3857":
        return "EPSG:900913"
    return value

@app.route("/map")
def map():
    key_value_params_pairs = ["{}={}".format(key, handle_value(request.args[key])) for key in request.args.keys()]
    parameters = "&".join(key_value_params_pairs)

    url = 'http://transport.orgp.spb.ru/portal-prod/mapserv?MAP=vehicle_typed.map&{}'.format(parameters)
    print("I send", url)
    response = urllib.request.urlopen(url)
    data = response.read()
    return send_file(io.BytesIO(data), mimetype='image/png')

@app.route("/way")
def way():
    url_template = 'http://transport.orgp.spb.ru/Portal/transport/map/stage?ROUTE={route_id}&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&SRS=EPSG%3A900913&BBOX=3248267.954007,8290981.138665,3499755.331694,8460805.106258'
    route_id = request.args["route_id"]

    url = url_template.format(route_id=route_id)
    response = urllib.request.urlopen(url)
    data = json.loads(response.read())
    coordinates = []
    for feature in data["features"]:
        coordinates += feature["geometry"]["coordinates"]
    return jsonify(coordinates)

if __name__ == "__main__":
    app.run(host='0.0.0.0')
