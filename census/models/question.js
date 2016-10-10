'use strict';

var _ = require('lodash');
var mixins = require('./mixins');

module.exports = function(sequelize, DataTypes) {
  var Question = sequelize.define('Question', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'id of the question. Composite key with site.'
    },
    site: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Site this question belongs to. Composite key with id.'
    },
    question: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The question itself.'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'A text description of this question.'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Input type for this question. used in UI.'
    },
    placeholder: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Placeholder text for this question. Used in UI.'
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Question-type specific configuration.'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The score for this question. Used for calculations.'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: 'The order for this question relative to others. ' +
        'Used for submission form.'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The icon class for this question. Used in UI.'
    },
    dependants: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      comment: 'Questions that depend on this question. Used in UI.'
    },
    translations: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'question',
    indexes: [
      {
        fields: ['site']
      }
    ],
    instanceMethods: {
      translated: mixins.translated,
      scoreForAnswer: function(answer) {
        /* Return the score for the provided answer. Either the full score or 0. */

        let returnScore = (this.pass(answer)) ? this.score : 0;
        return returnScore;
      },
      pass: function(answer) {
        /* Determine whether the provided answer passes the question. */

        // If config doesn't provide a way of passing, answer can't pass.
        if (!_.has(this.config, 'score.passValue'))
          return false;

        let expected = _.get(this.config, 'score.passValue');
        if (!_.isArray(expected)) {
          expected = [expected];
        }
        return _.includes(expected, answer);
      }
    },
    classMethods: {
      associate: function(models) {
        Question.belongsTo(models.QuestionSet, {foreignKey: 'questionsetid', onUpdate: 'CASCADE', onDelete: 'CASCADE'});
      },
      /* Calculate the max score possible for a given list of questions */
      maxScore: function(questions) {
        return _.sum(_.map(questions, question => question.score));
      }
    }
  });

  return Question;
};
