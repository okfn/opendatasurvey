import urllib
import datastore.client

fp = 'cache/submissions.csv'
url = 'https://docs.google.com/spreadsheet/pub?key=0Aon3JiuouxLUdEVnbG5pUFlyUzBpVkFXbXJ2WWpGTUE&output=csv'
dsurl = 'http://localhost:9200/ds/opendatacensus'
dsurl = 'http://datahub.io/api/data/1f7dbeab-b523-4fa4-b9ab-7cfc3bd5e9f7'

client = datastore.client.DataStoreClient(dsurl)

def getdata():
    print 'Retrieving data'
    urllib.urlretrieve(url, fp)
    print 'Done'

def upload():
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

getdata()
upload()
# analytics()

