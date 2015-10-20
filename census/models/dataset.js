'use strict';

var _ = require('lodash');
var mixins = require('./mixins');

module.exports = function(sequelize, DataTypes) {
  var Dataset = sequelize.define('Dataset', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'id of the dataset. Composite key with site.'
    },
    site: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Site this dataset belongs to. Composite key with id.'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The name of the dataset.'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'A text description of this dataset.'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The category for this dataset. Used in UI.'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The icon class for this dataset. Used in UI.'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      default: 100,
      comment: 'The order for this dataset relative to others. ' +
        'Used for various table displays.'
    },
    reviewers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Dataset-specific reviewers.'
    },
    translations: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    tableName: 'dataset',
    indexes: [
      {
        fields: ['site']
      }
    ],
    instanceMethods: {
      translated: mixins.translated,
      score: function(entries, questions) {
        var self = this;
        return _.sum(_.map(_.where(entries, {
          dataset: self.id
        }), function(e) {
          return e.yCount(questions);
        }));
      }
    }
  });

  return Dataset;
};
