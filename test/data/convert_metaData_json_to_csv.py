import numpy as np 
import json
import csv

with open('metaData.json', 'r') as f:
    metadata = json.load(f)

csvdata = map(lambda x: {'Simulation type':x['Simulation type'], 'Model type':x['Model type'], 'Average f':x['Average f'], 'Std dev f':x['Std dev f']},metadata['data'])

csv_columns=csvdata[0].keys()
with open('metaData.csv', 'w') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=csv_columns)
    writer.writeheader()
    for data in csvdata:
        writer.writerow(data)
