'use strict';

var _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
  var Entry = sequelize.define('Entry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for this entry.'
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Site this entry belongs to. Composite key with id.'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'The census year for this entry.'
    },
    place: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Place this entry belongs to.'
    },
    dataset: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Dataset this entry belongs to.'
    },
    answers: {
      // A collection of answers represented as a json object. Each object has
      // an `id`, `value` and `commentValue`, eg:
      // {
      //   "id": "collector_gov",
      //   "value": "Yes",
      //   "commentValue": "A comment about the government dept."
      // }
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'A collection of answers for the main questions.'
    },
    aboutYouAnswers: {
      // A collection of answers represented as a json object. Each object has
      // an `id`, `value` and `commentValue`, eg:
      // {
      //   "id": "yourKnowledgeOpenData",
      //   "value": "3",
      //   "commentValue": "A comment about my Open Data knowledge."
      // }
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'A collection of answers for the About You section.'
    },
    submissionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'A text description from the submitter providing ' +
        'context for this entry.'
    },
    reviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'A flag that indicates whether or not this entry ' +
        'has been reviewed.'
    },
    reviewResult: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'A flag that indicates whether or not this entry ' +
        'has been reviewed.'
    },
    reviewComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Any review-specific comments added by the reviewer.'
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'A text description, possibly edited by the reviewer, ' +
        'providing context for this entry.'
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'A flag to indicate if this is the current entry for ' +
        'this year/place/dataset.'
    }
  }, {
    tableName: 'entry',
    indexes: [
      {
        fields: ['site']
      }
    ],
    instanceMethods: {
      _getAnswerValueForQuestion: function(q) {
        // Find the `value` property for the answer with `id`.
        let answer = _.result(_.find(this.answers, {id: q.id}), 'value');
        // Multiple-choice answers need special treatment to get the checked
        // answers.
        if (q.type === 'multiple') {
          answer = _.filter(answer, option => option.checked);
          answer = _.map(answer, option => option.description);
        }
        return answer;
      },
      isOpenForQuestions: function(questions) {
        // Only interested in 'open' questions.
        let openQuestions = _.filter(questions, q => q.openquestion);
        // We must have some Open Questions to be an Open entry.
        if (openQuestions.length === 0)
          return false;
        // All Open Questions must pass for the answers in this entry.
        return _.all(openQuestions, q => q.pass(this._getAnswerValueForQuestion(q)));
      },
      scoreForQuestions: function(questions) {
        var scores = [];
        _.each(questions, q => {
          let answer = this._getAnswerValueForQuestion(q);
          scores.push(q.scoreForAnswer(answer));
        });
        return _.sum(scores);
      }
    },
    classMethods: {
      associate: function(models) {
        Entry.belongsTo(models.User, {
          as: 'Submitter',
          foreignKey: 'submitterId',
          allowNull: false
        });

        Entry.belongsTo(models.User, {
          as: 'Reviewer',
          foreignKey: 'reviewerId',
          allowNull: false
        });
      }
    }
  });

  return Entry;
};
