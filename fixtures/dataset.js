'use strict';

var objects = [
  {
    model: 'Dataset',
    data: {
      id: 'dataset11',
      site: 'site1',
      name: 'Dataset 11',
      description: 'Description of *Dataset* 11',
      order: 0,
      qsurl: 'http://example.com/googlespreadsheet',
      questionsetid: 'questionset-hash'
    }
  },
  {
    model: 'Dataset',
    data: {
      id: 'dataset12',
      site: 'site1',
      name: 'Dataset 12',
      description: 'Description of Dataset 12',
      order: 0,
      qsurl: 'http://example.com/googlespreadsheet',
      questionsetid: 'questionset-hash'
    }
  },
  {
    model: 'Dataset',
    data: {
      id: 'dataset13',
      site: 'site1',
      name: 'Dataset 13',
      description: 'Description of Dataset 13',
      order: 0,
      qsurl: 'http://example.com/googlespreadsheet',
      questionsetid: 'questionset-hash',
      disableforyears: ['2015']
    }
  },
  {
    model: 'Dataset',
    data: {
      id: 'dataset21',
      site: 'site2',
      name: 'English Dataset 21',
      description: 'Description of Dataset 21',
      order: 0,
      qsurl: 'http://example.com/googlespreadsheet',
      questionsetid: 'questionset-hash',
      translations: {es: {name: 'Spanish Dataset 21'}}
    }
  },
  {
    model: 'Dataset',
    data: {
      id: 'dataset22',
      site: 'site2',
      name: 'Dataset 22',
      description: 'Description of Dataset 22',
      order: 0,
      qsurl: 'http://example.com/googlespreadsheet',
      questionsetid: 'questionset-hash'
    }
  },
  {
    model: 'Dataset',
    data: {
      id: 'datasetOfNoEntry',
      site: 'site2',
      name: 'Dataset 22 of no entry',
      description: 'Description of Dataset 22 of no entry',
      order: 0,
      qsurl: 'http://example.com/googlespreadsheet',
      questionsetid: 'questionset-hash'
    }
  }

];

module.exports = objects;
