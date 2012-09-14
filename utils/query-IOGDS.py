import sparql
import json

logd="http://logd.tw.rpi.edu/sparql"

datasets="""
  PREFIX dgtwc: <http://data-gov.tw.rpi.edu/2009/data-gov-twc.rdf#>
  PREFIX conversion: <http://purl.org/twc/vocab/conversion/>
  SELECT ?country, count(distinct ?dataset) as ?datasets
  WHERE { 
       ?dataset a conversion:CatalogedDataset .
       ?dataset dgtwc:catalog_country ?country.
  } GROUP BY ?country
  """

catalogs="""
  PREFIX dgtwc: <http://data-gov.tw.rpi.edu/2009/data-gov-twc.rdf#>
  PREFIX conversion: <http://purl.org/twc/vocab/conversion/>
  SELECT ?country, count(distinct ?catalog) as ?catalogs
  WHERE { 
     ?catalog a conversion:DatasetCatalog .
     ?catalog dgtwc:catalog_country ?country.
    }  GROUP BY ?country
    """

service=sparql.Service(logd);

special_cases=[
  ('http://dbpedia.org/resource/German','http://dbpedia.org/resource/Germany'),
  ('http://dbpedia.org/resource/United_Kindom','http://dbpedia.org/resource/United_Kingdom'),
  ('http://dbpedia.org/resource/Non-governmental_organization','http://dbpedia.org/resource/Non-Government'),
  ]

class Country:
  def __init__(self,uri):
    self.uri=uri
    self.name=uri.split("/")[-1].replace("_"," ")
    self.catalogs=0
    self.datasets=0

  def dict(self):  
    return {"name":self.name,
        "uri":self.uri,
        "catalogs":self.catalogs,
        "datasets":self.datasets
        }

def get_country(lst,uri):
  """ get a country from the list """
  for i in lst:
    if i.uri==uri:
      return i
  return None

def create_country(entry):
  country=Country(entry[0].value)
  country.datasets=int(entry[1].value)
  return country

def update_country(countries,entry):
  country=get_country(countries,entry[0].value)
  if not country:
    country=Country(entry[0].value)
  country.catalogs=int(entry[1].value)

r=service.query(datasets)
countries=[create_country(i) for i in r.fetchall()]
r=service.query(catalogs)
for i in r.fetchall():
  update_country(countries,i)
  
for c in special_cases:
  w=get_country(countries,c[0])
  r=get_country(countries,c[1])
  r.datasets+=w.datasets
  r.catalogs+=w.catalogs
  countries.remove(w)

f=open("../data/logd.json","w")
json.dump([i.dict() for i in countries],f)
f.close()
  
