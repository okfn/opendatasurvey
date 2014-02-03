"use strict";

var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')
  , express = require('express')
  , flash = require('connect-flash')
  , scrypt = require('scrypt')
  , passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy

  , config = require('./lib/config')
  , env = require('./env')
  , model = require('./lib/model').OpenDataCensus
  , util = require('./lib/util')
  ; 

var app = express();

// CORS middleware
var CORSSupport = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

// Cache-Control header middleware
var CacheControl = function (maxAge) {
  maxAge = parseInt(maxAge, 10);

  return function(req, res, next) {
    if (typeof res.get('Cache-Control') === 'undefined') {
      res.set('Cache-Control', 'public, max-age=' + maxAge);
    }
    next();
  };
};

var BasicAuth = express.basicAuth(function(user, pass) {
  var validUser = (user === config.get('appconfig:auth_user'));
  var validPass = scrypt.verifyHashSync(
    config.get('appconfig:auth_passhash'),
    pass
  );
  return validUser && validPass;
});

app.configure(function() {
  app.set('port', config.get('appconfig:port'));
  app.set('views', __dirname + '/templates');
  if (config.get('appconfig:auth_on')) {
    app.use(BasicAuth);
  }
  if (!config.get('test:testing')) {
    app.use(express.logger('dev'));
  }
  app.use(express.favicon());
  app.use(express.bodyParser());

  if (!config.get('appconfig:readonly')) {
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: process.env.SESSION_SECRET || 'dummysecret'
    }));
    app.use(passport.initialize());
    app.use(passport.session());
  }

  app.use(CORSSupport);
  app.use(flash());

  var staticRoot = path.join(__dirname, 'public');
  var staticOpts = {};
  if (config.get('appconfig:readonly')) {
    staticOpts.maxAge = 3600 * 1000;
  }
  app.use(express['static'](staticRoot, staticOpts));

  if (config.get('appconfig:readonly')) {
    app.use(CacheControl(1800));
  }
});

env.express(app);

app.all('*', function(req, res, next) {
  if (config.get('test:testing') === true) {
    if (!req.user && config.get('test:user')) {
      req.user = config.get('test:user');
    }
    res.locals.currentUser = req.user ? req.user : null; 
  }

  if (config.get('appconfig:readonly')) {
    res.locals.readonly = true;
    // No session support in readonly mode, so fake it out:
    req.session = {};
    req.session.loggedin = false;
  }
  res.locals.sitename = config.get('title');
  res.locals.sitename_short = config.get('title_short');
  res.locals.error_messages = req.flash('error');
  res.locals.info_messages = req.flash('info');
  next();
});


// ========================================================
// Start routes
// ========================================================

// If we are NOT running in readonly mode, then load the "census" routes
if (!config.get('appconfig:readonly')) {
  console.log("WARNING: Loading in census mode. Data will be editable.");
  var census = require('./census');

  census.addRoutes(app);
}

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
  if (config.get('appconfig:readonly')) {
    aboutfile = 'templates/aboutro.md';
  }
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

app.get('/press', function(req, res) {
  res.render('press.html');
});

app.get('/visualisations', function(req, res) {
  res.render('visualisations.html');
});

app.get('/country', function(req, res) {
  res.render('country/index.html', {
    info: model.data.country,
    datasets: model.data.datasets,
    questions: model.openQuestions,
    placesById: model.data.placesById
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
  if (!(req.params.place) in model.data.placesById) {
    res.send(404, 'There is no place with ID ' + place + ' in our database. Are you sure you have spelled it correctly? Please check the <a href="/country/">place page</a> for the list of places');
    return;
  }

  model.backend.getPlace(place, function(err, info) {
    if (err) {
      res.send(500, err);
      return;
    }

    var entrys = {},
        submissions = {};

    // TODO: move this to model
    _.each(model.data.datasets, function(dataset) {
      _.each(info.entrys, function(entry) {
        if (entry.dataset == dataset.id) {
          entry['ycount'] = util.scoreOpenness(model.data, entry);
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
      datasets: model.data.datasets,
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
  var datasetIds = _.pluck(model.datasets, 'id');
  if (! dataset in datasetIds) {
    res.send(404, 'There is no such dataset in the index. Are you sure you have spelled it correctly? Please check the <a href="/faq#whatdatasets">FAQ</a> for the list of datasets');
    return;
  }

  res.render('country/dataset.html', {
    info: model.data.country,
    loggedin: req.session.loggedin,
    dataset: dataset
  });
});

/* Single Entry Page */
/* TODO: optimize/improve */
app.get('/country/:place/:dataset', function(req, res) {
  // TODO: check dataset is in the dataset list o/w 404
  var dataset = model.data.datasets.filter(function(d) {
    return (d.id === req.params.dataset);
  });
  var ynquestions = model.data.questions.slice(0, 9);

  function render(prefill_) {
    res.render('country/entry.html', {
      ynquestions: ynquestions,
      questions: model.data.questions,
      datasets: model.data.datasets,
      dataset: dataset,
      prefill: prefill_
    });
  }

  // look up if there is an entry and if so we use it to prepopulate the form
  var prefill = [];

  model.backend.getEntry({
    place: req.params.place,
    dataset: req.params.dataset,
    //TODO: next year, extend to /2013/, etc.
    year: config.get('display_year')
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
      //TODO: next year, extend to /2013/, etc.
      year: config.get('display_year')
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

exports.app = app;

