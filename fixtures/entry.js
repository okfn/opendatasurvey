var _ = require('underscore');
var uuid = require('node-uuid');
var datasets = require('./dataset');
var places = require('./place');
var users = require('./user');

function answers() { return {
  digital: _.sample([false, true]),
  exists: _.sample([false, true]),
  machinereadable: _.sample([false, true]),
  openlicense: _.sample([false, true]),
  online: _.sample([false, true]),
  public: _.sample([false, true]),
  publisher: 'Acme',
  format: ['CSV', 'PSF'],
  license: 'http://example.com'
}; }

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
