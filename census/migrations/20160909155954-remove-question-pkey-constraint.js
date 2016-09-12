'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query(
      'ALTER TABLE ONLY question DROP CONSTRAINT IF EXISTS question_pkey;'
    ).then(function() {
      return queryInterface.sequelize.query(
        'ALTER TABLE ONLY question ADD CONSTRAINT question_pkey PRIMARY KEY(id, questionsetid);'
      );
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query(
      'ALTER TABLE ONLY question DROP CONSTRAINT question_pkey;'
    ).then(function() {
      return queryInterface.sequelize.query(
        'ALTER TABLE ONLY question ADD CONSTRAINT question_pkey PRIMARY KEY (id, site);'
      );
    });
  }
};
