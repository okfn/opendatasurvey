'use strict';

module.exports = function(sequelize, DataTypes) {
  var QuestionSet = sequelize.define('QuestionSet', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: true,
      comment: 'id of the questionset. A hash of the site id + questionset url.'
    },
    site: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Site this questionset belongs to.'
    },
    qsSchema: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'QuestionSet schema json object.'
    }
  }, {
    tableName: 'questionset',
    indexes: [
      {
        fields: ['site']
      }
    ],
    classMethods: {
      associate: function(models) {
        QuestionSet.hasMany(models.Dataset, {foreignKey: 'questionsetid', onUpdate: 'CASCADE', onDelete: 'SET NULL'});
      }
    }
  });

  return QuestionSet;
};
