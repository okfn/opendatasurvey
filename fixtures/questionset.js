'use strict';

var objects = [
  {
    model: 'QuestionSet',
    data: {
      site: 'site1',
      id: 'questionset-hash',
      qsSchema: JSON.parse('[{"id":"exists","position":0,"defaultProperties":{"required":true,"enabled":true,"visible":true},"if":[]},{"id":"digital","position":1,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"public","position":2,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"free","position":3,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"online","position":4,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"machinereadable","position":5,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"bulk","position":6,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"openlicense","position":7,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"uptodate","position":8,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"exists","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"url","position":4.1,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"online","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]},{"id":"format","position":5.1,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"machinereadable","value":"Yes","properties":{"required":false,"enabled":true,"visible":true}}]},{"id":"licenseurl","position":7.1,"defaultProperties":{"required":false,"enabled":false,"visible":false},"if":[{"providerId":"openlicense","value":"Yes","properties":{"required":true,"enabled":true,"visible":true}}]}]')
    }
  },
  {
    model: 'QuestionSet',
    data: {
      site: 'site2',
      id: 'questionset-hash-site2',
      qsSchema: []
    }
  }
];

module.exports = objects;
