"use strict";

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var GoogleSpreadsheet = require('google-spreadsheet');
var _ = require('underscore');
var csv = require('csv');
var express = require('express');
var flash = require('connect-flash');
var nunjucks = require('nunjucks');
var request = require('request');

var config = require('./lib/config');
var env = require('./env');
var model = require('./lib/model').OpenDataCensus;

var app = express();

// CORS middleware
var CORSSupport = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

app.configure(function() {
  app.set('port', config.get('appconfig:port'));
  app.set('views', __dirname + '/templates');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: process.env.SESSION_SECRET || 'dummysecret'}));
  app.use(CORSSupport);
  app.use(flash());
  app.use(express['static'](path.join(__dirname, 'public')));
});

env.express(app);

app.all('*', function(req, res, next) {
  if (config.get('test:testing') === true) {
    req.session.loggedin = true;
  }
  if (config.get('production:readonly') === true) {
    res.locals.readonly = true;
    req.session.loggedin = false;
  }
  res.locals.error_messages = req.flash('error');
  res.locals.info_messages = req.flash('info');
  next();
});


// ========================================================
// Start routes
// ========================================================

app.get('/', function(req, res) {
  res.render('index.html', {
    numberCountries: model.data.country.summary.places.toString(),
    numberSubmissions: _.size(model.data.countrysubmissions.results),
    numberSubmitters: _.size(model.data.countrysubmissions.submitters),
    numberEditors: _.size(model.data.countrysubmissions.reviewers),
    numberEntries: model.data.country.summary.entries.toString(),
    numberOpen: model.data.country.summary.open.toString()
  });
});

app.get('/about', function(req, res) {
  var aboutfile = 'templates/about.md';
  if (config.get('production:readonly') === true) aboutfile = 'templates/aboutro.md';
  fs.readFile(aboutfile, 'utf8', function(err, text) {
    var marked = require('marked');
    var content = marked(text);
    res.render('base.html', {
      content: content,
      title: 'About'
    });
  });
});

app.get('/contributors', function(req, res) {
  res.render('contributors.html', {
    reviewers: model.data.countrysubmissions.reviewers,
    submitters: model.data.countrysubmissions.submitters
  });
});

