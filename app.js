var express = require('express')
  , path = require('path')
  , fs = require('fs')
  , nunjucks = require('nunjucks')
  , request = require('request')
  , csv = require('csv')
  , _ = require('underscore')
  ;

var app = express();

var model = require('./models/country.js').OpenDataCensus;

//CORS middleware
var CORSSupport = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
}

app.configure(function(){
  app.set('port', process.env.PORT || 5000);
  app.set('views', __dirname + '/templates');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(CORSSupport);
  app.use(express.static(path.join(__dirname, 'public')));
});

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('templates'));
env.express(app);

// middleware to add trailing slash
app.use(function(req, res, next) {
  if(req.url.substr(-1) != '/' && req.url.indexOf('.') == -1) {
    res.redirect(301, req.url + '/');
  }
  else {
    next();
  }
});


app.get('/', function(req, res) {
  res.render('index.html', {
    numberEntries: model.data.country.summary.entries.toString(),
    numberOpen: model.data.country.summary.open.toString(),
    numberCatalogs: model.data.catalogs.records.length.toString()});
})

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
  res.render('country/index.html', {info: model.data.country});
});

app.get('/country/results.json', function(req, res) {
  res.json(model.data.country);
});

// TODO: want this at simply /country/{place} but need to make sure we don't
// interfere with other urls
app.get('/country/place/{place}/', function(req, res) {
  res.render('country/place.html', {
    place: place,
    info: model.data.country.byplace[place]
  });
});

app.get('/country/submit/', function(req, res) {
  res.render('country/submit/index.html', {});
});

app.get('/g8/', function(req, res) {
  res.render('g8/index.html', {info: model.data.g8});
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

