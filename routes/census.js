var fs = require('fs')
  , _ = require('underscore')
  , crypto = require('crypto')
  , passport = require('passport')
  , GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

  , config = require('../lib/config')
  , env = require('../lib/templateenv')
  , util =  require('../lib/util.js')
  , model = require('../lib/model').OpenDataCensus
  , marked = require('marked')
  ;

exports.submit = function(req, res) {
  if (requireLoggedIn(req, res)) return;

  var datasets = [];
  var ynquestions = model.data.questions.slice(0,9);
  var prefill = req.query;
  var year = prefill.year || config.get('submit_year');
  var submissionData = req.body,
      errors,
      reboundFormData,
      response_status = 200;

    function render(prefill_, status) {
        res.statusCode = status;
        res.render('submission/create.html', {
            canReview: true, // flag always on for submission
            submitInstructions: config.get('submit_page', req.locale),
            places: util.translateRows(model.data.places, req.locale),
            ynquestions: util.translateQuestions(ynquestions, req.locale),
            questions: util.translateQuestions(model.data.questions, req.locale),
            questionsById: util.translateObject(model.data.questionsById, req.locale),
            datasets: util.markupRows(util.translateRows(model.data.datasets, req.locale)),
            year: year,
            prefill: prefill_,
            currrecord: prefill_,
            errors: errors,
            formData: reboundFormData
        });
    }

    function insertSubmissionCallback(err, data) {
        var msg,
            msg_tmpl,
            redirect_path;
        // TODO: Do flash messages properly
        if (err) {
            console.log(err);
            msg = 'There was an error! ' + err;
            req.flash('error', msg);
        } else {
            msg_tmpl = 'Thanks for your submission.REVIEWED You can check back here any time to see the current status.';
            if (!data.reviewed) {
                msg = msg_tmpl.replace('REVIEWED',  ' It will now be reviewed by the editors.');
                submission_path = '/submission/' + data.submissionid;
                redirect_path = submission_path;
            } else {
                msg = msg_tmpl.replace('REVIEWED',  '');
                submission_path = '/submission/' + data.submissionid;
                redirect_path = '/place/' + data.place
            }
            req.flash('info', msg);
        }
        res.redirect(redirect_path + '?post_submission=' + submission_path);
    }

  // validate the POST data and put the results on `errors`
  if (req.method === 'POST') {
      errors = validateSubmitForm(req);
      if (errors) {
          reboundFormData = submissionData;
          response_status = 400;
      }
  }

  if (req.method === 'POST' && !errors) {
          model.backend.insertSubmission(submissionData, req.user,
              insertSubmissionCallback);

  } else if (prefill.dataset && prefill.place) {
      model.backend.getEntry({
          place: prefill.place,
          dataset: prefill.dataset,
          year: year
      }, function (err, entry) {
          // we allow query args to override entry values
          // might be useful (e.g. if we started having form errors and
          // redirecting here ...)
          if (entry) { // we might have a got a 404 etc
              prefill = _.extend(entry, prefill);
          }
          render(prefill, response_status);
      });

  } else {
      render(prefill, response_status);
  }

};


//app.get('/country/submission/:id.json', function(req, res) {
//  model.backend.getSubmission({submissionid: req.params.id}, function(err, obj) {
//    if (err) {
//      res.json(500, { error: { message: 'There was an error: ' + err } });
//    }
//    res.json(obj);
//  });
//});

// Compare & update page
exports.submission = function(req, res) {
  var ynquestions = model.data.questions.slice(0,9),
      reviewClosed;

  model.backend.getSubmission({submissionid: req.params.submissionid}, function(err, obj) {
    if (err) {
      res.send(500, 'There was an error ' + err);
    } else if (!obj) {
        res.send(404, 'There is no submission with id ' + req.params.submissionid);
    } else {

      if (obj.reviewresult) {
          // If the object has been reviewed, we close further reviews.
          reviewClosed = true;
      }

      // see if there is an entry
      model.backend.getEntry(obj, function(err, entry) {
        if (!entry) {
          entry = {};
        }
        var dataset = _.findWhere(model.data.datasets, {
          id: obj.dataset
        });
        var place = model.data.placesById[obj.place];

        res.render('submission/review.html', {
          canReview: exports.canReview(req.user, place),
          reviewClosed: reviewClosed,
          reviewInstructions: config.get('review_page', req.locale),
          ynquestions: util.translateQuestions(ynquestions, req.locale),
          questions: util.translateQuestions(model.data.questions, req.locale),
          questionsById: util.translateObject(model.data.questionsById, req.locale),
          prefill: obj,
          currrecord: entry,
          dataset: util.markup(util.translate(dataset, req.locale)),
          place: util.translate(place, req.locale),
          disqus_shortname: config.get('disqus_shortname'),
          reviewState: true
        });
      });
    }
  });
};

