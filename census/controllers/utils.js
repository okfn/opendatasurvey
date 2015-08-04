'use strict';

var _ = require('lodash');

var FIELD_SPLITTER = /[\s,]+/;

var makeChoiceValidator = function(param) {
  return function(req) {
    req.checkBody(param, "You must make a valid choice").isChoice();
  };
};

var validators = {
  exists: {
    validate: makeChoiceValidator("exists"),
    require: ["digital", "public", "uptodate"]
  },
  digital: {
    validate: makeChoiceValidator("digital"),
    require: ["online", "machinereadable", "bulk"],
    expectFalse: ["online", "machinereadable", "bulk"]
  },
  public: {
    validate: makeChoiceValidator("public"),
    require: ["free"],
    expectFalse: ["free", "online", "openlicense", "bulk"]
  },
  free: {
    validate: makeChoiceValidator("free"),
    require: ["openlicense"],
    expectFalse: ["openlicense"]
  },
  online: {
    validate: makeChoiceValidator("online"),
    require: ["url"]
  },
  openlicense: {
    validate: makeChoiceValidator("openlicense"),
    require: ["licenseurl"]
  },
  machinereadable: {
    validate: makeChoiceValidator("machinereadable"),
    require: ["format"]
  },
  bulk: {
    validate: makeChoiceValidator("bulk")
  },
  uptodate: {
    validate: makeChoiceValidator("uptodate")
  },
  format: {
    type: "string",
    validate: function(req) {
      req.checkBody("machinereadable", "You must specify the data format").notEmpty();
    }
  },
  url: {
    type: "string",
    validate: function(req) {
      req.checkBody("url", "You must specify a valid URL").isURL();
    }
  },
  licenseurl: {
    type: "string",
    validate: function(req) {
      req.checkBody("licenseurl", "You must specify a valid URL").isURL();
    }
  }
};

var validateQuestion = function(req, question, parentValue, validated) {
  /**
   * Validate the question.
   *
   * If the answer is positive ("true") validate the field with all
   * possible values.
   *
   * If it's "false":
   *
   *  * check that all the "expectFalse" question values are "false".
   *
   * Then if the answer is negative ("false" or "null"):
   *
   *  * check all the required fields have the same values as its
   *    parent ("false" or "null") unless the field's type is string,
   *    in that case ensure that the string is empty.
   *
   * Iterate over the required questions recursively.
   */

  var validator = validators[question],
      value = req.body[question],
      parentValue = parentValue || "true",
      validated = validated || [];

  if (value === undefined) {
    req.checkBody(question, "You must specify " + question).equals("any");
  }

  // ensure false values for expectFalse questions
  if (value === "false" && validator.expectFalse) {
    validator.expectFalse.forEach(function(child) {
      if (validated.indexOf(question) == -1) {
        req.checkBody(child, "You can specify only 'false'").equals("false");
        validated.push(child);
      }
    });
  }

  if (validated.indexOf(question) == -1) {
    // not yet validated

    // validate depending on the question value
    if (parentValue === "null" || parentValue === "false") {
      // validate falsy values
      if (validator.type === "string") {
        req.checkBody(question, "You must not specify this field").equals("");
      } else {
        req.checkBody(question, "You can specify only '" + parentValue + "'")
           .equals(parentValue);
      }
    } else {
      // parentValue has a truthy value, validate as normal
      validator.validate(req);
    }

    validated.push(question);
  }

  // validate recursively
  if (validator.require) {
    validator.require.forEach(function(child) {
      validateQuestion(req, child, value, validated);
    });
  }

};

var validateData = function(req, mappedErrors) {
  /**
   * Ensures validation data is submitted by checking the POST data on
   * req.body according to the declared validation logic.
   * Used for new data submissions, and revision proposals.
   */
  var errors,
      mapped = mappedErrors || false;

  req.checkBody("place", "You must select a Place").notEmpty();
  req.checkBody("dataset", "You must select a Dataset").notEmpty();

  validateQuestion(req, "exists");

  errors = req.validationErrors(mapped);

  return errors;
};


var placeMapper = function(data) {
  var reviewers = [];
  if (data.reviewers) {
    reviewers = _.each(data.reviewers.split(FIELD_SPLITTER), function(r) { r.trim(); });
  }
  return _.merge(data, {id: data.id.toLowerCase(), reviewers: reviewers});
};


var datasetMapper = function(data) {
  var reviewers = [];
  if (data.reviewers) {
    reviewers = _.each(data.reviewers.split(FIELD_SPLITTER), function(r) { r.trim(); });
  }
  return _.merge(data, {id: data.id.toLowerCase(), name: data.title,
                        order: data.order || 100, reviewers: reviewers});
};


var questionMapper = function(data) {
  var dependants = null;
  if(data.dependants){ dependants = data.dependants.split(FIELD_SPLITTER); }
  return _.merge(data, {id: data.id.toLowerCase(), dependants: dependants,
                        score: data.score || 0, order: data.order || 100});
};


module.exports = {
  validateData: validateData,
  placeMapper: placeMapper,
  datasetMapper: datasetMapper,
  questionMapper: questionMapper,
  FIELD_SPLITTER: FIELD_SPLITTER
};
