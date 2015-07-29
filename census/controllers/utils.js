var validateData = function (req) {
  /**
   * Ensures validation data is submitted by checking the POST data on
   * req.body according to the declared validation logic.
   * Used for new data submissions, and revision proposals.
   */

  var errors,
    exists;

  // first check exists for a yes answer.
  if (req.body.hasOwnProperty('exists') && req.body.exists === 'true') {
    exists = true;
  }

  req.checkBody('place', 'You must select a Place').notEmpty();
  req.checkBody('dataset', 'You must select a Dataset').notEmpty();
  req.checkBody('exists', 'You must make a valid choice').isChoice();

  if (exists) {

    req.checkBody('digital', 'You must make a valid choice').isChoice();
    req.checkBody('public', 'You must make a valid choice').isChoice();
    req.checkBody('free', 'You must make a valid choice').isChoice();
    req.checkBody('online', 'You must make a valid choice').isChoice();
    req.checkBody('machinereadable', 'You must make a valid choice').isChoice();
    req.checkBody('bulk', 'You must make a valid choice').isChoice();
    req.checkBody('openlicense', 'You must make a valid choice').isChoice();
    req.checkBody('uptodate', 'You must make a valid choice').isChoice();

  }

  errors = req.validationErrors();

  return errors;
};


module.exports = {
  validateData: validateData
};
