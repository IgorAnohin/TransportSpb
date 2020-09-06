import json
import urllib.request

url = 'http://transport.orgp.spb.ru/Portal/transport/map/stage?ROUTE=1670&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&SRS=EPSG%3A900913&BBOX=3248267.954007,8290981.138665,3499755.331694,8460805.106258'
response = urllib.request.urlopen(url)
data = json.loads(response.read())
coordinates = []
print(data)
for feature in data["features"]:
    coordinates += feature["geometry"]["coordinates"]

#print(coordinates)

