'use strict';


module.exports = function(sequelize, DataTypes) {

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
      unique: 'unique_together',
      comment: "Site this entry belongs to. Composite key with id."
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'unique_together',
      comment: "The census year for this entry."
    },
    place: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'unique_together',
      comment: "Place this entry belongs to."
    },
    dataset: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'unique_together',
      comment: "Dataset this entry belongs to."
    },
    answers: {
      // all answers represented as json object. eack key is a question identifier
      // eg: {"publisher": "Acme", "format": ["CSV", "PSF"], "license": "http://example.com"}
      type: DataTypes.JSONB,
      allowNull: false
    },
    submission_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "A text description from the submitter providing context for this entry."
    },
    reviewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: "A flag that indicates whether or not this entry has been reviewed."
    },
    reviewResult: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    is_current: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      unique: 'unique_together',
      comment: "A flag to indicate if this is the current entry for this year/place/dataset."
    }
  },
  {
    classMethods: {
      associate: function(models) {

        Entry.belongsTo(models.User, {
          as: 'Submitter',
          foreignKey: 'submitter_id'
        });

        Entry.belongsTo(models.User, {
          as: 'Reviewer',
          foreignKey: 'reviewer_id'
        });

      }
    },
    tableName: 'entry'
  });

  return Entry;

};
