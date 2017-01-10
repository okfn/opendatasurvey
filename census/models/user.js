'use strict';

var bcrypt = require('bcrypt');

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      comment: 'Unique identifier for this user.'
    },
    emails: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      validate: {
        isEmail: true
      },
      allowNull: false
    },
    providers: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    homePage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    authenticationHash: {
      type: DataTypes.STRING
    },
    authenticationSalt: {
      type: DataTypes.STRING
    }
  }, {
    instanceMethods: {
      setPassword: function(password) {
        var salt = bcrypt.genSaltSync(8);

        this.authenticationHash = bcrypt.hashSync(password, salt);
        this.authenticationSalt = salt;
      },
      fullName: function() {
        if (this.firstName === this.lastName) {
          return 'F'.replace('F', this.firstName || '');
        }
        return 'F L'.replace('F', this.firstName || '')
          .replace('L', this.lastName || '');
      },
      isAnonymous: function() {
        return this.firstName === 'anonymous' && this.lastName === 'anonymous';
      }

    },
    tableName: 'user'
  });

  return User;
};
