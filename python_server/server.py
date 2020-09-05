import io
from flask import Flask, request, send_file
import urllib.request

app = Flask(__name__)

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

if __name__ == "__main__":
    app.run(host='0.0.0.0')
