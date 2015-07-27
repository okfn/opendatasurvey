var uuid = require('node-uuid');


var objects = [
  {
    model: 'Entry',
    data: {
      id: uuid.v4(),
      site: 'site1',
      year: 2015,
      place: 'place11',
      dataset: 'dataset11',
      answers: {},
      submissionNotes: '',
      reviewed: true,
      reviewResult: false,
      reviewComments: '',
      details: '',
      isCurrent: false,
      submitter_id: '',
      reviewer_id: ''
    }
  }
];


module.exports = objects;
