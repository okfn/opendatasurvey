var fs = require('fs');

var _ = require('underscore');
var scrypt = require('scrypt');

var config = require('./lib/config');
var env = require('./env');
var model = require('./lib/model').OpenDataCensus;


function doLogin(req, res) {
  var validPass = scrypt.verifyHashSync(
    config.get('appconfig:review_passhash'),
    req.body['password']
  );
  if (validPass) {
    req.session.loggedin = true;
    req.flash('info', 'You are now logged in!');
    model.load(function() { // Get latest data
      var redirectto = req.body['next'];
      res.redirect(( redirectto || '/country/'));
    });
  } else {
    req.flash('error', 'Incorrect password. Plese try again');
    res.redirect('country/login/?next=' + req.body['next']);
  }
}

var addRoutes = function (app) {

  app.get('/faq', function(req, res) {
    var tmpl = env.getTemplate('_snippets/questions.html');
    var questionInfo = tmpl.render({
      questions: model.data.questions
    });
    var dataTmpl = env.getTemplate('_snippets/datasets.html');
    var dataInfo = dataTmpl.render({
      datasets: model.data.datasets
    });
    fs.readFile('templates/faq.md', 'utf8', function(err, text) {
      var marked = require('marked');
      var content = marked(text);
      content = content.replace('{{questions}}', questionInfo);
      content = content.replace('{{datasets}}', dataInfo);
      res.render('base.html', {
        content: content,
        title: 'FAQ - Frequently Asked Questions'
      });
    });
  });

  app.get('/contribute', function(req, res) {
    res.render('country/contribute.html', {places: model.countryList});
  });

  app.get('/country/submit', function(req, res) {
    var datasets = [];
    var ynquestions = model.data.questions.slice(0,9);
    var prefill = req.query;

    function render(prefill_) {
      res.render('country/submit.html', {
        countryList: model.countryList,
        ynquestions: ynquestions,
        questions: model.data.questions,
        datasets: model.data.datasets,
        prefill: prefill_
      });
    }

    // look up if there is an entry and if so we use it to prepopulate the form
    if (prefill.dataset && prefill.place) {
      model.backend.getEntry({
        place: prefill.place,
        dataset: prefill.dataset,
        year: prefill.year || model.DEFAULT_YEAR
      }, function(err, obj) {
        // we allow query args to override entry values
        // might be useful (e.g. if we started having form errors and
        // redirecting here ...)
        if (obj) { // we might have a got a 404 etc
          prefill = _.extend(obj, prefill);
        }
        render(prefill);
      });
    } else {
      render(prefill);
    }
  });

  app.post('/country/submit', function(req, res) {
    model.backend.insertSubmission(req.body, function(err, obj) {
      var msg;
      // TODO: Do flash messages properly
      if (err) {
        console.log(err);
        msg = 'There was an error! ' + err;
        req.flash('error', msg);
      } else {
        msg = 'Thank-you for your submission which has been received. It will now be reviewed by an Editor before being published. It may take up to a few minutes for your submission to appear here and up to a few days for it be reviewed. Please be patient.';
        req.flash('info', msg);
      }
      res.redirect('country/overview/' + req.body['place']);
    });
  });

  app.get('/country/submission/:id', function(req, res) {
    model.backend.getSubmission({submissionid: req.params.id}, function(err, obj) {
      if (err) {
        res.send(500, 'There was an rror: ' + err);
      }
      // TODO: do something properly ...
      res.send('Your submission exists');
    });
  });

  app.get('/country/submission/:id.json', function(req, res) {
    model.backend.getSubmission({submissionid: req.params.id}, function(err, obj) {
      if (err) {
        res.json(500, { error: { message: 'There was an error: ' + err } });
      }
      res.json(obj);
    });
  });

  // Compare & update page
  app.get('/country/review/:submissionid', function(req, res) {
    if (!req.session.loggedin) {
      res.redirect('/country/login/?next=' + encodeURIComponent(req.url));
      return;
    }

    var ynquestions = model.data.questions.slice(0,9);

    model.backend.getSubmission({submissionid: req.params.submissionid}, function(err, obj) {
      if (err) {
        res.send(500, 'There was an error ' + err);
      } else if (!obj) {
        res.send(404, 'There is no submission with id ' + req.params.submissionid);
      } else {
        // let's see if there was an entry
        model.backend.getEntry(obj, function(err, entry) {
          if (!entry) {
            entry = {};
          }
          var dataset = _.find(model.data.datasets, function(d) {
            return (d.id == obj.dataset);
          });
          res.render('country/review/index.html', {
            info: model.data.country,
            ynquestions: ynquestions,
            subrecord: obj,
            prefill: obj,
            currrecord: entry,
            dataset: dataset,
            datasetfriendly: model.datasetNamesMap[obj.dataset],
            currentYear: model.data.country.currentYear
          });
        });
      }
    });
  });

  app.post('/country/review/:submissionid', function(req, res) {
    if (!req.session.loggedin) {
      res.send(401, 'You are not authorized to do this');
      return;
    }

    model.backend.getSubmission({
      submissionid: req.params.submissionid
    }, function(err, submission) {
      if (err) {
        res.send(500, err);
        return;
      } else if (!submission) {
        res.send(404, 'No submission found for that info');
        return;
      } else {
        processSubmission(submission);
      }
    });

    function processSubmission(submission) {
      if ((req.body['submit']) === "Publish") {
        model.backend.acceptSubmission(submission, req.body, function(err) {
          if (err) {
            res.send(500, err);
          } else {
            var msg = "Submission processed and entered into the census.";
            req.flash('info', msg);
            doneUpdating(req, res, submission);
          }
        });
      } else if (req.body['submit'] === "Reject") {
        submission.reviewresult = 'rejected';
        // The only field we need from the form is the reviewer
        submission.reviewer = req.body['reviewername'];
        model.backend.markSubmissionAsReviewed(submission, function(err) {
          var msg = "Submission marked as rejected. The entry has been archived and marked as rejected. It will take a few minutes for this table to update. Thank you!";
          req.flash('info', msg);
          doneUpdating(req, res, submission);
        });
      }
    }
    function doneUpdating(req, res, submission) {
      // Get latest data
      model.load(function() {
        res.redirect('country/overview/' + submission.place);
      });
    }
  });

  //"Log In" page
  app.get('/country/login', function(req, res) {
    res.render('country/login.html', {
      places: model.data.countrysubmissions.places,
      place: req.query.place,
      next: req.query.next
    });
  });

  app.get('/country/logout', function(req, res) {
    if (req.session.loggedin) delete req.session.loggedin;
    res.redirect('/country/');
  });

  app.post('/country/login', function(req, res) {
    doLogin(req, res);
  });
};

exports.addRoutes = addRoutes;
