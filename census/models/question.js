'use strict';

var _ = require('lodash');
var nunjucks = require('nunjucks');

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
    questionshort: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'A very short version of the question.'
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
    openquestion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Flag to indicate if Question should be used to decide if an entry is Open.'
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
        /*
          Determine whether the provided answer passes the question. Ways of
          passing are defined in the score config object and include:

          `passValue`: a single value or array or values that the answer be
                       equal to.
          `passAnyOption`: if true, the answer must include at least one
                           option found in the question.config.options array.
         */
        if (_.has(this.config, 'score.passValue')) {
          let expected = _.get(this.config, 'score.passValue');
          if (!_.isArray(expected)) expected = [expected];
          return _.includes(expected, answer);
        } else if (_.has(this.config, 'score.passAnyOption') &&
                   _.has(this.config, 'options')) {
          let expected = this.config.options;
          if (!_.isArray(expected)) expected = [expected];
          if (!_.isArray(answer)) answer = [answer];
          return _.any(answer, o => {
            return _.includes(expected, o);
          });
        }
        // The config doesn't provide a way of passing, answer can't pass.
        return false;
      },
      isScored: function() {
        /* Return a boolean to determine whether the question contributes to scoring.*/
        return this.score > 0;
      },
      renderedQuestionText: function(dataset) {
        /* Return transformed question text in the presence of a context object. */
        const context = {
          datasetContext: {
            updateEvery: dataset.updateevery
          }
        };
        let renderedString = nunjucks.renderString(this.question, context);
        return renderedString;
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
