'use strict';

var _ = require('lodash');
var mixins = require('./mixins');

module.exports = function(sequelize, DataTypes) {
  var Place = sequelize.define('Place', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'id of the place. Composite key with site.'
    },
    site: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Site this place belongs to. Composite key with id.'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'The name of the place.'
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'A slug of this place name.'
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The region in which this place is located.'
    },
    continent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'The continent in which this place is located.'
    },
    reviewers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: 'Place-specific reviewers.'
    },
    translations: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    tableName: 'place',
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
          place: self.id
        }), function(e) {
          return e.yCount(questions);
        }));
      }
    },
    classMethods: {
      maxScore: function(entries, questionMaxScore) {
        var count = _.size(_.uniq(_.map(entries, function(entry) {
          return entry.place;
        })));
        var score = count * questionMaxScore;
        return score;
      },
    },
  });

  return Place;
};
