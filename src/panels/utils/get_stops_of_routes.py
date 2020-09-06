import re
import json
import urllib.request
from urllib.error import HTTPError

def load_data():
    with open("./filtered_routes.json") as routes_file:
        return json.load(routes_file)

check_route_url = "http://transport.orgp.spb.ru/Portal/transport/route/{id}"
routes = load_data()

filtered_routes_list = []
for route in routes:
    url = check_route_url.format(id=route["route_id"])
    print(url)
    f = urllib.request.urlopen(url)
    data = f.read().decode('utf-8')
    m = re.findall('Portal\/transport\/stop\/(\d+)"', data)
    print(m)
    if len(m) != 2:
        continue
    route["start_stop"] = m[0]
    route["final_stop"] = m[1]
    filtered_routes_list.append(route)
    print()

with open('filtered_routes_with_stops.json', 'w') as f:
    json.dump(filtered_routes_list, f, ensure_ascii=False, indent=2)
