import json
import urllib.request
from urllib.error import HTTPError

def load_data():
    with open("./routes.json") as routes_file:
        return json.load(routes_file)

check_route_url = "http://transport.orgp.spb.ru/Portal/transport/route/{id}"
routes = load_data()

filtered_routes_list = []
for route in routes:
    url = check_route_url.format(id=route["route_id"])
    print(url)
    try:
        f = urllib.request.urlopen(url)
        #print(f.read().decode('utf-8'))
        filtered_routes_list.append(route)
    except urllib.error.HTTPError as err:
        error_str = "ERROR {}".format(err)
        if error_str != "ERROR HTTP Error 500: Internal Server Error":
            raise
        print(error_str)

print("new list", filtered_routes_list)
with open('filtered_routes.json', 'w') as f:
    json.dump(filtered_routes_list, f, ensure_ascii=False, indent=2)
