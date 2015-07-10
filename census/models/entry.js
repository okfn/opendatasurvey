'use strict';


module.exports = function (sequelize, DataTypes) {

  var Entry = sequelize.define('Entry', {
    id: {
      type: DataTypes.UUID,
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
    comments: {
      // all comments by other users, keyed by question id
      // eg: {"licenseurl": {"USER_ID": "This user comment"}}
      type: DataTypes.JSONB,
      allowNull: true
    },
    characteristics: {
      // all characteristic booleans, keyed by type
      // eg: {"high_resolution": true, "aggregate_data": false}
      type: DataTypes.JSONB,
      allowNull: true
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
      default: false,
      comment: "A flag to indicate if this is the current entry for this year/place/dataset."
    }
  },
  {
    instanceMethods: {
      isOpen: function() {
        if (this.answers.exists === 'Y' && this.answers.openlicense === 'Y' &&
            this.answers.public === 'Y' && this.answers.machinereadable === 'Y' ) {
          return true;
        } else {
          return false;
        }
      }
    },
    classMethods: {
      associate: function (models) {

        Entry.belongsTo(models.User, {
          as: 'submitter',
          foreignKey: 'submitterId'
        });

        Entry.belongsTo(models.User, {
          as: 'reviewer',
          foreignKey: 'reviewerId'
        });

      }
    },
    tableName: 'entry'
  });

  return Entry;

};
