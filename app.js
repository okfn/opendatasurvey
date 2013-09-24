var express = require('express')
  , path = require('path')
  , fs = require('fs')
  , nunjucks = require('nunjucks')
  , request = require('request')
  , csv = require('csv')
  , GoogleSpreadsheet = require('google-spreadsheet')
  , _ = require('underscore')
  , config = require('./lib/config.js')
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

app.get('/about/', function(req, res) {
  fs.readFile('templates/about.md', 'utf8', function(err, text) {
    var marked = require('marked');
    var content = marked(text);
    res.render('base.html', {
      content: content,
      title: 'About'
    });
  });
});

app.get('/contribute/', function(req, res) {
  fs.readFile('templates/contribute.md', 'utf8', function(err, text) {
    var marked = require('marked');
    var content = marked(text);
    res.render('base.html', {
      content: content,
      title: 'Contribute'
    });
  });
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
  model.load(function() {
    //Get latest data, even for the public; they should see their entries awaiting approval
    res.render('country/place.html', {
      error: req.param('e'),
      info: model.data.country,
      submissions: model.data.countrysubmissions,
      place: req.params.place,
      loggedin: req.session.loggedin,
      errormessage: req.param('em')
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

app.get('/country/submit/', function(req, res) {
  var datasets = [];
  var ynquestions = model.data.questions.slice(0,9);
  
  res.render('country/submit.html', {
    datasetsmap: model.datasetNamesMap
    , countryList: model.countryList
    , ynquestions: ynquestions
    , questions: model.data.questions
    , datasets: model.data.country.datasets
    , datasetFromQuery: req.param('dataset')
    , placeFromQuery: req.param('place')
  });
});

app.post('/country/submit/', function(req, res) {
  model.backend.insertSubmission(req.body, function(err, obj) {
    //TODO: Do flash messages properly
    var eValue;
    if (err) {
      console.log(err);
      var msg = 'There was an error! ' + err;
      // req.flash('error', msg);
    } else {
      eValue = 0;
      var msg = 'Thank-you for your submission which has been received. It will now be reviewed by an Editor before being published. It may take up to a few minutes for your submission to appear here and up to a few days for it be reviewed. Please be patient.'
    }
    res.redirect('country/overview/' + encodeURIComponent(req.body['place']) + '/?e=' + eValue + '&em=' + encodeURIComponent(msg));
  });
});

app.get('/country/submission/:id', function(req, res) {
  model.backend.getSubmission({submissionid: req.params.id}, function(err, obj) {
    if (err) {
      res.send(500, 'There was an error: ' + err);
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
    req.session.redirect = '/country/review/?place=' + encodeURIComponent(req.param('place')) + '&dataset=' + req.param('dataset');
    res.redirect('/country/login/');
    return;
  }
  model.backend.getSubmission({submissionid: req.params.submissionid}, function(err, obj) {
    console.log(obj);
    res.render('country/review/index.html', {
      info: model.data.country,
      submissions: model.data.countrysubmissions,
      subrecord: obj,
      datasetfriendly: model.datasetNamesMap[obj.dataset],
      currentYear: model.data.country.currentYear}
    );
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
          doneUpdating(req, res, submission);
        }
      });
    } else if (req.body['submit'] === "Reject") {
      model.backend.markSubmissionAsReviewed(submission, function(err) {
        var msg = "Entry rejected successfully. The entry has been archived and marked as rejected. It will take a few minutes for this table to update. Thank you!";
        // req.flash('success', msg);
        doneUpdating(req, res, submission);
      });
    }
  }
  function doneUpdating(req, res, submission) {
    model.load(function() {
      //Get latest data
      //TODO: Switch to using error codes, but move to using Backend first
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
  res.render('country/login.html', {places: model.data.countrysubmissions.places, redirect: req.session.redirect, error: req.param('e')});
});

//"Log In" page
app.get('/country/login/:place/', function(req, res) {
  res.render('country/login.html', {places: model.data.countrysubmissions.places, place: req.params.place, redirect: req.session.redirect, error: req.param('e')});
});

app.get('/country/logout/', function(req, res) {
  if (req.session.loggedin) delete req.session.loggedin;
  res.redirect('/country/');
});

app.post('/country/login/', function(req, res) {
  doLogin(req, res);
});

app.post('/country/login/:place/', function(req, res) {
  doLogin(req, res);
});

function doLogin(req, res) {
  if (req.body['password'] === "notagoodpassword") {
    req.session.loggedin = true;
    model.load(function() { //Get latest data
      var redirectto = req.session.redirect;
      if (req.body['place']) redirectto = '/country/overview/' + encodeURIComponent(req.body['place']) + '/';
      else if (redirectto) delete req.session.redirect;
      res.redirect(( redirectto || '/country/'));
    });
  }
  else if (req.body['place'])
    res.redirect('country/login/'+encodeURIComponent(req.body['place'])+'/?e=1');
  else
    res.redirect('country/login/?e=1');
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