if (config.get('production:readonly') !== true) {
  app.get('/faq', function(req, res) {
    var tmpl = env.getTemplate('_snippets/questions.html');
    var questionInfo = tmpl.render({
      questions: model.data.questions
    });
    var dataTmpl = env.getTemplate('_snippets/datasets.html');
    var dataInfo = dataTmpl.render({
      datasets: model.data.country.datasets
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
}

if (config.get('production:readonly') !== true) {
  app.get('/contribute', function(req, res) {
    res.render('country/contribute.html', {places: model.countryList});
  });
}

app.get('/country', function(req, res) {
  res.render('country/index.html', {
    info: model.data.country,
    questions: model.openQuestions
  });
});

app.get('/country/results.json', function(req, res) {
  res.json(model.data.country);
});

//Show details per country. Extra/different functionality for reviewers.
// TODO: want this at simply /country/{place} but need to make sure we don't
// interfere with other urls
app.get('/country/overview/:place', function(req, res) {
  var place = req.params.place;
  if (model.countryList.indexOf(req.params.place) == -1) {
    res.send(404, 'There is no country named ' + place + ' in our database. Are you sure you have spelled it correctly? Please check the <a href="/country/">country page</a> for the list of countries');
    return;
  }

  model.backend.getPlace(place, function(err, info) {
    if (err) {
      res.send(500, err);
      return;
    }

    var entrys = {},
        submissions = {};

    _.each(model.data.country.datasets, function(dataset) {
      _.each(info.entrys, function(entry) {
        if (entry.dataset == dataset.id) {
          entry['ycount'] = model.scoreOpenness(entry);
          entrys[dataset.id] = entry;
        }
      });
      submissions[dataset.id] = _.filter(info.submissions, function(submission) {
        return (submission.dataset == dataset.id);
      });
    });

    res.render('country/place.html', {
      reviewers: model.data.countrysubmissions.reviewersByPlace[place],
      submitters: model.data.countrysubmissions.submittersByPlace[place],
      info: model.data.country,
      submissions: submissions,
      entrys: entrys,
      place: place,
      loggedin: req.session.loggedin
    });
  });
});

//Show details per dataset
app.get('/country/dataset/:dataset', function(req, res) {
  var dataset = req.params.dataset;
  if (!model.datasetNamesMap[dataset]) {
    res.send(404, 'There is no such dataset in the index. Are you sure you have spelled it correctly? Please check the <a href="/faq#whatdatasets">FAQ</a> for the list of datasets');
    return;
  }

  res.render('country/dataset.html', {
    info: model.data.country,
    loggedin: req.session.loggedin,
    dataset: dataset,
    datasetNamesMap: model.datasetNamesMap
  });
});

if (config.get('production:readonly') !== true) {
  app.get('/country/submit', function(req, res) {
    var datasets = [];
    var ynquestions = model.data.questions.slice(0,9);
    var prefill = req.query;

    function render(prefill_) {
      res.render('country/submit.html', {
        countryList: model.countryList,
        ynquestions: ynquestions,
        questions: model.data.questions,
        datasets: model.data.country.datasets,
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
          var dataset = _.find(model.data.country.datasets, function(d) {
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
}

if (config.get('production:readonly') !== true) {
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
    if (config.get('production:readonly') === true) {
        res.send(500, 'This version of the site does not support logging in.');
    }
    else doLogin(req, res);
  });
}

function checkPassword(password, expectedHash) {
  var sha1 = crypto.createHash('sha1');
  var hash = sha1.update(password).digest('hex');
  return (hash === expectedHash);
}

function doLogin(req, res) {
  if (checkPassword(req.body['password'], 'dfadfb32ba022696637f550b4d9a1a6438ed57dd')) {
    req.session.loggedin = true;
    req.flash('info', 'You are now logged in!');
    model.load(function() { //Get latest data
      var redirectto = req.body['next'];
      res.redirect(( redirectto || '/country/'));
    });
  }
  else {
    req.flash('error', 'Incorrect password. Plese try again');
    res.redirect('country/login/?next=' + req.body['next']);
  }
}

/* Single Entry Page */
/* TODO: optimize/improve */
app.get('/country/:place/:dataset', function(req, res) {
  var datasets = [];
  var ynquestions = model.data.questions.slice(0, 9);

  function render(prefill_) {
    res.render('country/entry.html', {
      countryList: model.countryList,
      ynquestions: ynquestions,
      questions: model.data.questions,
      datasets: model.data.country.datasets,
      datasetNamesMap: model.datasetNamesMap,
      prefill: prefill_
    });
  }

  // look up if there is an entry and if so we use it to prepopulate the form
  var prefill = [];

  model.backend.getEntry({
    place: req.params.place,
    dataset: req.params.dataset,
    year: /*year || */ model.DEFAULT_YEAR //TODO: next year, extend to /2013/, etc.
  }, function(err, obj) {
    if (obj) { // we might have a got a 404 etc
      prefill = _.extend(obj, prefill);
    } else {
      res.send(404, 'There is no entry for ' + req.params.place + ' and ' + req.params.dataset);
      return;
    }

    model.backend.getSubmissions({
      place: req.params.place,
      dataset: req.params.dataset,
      year: /*year || */ model.DEFAULT_YEAR //TODO: next year, extend to /2013/, etc.
    }, function(err, obj) {
      // we allow query args to override entry values
      // might be useful (e.g. if we started having form errors and redirecting
      // here ...)
      if (obj) { // we might have a got a 404 etc
        prefill['reviewers'] = [];
        prefill['submitters'] = [];

        _.each(obj, function(val) {
          if (val['reviewer'] !== "") prefill['reviewers'].push(val['reviewer']);
          if (val['submitter'] !== "") prefill['submitters'].push(val['submitter']);
        });

        prefill['reviewers'] = _.uniq(prefill['reviewers']);
        prefill['submitters'] = _.uniq(prefill['submitters']);
        if (prefill['reviewers'].length === 0) prefill['noreviewers'] = true;
        if (prefill['submitters'].length === 0) prefill['nosubmitters'] = true;
        render(prefill);
      } else {
        res.send(404, 'There is no entry for ' + req.params.place + ' and ' + req.params.dataset);
        return;
      }
    });
  });
});


// ========================================================
// Booting up
// ========================================================

model.load(function(err) {
  if (err) {
    console.error('Failed to load dataset info');
    throw err;
  }
  app.listen(app.get('port'), function() {
    console.log("Listening on " + app.get('port'));
  });
});

exports.app = app;
