var express = require('express')
  , path = require('path')
  , fs = require('fs')
  , nunjucks = require('nunjucks')
  , request = require('request')
  , csv = require('csv')
  , GoogleSpreadsheet = require('google-spreadsheet')
  , _ = require('underscore')
  , config = require('./lib/config.js')
  , flash = require('connect-flash')
  ;

var app = express();

var model = require('./lib/model.js').OpenDataCensus;

//CORS middleware
var CORSSupport = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

app.configure(function() {
  app.set('port', config.get('appconfig:port'));
  app.set('views', __dirname + '/templates');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'wpbmzky%js,$#jsmdvgas'}));
  app.use(CORSSupport);
  app.use(flash());
  app.use(express.static(path.join(__dirname, 'public')));
});

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));

//Support for Jinja urlize filter
//Heavily cut down version of linkify:
/*

linkify plugin for jQuery - automatically finds and changes URLs in text content into proper hyperlinks  ****

  Version: 1.0

  Copyright (c) 2009
    Már Örlygsson  (http://mar.anomy.net/)  &
    Hugsmiðjan ehf. (http://www.hugsmidjan.is)

  Dual licensed under a MIT licence (http://en.wikipedia.org/wiki/MIT_License)
  and GPL 2.0 or above (http://www.gnu.org/licenses/old-licenses/gpl-2.0.html).
 */

 var noProtocolUrl = /(^|["'(\s]|&lt;)(www\..+?\..+?)((?:[:?]|\.+)?(?:\s|$)|&gt;|[)"',])/g,
      httpOrMailtoUrl = /(^|["'(\s]|&lt;)((?:(?:https?|ftp):\/\/|mailto:).+?)((?:[:?]|\.+)?(?:\s|$)|&gt;|[)"',])/g;

//TODO: Parameterize the targetting
env.addFilter('urlize', function(str) {
  return str
    .replace( noProtocolUrl, '$1<a href=\'<``>://$2\' target=\'_blank\'>$2</a>$3' )  // NOTE: we escape `"http` as `"<``> 
    .replace( httpOrMailtoUrl, '$1<a href=\'$2\' target=\'_blank\'>$2</a>$3' )
    .replace( /'<``>/g, '\'http' );  // reinsert `"http`
});

/*
 * Addition of wordwrap, also missing from nunjucks
 * Taken from http://james.padolsey.com/javascript/wordwrap-for-javascript/
 *
 */
env.addFilter('wordwrap', function(str, width, brk, cut) {
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;
    if (!str) {
      return str;
    }
    var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
    return str.match( RegExp(regex, 'g') ).join( brk );
});

env.express(app);

app.all('*', function(req, res, next) {
  if (config.get('test:testing') === true) {
    req.session.loggedin = true;
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
    numberEntries: model.data.country.summary.entries.toString(),
    numberOpen: model.data.country.summary.open.toString(),
    numberCatalogs: model.data.catalogs.records.length.toString()
  });
});

app.get('/about', function(req, res) {
  fs.readFile('templates/about.md', 'utf8', function(err, text) {
    var marked = require('marked');
    var content = marked(text);
    res.render('base.html', {
      content: content,
      title: 'About'
    });
  });
});

app.get('/contribute', function(req, res) {
  res.render('country/contribute.html', {places: model.countryList});
});

app.get('/country/', function(req, res) {
  //model.load(function() { //Don't reload for the public
  res.render('country/index.html', {info: model.data.country});
});
//});

app.get('/country/results.json', function(req, res) {
  model.load(function() { //Get latest data
    res.json(model.data.country);
  });
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
    var entrys = {}
      , submissions = {}
      ;
    _.each(model.data.country.datasets, function(dataset) {
      _.each(info.entrys, function(entry) {
        if (entry.dataset == dataset.id) {
          entrys[dataset.id] = entry;
        }
      });
      submissions[dataset.id] = _.filter(info.submissions, function(submission) {
        return (submission.dataset == dataset.id)
      });
    });
    res.render('country/place.html', {
      info: model.data.country,
      submissions: submissions,
      entrys: entrys,
      place: place,
      loggedin: req.session.loggedin
    });
  });
});

//This messes up URL arguments, removing for now
/*
 app.get('/country/remove', function(req, res) {
 //var country = req.param('country');
 //var dataset = req.param('dataset');
 remove('submitted', req);
 });
 */

app.get('/country/submit', function(req, res) {
  var datasets = [];
  var ynquestions = model.data.questions.slice(0,9);
  var prefill = req.query;
  
  function render(prefill_) {
    res.render('country/submit.html', {
        countryList: model.countryList
      , ynquestions: ynquestions
      , questions: model.data.questions
      , datasets: model.data.country.datasets
      , prefill: prefill_
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
        // might be useful (e.g. if we started having form errors and redirecting here ...)
        if (obj) { // we might have a got a 404 etc
          prefill = _.extend(obj, prefill);
        }
        render(prefill);
      }
    );
  } else {
    render(prefill);
  }
});

app.post('/country/submit', function(req, res) {
  model.backend.insertSubmission(req.body, function(err, obj) {
    //TODO: Do flash messages properly
    if (err) {
      console.log(err);
      var msg = 'There was an error! ' + err;
      req.flash('error', msg);
    } else {
      var msg = 'Thank-you for your submission which has been received. It will now be reviewed by an Editor before being published. It may take up to a few minutes for your submission to appear here and up to a few days for it be reviewed. Please be patient.'
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

//Compare & update page
app.get('/country/review/:submissionid', function(req, res) {
  if (!req.session.loggedin) {
    res.redirect('/country/login/?next=' + encodeURIComponent(req.url));
    return;
  }
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
        res.render('country/review/index.html', {
          info: model.data.country,
          submissions: model.data.countrysubmissions,
          subrecord: obj,
          currrecord: entry,
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
        processSubmission(submission)
      }
    }
  );

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
      model.backend.markSubmissionAsReviewed(submission, function(err) {
        var msg = "Submission marked as rejected. The entry has been archived and marked as rejected. It will take a few minutes for this table to update. Thank you!";
        req.flash('info', msg);
        doneUpdating(req, res, submission);
      });
    }
  }
  function doneUpdating(req, res, submission) {
    //Get latest data
    model.load(function() {
      res.redirect('country/overview/' + submission.place);
    });
  }
});


app.get('/g8/', function(req, res) {
  //model.load(function() { //Don't reload for the public
  res.render('g8/index.html', {info: model.data.g8});

  //});
});

app.get('/city/', function(req, res) {
  res.render('city/index.html', {info: model.data.city});
});

app.get('/city/results.json', function(req, res) {
  res.json(model.data.city);
});

app.get('/city/submit/', function(req, res) {
  res.render('city/submit/index.html', {});
});

app.get('/catalogs/', function(req, res) {
  res.render('catalogs/index.html', {});
});

//"Log In" page
app.get('/country/login/', function(req, res) {
  res.render('country/login.html', {
    places: model.data.countrysubmissions.places,
    place: req.query.place,
    next: req.query.next
  });
});

app.get('/country/logout/', function(req, res) {
  if (req.session.loggedin) delete req.session.loggedin;
  res.redirect('/country/');
});

app.post('/country/login/', function(req, res) {
  doLogin(req, res);
});

function doLogin(req, res) {
  if (req.body['password'] === "opendat1") {
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

// ========================================================
// Booting up
// ========================================================

// var url = process.env.CATALOG_URL|| CATALOG_URL_DEFAULT;
// var catalog = new model.Catalog();

model.load(function(err) {
  if (err) {
    console.error('Failed to load dataset info');
  }
  app.listen(app.get('port'), function() {
    console.log("Listening on " + app.get('port'));
  });
});

exports.app = app;