exports.reviewPost = function(req, res) {
  if (requireLoggedIn(req, res)) return;
  // Get the submission's place, so we can find the local reviewers
  model.backend.getSubmission({submissionid: req.params.submissionid}, function(err, obj) {
    if (!exports.canReview(req.user, model.data.placesById[obj.place])) {
      res.send(401, 'Sorry, you are not an authorized reviewer');
      return;
    }
  });

  var acceptSubmission = req.body['submit'] === 'Publish';
  model.backend.processSubmission(req.user, acceptSubmission, req.params.submissionid, req.body, function(err) {
    if (err) {
      if (err.code) {
        res.send(err.code, err.message);
      } else {
        res.send(500, err);
      }
    } else {
      if (acceptSubmission) {
        var msg = "Submission processed and entered into the census.";
        req.flash('info', msg);
      } else {
        var msg = "Submission marked as rejected.";
        req.flash('info', msg);
      }
      // TODO: find a better way to update cached data
      // model.load(function() {
        res.redirect('/');
      // });
    }
  });
};

exports.anonLogin = function(req, res) {
  if (config.get('anonymous_submissions') !== 'TRUE') {
    return res.send(405);
  }

  var name = req.body.displayName || 'Anonymous';
  var user = util.makeUserObject({
    id: 'anonymous',
    provider: 'okfn',
    username: 'anonymous',
    displayName: name
  });

  req.session.nextUrl = req.query.next;

  req.login(user, function(err) {
    if (err) {
      return res.send(err.code || 500, err.message || err);
    }

    exports.loggedin(req, res);
  });
};

exports.login = function(req, res) {
  // TODO: use this stored next url properly ...
  req.session.nextUrl = req.query.next;
  res.render('login.html', {
    anonymous_submissions: config.get('anonymous_submissions') === 'TRUE'
  });
};

exports.logout = function(req, res){
  req.logout();
  res.redirect('/');
};

exports.loggedin = function(req, res) {
  if (req.session.nextUrl) {
    res.redirect(req.session.nextUrl);
  } else {
    res.redirect('/');
  }
};

// ========================================================
// Admin
// ========================================================

exports.reload = function(req, res) {
  model.load(function(err) {
    msg = 'Reloaded OK &ndash; <a href="/">Back to home page</a>';
    if (err) {
      console.error('Failed to reload config info');
      msg = 'Failed to reload config etc. ' + err;
    }
    res.send(msg);
  });
}

// ========================================================
// Local Functions
// ========================================================

exports.setupAuth = function() {
  passport.use(
    new GoogleStrategy({
        clientID: config.get('google:app_id'),
        clientSecret: config.get('google:app_secret'),
        callbackURL: config.get('site_url').replace(/\/$/, '') + '/auth/google/callback',
        profileFields: ['id', 'displayName', 'name', 'username', 'emails', 'photos']
      },
      function(accessToken, refreshToken, profile, done) {
        var userobj = util.makeUserObject(profile);
        if (config.get('user_database_key')) {
          model.backendUser.createUserIfNotExists(userobj, function(err) {
            if (err) console.error(err);
            done(null, userobj);
          });
        } else {
          done(null, userobj);
        }
      }
    )
  );

  // At the moment we get all user info on auth and store to cookie so these are both no-ops ...
  passport.serializeUser(function(user, done) {
    done(null, user);
  });
  passport.deserializeUser(function(profile, done) {
    var err = null;
    done(err, profile);
  });
}

function requireLoggedIn(req, res) {
  if (!req.user) {
    res.redirect('/login/?next=' + encodeURIComponent(req.url));
    return true;
  }
}

function _getLocalReviewers(place) {
  // Get the local reviewers of a specific place.
  // Not all places have a reviewers column
  return (place.hasOwnProperty('reviewers')) ? place.reviewers.trim().split(/[\s,]+/) : [];
}

exports.canReview = function(user, place) {
  if (!user) {
    return false;
  }

  // Get both the main reviewers list...
  var reviewers = config.get('reviewers') || [];
  if (!!(~reviewers.indexOf(user.userid) || ~reviewers.indexOf(user.email))) {
    return true;
  }

  // ...and the local place reviewers
  if (place) {
    var localReviewers = _getLocalReviewers(place)
    return !!(~localReviewers.indexOf(user.userid) || ~localReviewers.indexOf(user.email));
  }

  return false;
}

function isAdmin(user) {
  return (config.get('admins').indexOf(user.userid) !== -1);
}


function validateSubmitForm(req) {
    /**
     * Ensures validation data is submitted by checking the POST data on
     * req.body according to the declared validation logic.
     * Used for new data submissions, and revision proposals.
     */

    var errors,
        exists;

    // first check exists for a yes answer.
    if (req.body.hasOwnProperty('exists') && req.body.exists === 'Yes') {
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
}

exports.validateSubmitForm = validateSubmitForm;
