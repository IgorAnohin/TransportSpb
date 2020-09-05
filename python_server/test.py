import urllib.request

url = 'http://transport.orgp.spb.ru/portal-prod/mapserv?map=vehicle_typed.map&&SERVICE=WMS&REQUEST=GetMap&LAYERS=vehicle_bus%2Cvehicle_tram%2Cvehicle_trolley&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&VERSION=1.1.1&WHEELCHAIRONLY=false&WIDTH=256&HEIGHT=256&SRS=EPSG%3A900913&BBOX=3370567.1992631326,8365268.375529694,3375459.169073384,8370160.345339939'
response = urllib.request.urlopen(url)
data = response.read()
print(response.raw)
print(type(data))
