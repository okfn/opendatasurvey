'use strict';

var _ = require('lodash');


module.exports = function (sequelize, DataTypes) {

  var Entry = sequelize.define('Entry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: "Unique identifier for this entry."
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Site this entry belongs to. Composite key with id."
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "The census year for this entry."
    },
    place: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Place this entry belongs to."
    },
    dataset: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Dataset this entry belongs to."
    },
    answers: {
      // all answers represented as json object. eack key is a question identifier
      // eg: {"publisher": "Acme", "format": ["CSV", "PSF"], "license": "http://example.com"}
      type: DataTypes.JSONB,
      allowNull: false
    },
    submissionNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "A text description from the submitter providing context for this entry."
    },
    reviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "A flag that indicates whether or not this entry has been reviewed."
    },
    reviewResult: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "A flag that indicates whether or not this entry has been reviewed."
    },
    reviewComments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Any review-specific comments added by the reviewer."
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "A text description, possibly edited by the reviewer, providing context for this entry."
    },
    isCurrent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "A flag to indicate if this is the current entry for this year/place/dataset."
    }
  },
  {
    tableName: 'entry',
    indexes: [
      {
        fields: ['site']
      }
    ],
    instanceMethods: {
      isOpen: function() {

        if (this.answers.exists === true && this.answers.openlicense === true &&
            this.answers.public === true && this.answers.machinereadable === true ) {

          return true;

        } else {

          return false;

        }
      },
      yCount: function(questions) {

        var scores = [],
            self = this;

        _.each(questions, function(q) {

          if (self.answers[q.id] === true && q.score) {
            scores.push(q.score);
          }
        });

        return _.sum(scores);

      }
    },
    classMethods: {
      associate: function (models) {

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
