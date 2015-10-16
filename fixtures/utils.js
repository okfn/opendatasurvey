var uuid = require('node-uuid');
var userIds = [
  uuid.v4(),
  uuid.v4(),
  uuid.v4(),
  uuid.v4()
];

module.exports = {
  userIds: userIds
};
