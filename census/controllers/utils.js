var _makeChoiceValidator = function(param) {
  return function(req) {
    req.checkBody(param, "You must make a valid choice").isChoice();
  };
};

var _validators = {
  exists: {
    validate: _makeChoiceValidator("exists"),
    dependants: ["digital", "public", "uptodate"],
    optional: ["publisher"]
  },
  digital: {
    validate: _makeChoiceValidator("digital"),
    dependants: ["online", "machinereadable", "bulk"]
  },
  public: {
    validate: _makeChoiceValidator("public"),
    dependants: ["free"]
  },
  free: {
    validate: _makeChoiceValidator("free"),
    dependants: ["openlicense"]
  },
  online: {
    validate: _makeChoiceValidator("online"),
    dependants: ["url"]
  },
  openlicense: {
    validate: _makeChoiceValidator("openlicense")
  },
  machinereadable: {
    validate: _makeChoiceValidator("machinereadable"),
    dependants: ["format"]
  },
  format: {
    validate: function(req) {
      req.checkBody("machinereadable", "You must specify the format of data").notEmpty();
    }
  },
  bulk: {
    validate: _makeChoiceValidator("bulk")
  },
  url: {
    validate: function(req) {
      req.checkBody("publisher", "You must specify a valid URL").isURL();
    }
  },
  uptodate: {
    validate: _makeChoiceValidator("uptodate")
  }
};

var _validateQuestion = function (req, question) {
  /**
   * Validate the question. If the answer is positive validate all the
   * question dependants recursively.
   */
  _validators[question].validate(req);
  if (req.body[question] === "true" && _validators[question].dependants) {
    _validators[question].dependants.forEach(function(dep) {
      _validateQuestion(req, dep);
    });
  }
};

var validateData = function(req) {
  /**
   * Ensures validation data is submitted by checking the POST data on
   * req.body according to the declared validation logic.
   * Used for new data submissions, and revision proposals.
   */
  var errors;

  req.checkBody("place", "You must select a Place").notEmpty();
  req.checkBody("dataset", "You must select a Dataset").notEmpty();

  _validateQuestion(req, "exists");
  errors = req.validationErrors();

  return errors;
};

module.exports = {
  validateData: validateData
};
