var uuid = require('node-uuid');


var objects = [
  {
    'model': 'User',
    'data': {
      'id': uuid.v4(),
      emails: ['email1@example.com'],
      providers: {google: 'google1'},
      firstName: 'First1',
      lastName: 'Last1'
    }
  },
  {
    'model': 'User',
    'data': {
      'id': uuid.v4(),
      emails: ['email2@example.com'],
      providers: {google: 'google2'},
      firstName: 'First2',
      lastName: 'Last2'
    }
  },
  {
    'model': 'User',
    'data': {
      'id': uuid.v4(),
      emails: ['email3@example.com'],
      providers: {google: 'google3'},
      firstName: 'First3',
      lastName: 'Last3'
    }
  },
  {
    'model': 'User',
    'data': {
      'id': uuid.v4(),
      emails: ['email4@example.com'],
      providers: {'google': 'google4'},
      firstName: 'First4',
      lastName: 'Last4'
    }
  }
];


module.exports = objects;
