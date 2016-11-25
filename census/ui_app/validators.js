import validator from 'validator';

let validators = {
  isURL: {
    rule: value => {
      return validator.isURL(value);
    },
    message: 'Must be a valid URL'
  },
  required: {
    rule: value => {
      return !validator.isEmpty(value.toString());
    },
    message: 'Question is required'
  }
};

module.exports = validators;
