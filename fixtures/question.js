var objects = [
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'exists',
      'order': 0,
      'question': 'Does the data exist',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'file-alt',
      'config': {
        'score': {
          'weight': 5,
          'passValue': 'Yes'
        }
      },
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'digital',
      'order': 1,
      'question': 'Is data in digital form',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'save',
      'config': {},
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'public',
      'order': 2,
      'question': 'Publicly available',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'eye-open',
      'dependants': ['publisher', 'officialtitle'],
      'config': {
        'score': {
          'weight': 5,
          'passValue': ['Yes', true, 123]
        }
      },
      'openquestion': true
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'free',
      'order': 3,
      'question': 'Is the data available for free',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'dollar',
      'config': {
        'score': {
          'weight': 5,
          'passValue': ['Yes', true]
        }
      },
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'online',
      'order': 4,
      'question': 'Is the data available online',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'download',
      'dependants': ['url'],
      'config': {
        'score': {
          'weight': 5,
          'passValue': ['Yes', true]
        }
      },
      'openquestion': true
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'machinereadable',
      'order': 5,
      'question': 'Is the data machine readable',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'keyboard',
      'dependants': ['format'],
      'config': {
        'score': {
          'weight': 5,
          'passValue': ['Yes', true]
        }
      },
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'bulk',
      'order': 6,
      'question': 'Available in bulk',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 10,
      'icon': 'copy',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'openlicense',
      'order': 7,
      'question': 'Openly licensed',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'unlock-alt',
      'dependants': ['licenseurl'],
      'config': {
        'score': {
          'weight': 5,
          'passValue': ['Yes', true]
        }
      },
      'openquestion': true
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'uptodate',
      'order': 8,
      'question': 'Is the data provided on a timely and up to date basis',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 10,
      'icon': 'time',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'url',
      'order': 9,
      'question': 'URL of data online',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'url',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'format',
      'order': 10,
      'question': 'Format of data',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'multiple',
      'score': 10,
      'icon': '',
      'openquestion': true,
      'config': {
        'score': {
          'weight': 10,
          'passAnyOption': true
        },
        'options': ['XLS', 'PX', 'CSV', 'HTML', 'JSON', 'TSV', 'XML', 'RDF', 'TXT', 'AsciiDoc', 'SHP', 'SHX', 'DBF', 'WFS', 'GeoJSON', 'GPX', 'KML', 'KMZ', 'GML', 'GRIB2'],
        'includeOther': false,
        'orderOptions': true,
        'short': true
      },
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'licenseurl',
      'order': 11,
      'question': 'URL to license or terms of use',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'url',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'dateavailable',
      'order': 12,
      'question': 'Date data first openly available',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'text',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'officialtitle',
      'order': 13,
      'question': 'Title and short description',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'text',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'publisher',
      'order': 14,
      'question': 'Data Publisher',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'text',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'qualityinfo',
      'order': 15,
      'question': 'Rate Quality of the Data (Content)',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'select',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'qualitystructure',
      'order': 16,
      'question': 'Rate Quality of Data (Structure)',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'select',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site1',
      'questionsetid': 'questionset-hash',
      'id': 'details',
      'order': 17,
      'question': 'Further Details and Comments (optional but strongly ' +
        'encouraged)',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'textarea',
      'score': 0,
      'icon': '',
      'openquestion': false
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'exists',
      'order': 0,
      'question': 'Does the data exist',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'file-alt'
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'digital',
      'order': 1,
      'question': 'Is data in digital form',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'save'
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'public',
      'order': 2,
      'question': 'Publicly available',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'eye-open',
      'dependants': ['publisher', 'officialtitle']
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'free',
      'order': 3,
      'question': 'Is the data available for free',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 15,
      'icon': 'dollar'
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'online',
      'order': 4,
      'question': 'Is the data available online',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 5,
      'icon': 'download',
      'dependants': ['url']
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'machinereadable',
      'order': 5,
      'question': 'Is the data machine readable',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 15,
      'icon': 'keyboard',
      'dependants': ['format']
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'bulk',
      'order': 6,
      'question': 'Available in bulk',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 10,
      'icon': 'copy'
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'openlicense',
      'order': 7,
      'question': 'Openly licensed',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 30,
      'icon': 'unlock-alt',
      'dependants': ['licenseurl']
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'uptodate',
      'order': 8,
      'question': 'Is the data provided on a timely and up to date basis',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': '',
      'score': 10,
      'icon': 'time'
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'url',
      'order': 9,
      'question': 'URL of data online',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'url',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'format',
      'order': 10,
      'question': 'Format of data',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'text',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'licenseurl',
      'order': 11,
      'question': 'URL to license or terms of use',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'url',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'dateavailable',
      'order': 12,
      'question': 'Date data first openly available',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'text',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'officialtitle',
      'order': 13,
      'question': 'Title and short description',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'text',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'publisher',
      'order': 14,
      'question': 'Data Publisher',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'text',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'qualityinfo',
      'order': 15,
      'question': 'Rate Quality of the Data (Content)',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'select',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'qualitystructure',
      'order': 16,
      'question': 'Rate Quality of Data (Structure)',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'select',
      'score': 0,
      'icon': ''
    }
  },
  {
    'model': 'Question',
    'data': {
      'site': 'site2',
      'questionsetid': 'questionset-hash-site2',
      'id': 'details',
      'order': 17,
      'question': 'Further Details and Comments (optional but strongly ' +
        'encouraged)',
      'description': 'the description',
      'placeholder': 'the placeholder',
      'type': 'textarea',
      'score': 0,
      'icon': ''
    }
  }
];

module.exports = objects;
