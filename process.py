import urllib
from collections import defaultdict
import json

fp = 'cache/submissions.csv'
url = 'https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE&output=csv'

def getdata():
    print 'Retrieving data'
    urllib.urlretrieve(url, fp)
    print 'Done'

def upload():
    import datastore.client

    dsurl = 'http://localhost:9200/ds/opendatacensus'
    # dsurl = 'http://datahub.io/api/data/1f7dbeab-b523-4fa4-b9ab-7cfc3bd5e9f7'
    client = datastore.client.DataStoreClient(dsurl)


    print 'Deleting'
    client.delete()
    print 'Done'
    
    mapping = {
        'properties': {
            'Dataset': {
                'type': 'string',
                'index': 'not_analyzed'
            },
            'Census Country': {
                'type': 'string',
                'index': 'not_analyzed'
            },
        }
    }
    out = client.mapping_update(mapping)
    print out

    print 'Uploading to local'
    client.upload(fp)
    print 'Done'

def analytics():
    query = {
        'size': 0,
        'query': {
            'match_all': {}
        },
        'facets': {
            'country': {
                'terms': {
                    'field': 'Census Country',
                    'size': 500
                }
            },
            'dataset': {
                'terms': {
                    'field': 'Dataset',
                    'size': 15
                }
            }
        }
    }
    out = client.query(query)
    import pprint
    pprint.pprint(out)

def summary():
    import csv
    datasets = [
        'Election Results (national)',
        'Company Register',
        'National Map (Low resolution: 1:250,000 or better)',
        'Government Budget (National, high level, not detailed)',
        'Government Spending (National, transactional level data)',
        'Legislation (laws and statutes) - National',
        'National Statistical Data (economic and demographic information)',
        'National Postcode/ZIP database',
        'Public Transport Timetables',
        'Environmental Data on major sources of pollutants (e.g. location, emissions)'
        ]
    countries = {}
    for row in csv.DictReader(open(fp)):
        countries[row['Census Country']] = defaultdict(dict)
    for row in csv.DictReader(open(fp)):
        c = row['Census Country']
        d = row['Dataset']
        count = countries[c][d].get('count', 0)
        countries[c][d]['count'] = count + 1
    
    out = {
        'datasets': datasets,
        'countries': countries
        }
    json.dump(out, open('data/summary.json', 'w'), indent=2, sort_keys=True)

getdata()
# upload()
# analytics()
summary()

