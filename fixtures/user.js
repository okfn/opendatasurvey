var utils = require('./utils');

var objects = [
  {
    model: 'User',
    data: {
      id: utils.userIds[0],
      emails: ['email1@example.com'],
      providers: {google: 'google1'},
      firstName: 'First1',
      lastName: 'Last1'
    }
  },
  {
    model: 'User',
    data: {
      id: utils.userIds[1],
      emails: ['email2@example.com'],
      providers: {google: 'google2'},
      firstName: 'First2',
      lastName: 'Last2'
    }
  },
  {
    model: 'User',
    data: {
      id: utils.userIds[2],
      emails: ['email3@example.com'],
      providers: {google: 'google3'},
      firstName: 'First3',
      lastName: 'Last3'
    }
  },
  {
    model: 'User',
    data: {
      id: utils.userIds[3],
      emails: ['email4@example.com'],
      providers: {google: 'google4'},
      firstName: 'First4',
      lastName: 'Last4'
    }
  },
  {
    model: 'User',
    data: {
      id: '0e7c393e-71dd-4368-93a9-fcfff59f9fff',
      emails: ['anonymous@example.com'],
      providers: {okfn: 'anonymous '},
      firstName: 'anonymous',
      lastName: 'anonymous'
    }
  }
];

module.exports = objects;
