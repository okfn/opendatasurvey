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
  },
  sourceIsURL: {
    rule: value => {
      for (let i = 0; i < value.length; i++) {
        if (!validator.isURL(value[i].urlValue)) {
          return false;
        }
      }
      return true;
    },
    message: 'Each source URL must be a valid URL'
  }
};

module.exports = validators;
