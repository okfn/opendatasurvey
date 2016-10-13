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
  }, {
    tableName: 'place',
    indexes: [
      {
        fields: ['site']
      }
    ],
    instanceMethods: {
      translated: mixins.translated,
      score: function(entries, questions) {
        let entriesForPlace = _.filter(entries, {place: this.id});
        let scoreableQuestions = _.filter(questions, q => q.isScored());
        return _.sum(
          _.map(entriesForPlace, entry => {
            return entry.scoreForQuestions(scoreableQuestions);
          })
        );
      }
    },
    classMethods: {
      /* Calculate the max score possible for all unique places used by a given list
         of entries.*/
      maxScore: function(entries, questionMaxScore) {
        // number of unique places across the passed entries.
        var count = _.size(_.uniq(_.map(entries, entry => entry.place)));
        // max score possible across all unique places
        var score = count * questionMaxScore;
        return score;
      }
    }
  });

  return Place;
};
