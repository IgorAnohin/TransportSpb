import re

with open("log") as log_file:
    data = log_file.read()
m = re.findall('Portal\/transport\/stop\/(\d+)"', data)
print(m)
