'use strict';

const uuid = require('uuid');
const controllerUtils = require('../census/controllers/utils');

const userIds = [
  uuid.v4(),
  uuid.v4(),
  uuid.v4(),
  uuid.v4()
];

module.exports = {
  userIds: userIds,
  ANONYMOUS_USER_ID: controllerUtils.ANONYMOUS_USER_ID
};
