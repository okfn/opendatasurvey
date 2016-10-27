'use strict';

var _ = require('lodash');
var uuid = require('node-uuid');
var datasets = require('./dataset');
var places = require('./place');
var users = require('./user');

const formatAnswers = [
  {checked: true, description: 'AsciiDoc'},
  {checked: true, description: 'CSV'},
  {checked: false, description: 'DBF'},
  {checked: false, description: 'GML'},
  {checked: false, description: 'GPX'},
  {checked: false, description: 'GRIB2'},
  {checked: false, description: 'GeoJSON'},
  {checked: true, description: 'HTML'}
];

function answers() {
  return {
    digital: {id: 'digital', value: true, commentValue: ''},
    exists: {id: 'exists', value: 'Yes', commentValue: ''},
    machinereadable: {id: 'machinereadable', value: true, commentValue: ''},
    openlicense: {id: 'openlicense', value: false, commentValue: ''},
    online: {id: 'online', value: false, commentValue: ''},
    public: {id: 'public', value: false, commentValue: ''},
    publisher: {id: 'publisher', value: 'Acme', commentValue: ''},
    format: {id: 'format', value: formatAnswers, commentValue: ''},
    license: {id: 'license', value: 'http://example.com', commentValue: ''}
  };
}

function currentAnswers() {
  return {
    digital: {id: 'digital', value: false, commentValue: ''},
    exists: {id: 'exists', value: false, commentValue: ''},
    machinereadable: {id: 'machinereadable', value: false, commentValue: ''},
    openlicense: {id: 'openlicense', value: true, commentValue: ''},
    online: {id: 'online', value: true, commentValue: ''},
    public: {id: 'public', value: true, commentValue: ''},
    publisher: {id: 'publisher', value: 'Acme', commentValue: ''},
    format: {id: 'format', value: formatAnswers, commentValue: ''},
    license: {id: 'license', value: 'http://example.com', commentValue: ''}
  };
}

function bySite(fixtures, siteId) {
  return _.filter(fixtures, function(D) {
    return D.data.site === siteId;
  });
}

var objects = [
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2014,
      place: 'place12',
      dataset: 'dataset11',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: 'This is site1 entry',
      isCurrent: true, // Need to be sure that at least one current Entry exists for proper testing
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset11',
      answers: currentAnswers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: 'This is site1 entry',
      isCurrent: true, // Need to be sure that at least one current Entry exists for proper testing
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place12',
      dataset: 'dataset11',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset12',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: '',
      isCurrent: true,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2016,
      place: 'place11',
      dataset: 'dataset12',
      answers: answers(),
      submissionNotes: '',
      reviewed: false,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place12',
      dataset: 'dataset12',
      answers: answers(),
      submissionNotes: '',
      reviewed: false,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset11',
      answers: answers(),
      submissionNotes: '',
      reviewed: false,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset13',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: true,
      reviewComments: '',
      details: '',
      isCurrent: true,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: _.sample([false, true]),
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: _.sample([false, true]),
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: _.sample([false, true]),
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: true,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2016,
      place: _.sample(bySite(places, 'site2')).data.id,
      dataset: _.sample(bySite(datasets, 'site2')).data.id,
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  },
  // A set of entries for pair of place-dataset which all have isCurrent === false
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site2',
      year: 2015,
      place: 'placeOfNoEntry',
      dataset: 'datasetOfNoEntry',
      answers: answers(),
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitterId: _.sample(users).data.id,
      reviewerId: _.sample(users).data.id
    }
  }
];

module.exports = objects;
