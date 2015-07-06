'use strict';

var _ = require('underscore');
var path = require('path');
var express = require('express');
var subdomain = require('subdomain');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var cors = require('cors');
var favicon = require('serve-favicon');
var flash = require('connect-flash');
var compression = require('compression');
var expressValidator = require('express-validator');
var config = require('./config');
var i18n = require('i18n-abide');
var routes = require('./routes');
var nunjucks = require('nunjucks');
var env;
var templateFilters = require('./filters');
var app = express();
var cacheAge = 3600 * 1000; // in milliseconds
var staticRoot = path.join(__dirname, 'public');
var sessionSecret = process.env.SESSION_SECRET || 'dummysecret';
var viewPath = __dirname + '/views';
var faviconPath = __dirname + '/public/favicon.ico';
var models = require('./models');
var middlewares = require('./middlewares');
var currentYear = new Date().getFullYear();
var startYear = 2012;
var availableYears = _.range(startYear, currentYear);
var subdomainOptions = {
  base: config.get('baseDomain')
};
var validatorOptions = {
  customValidators: {
    isChoice: function (value) {
      var choices = ['Yes', 'No', 'Unsure'];
      if (choices.indexOf(value) > -1) {
        return true;
      } else {
        return false;
      }
    }
  }
};

app.set('config', config);
app.set('port', config.get('appconfig:port'));
app.set('views', viewPath);
app.set('models', models);
app.set('year', currentYear);
app.set('years', availableYears);

env = nunjucks.configure('census/views', {
    // autoescape: true,
    express: app
});

_.each(templateFilters, function(value, key, list) {
  env.addFilter(key, value);
});

app.set('view_env', env);

app.use([
  cookieParser(),
  bodyParser.urlencoded({extended: true}),
  bodyParser.json(),
  methodOverride(),
  session({secret: sessionSecret, resave: true, saveUninitialized: true}),
  flash(),
  i18n.abide({
    supported_languages: config.get('locales'),
    default_lang: _.first(config.get('locales')),
    translation_directory: 'locales'
  })
]);

var coreMiddlewares = [
  express.static(staticRoot, {maxage: cacheAge}),
  expressValidator(validatorOptions),
  cors(),
  compression(),
  favicon(faviconPath),
  subdomain(subdomainOptions),
];

app.all('*', routes.utils.setLocals);
app.use('/admin', routes.admin(coreMiddlewares));
app.use('/auth', routes.auth(coreMiddlewares));
app.use('/census', routes.census(coreMiddlewares));
app.use('/api', routes.api(coreMiddlewares));
app.use('', routes.pages(coreMiddlewares));
app.use('', routes.redirects(coreMiddlewares));

app.use(middlewares.notFound);
app.use(middlewares.internalServerError);

routes.utils.setupAuth();

app.get('models').sequelize.sync().then(function () {
  app.listen(app.get('port'), function () {
    console.log("Listening on " + app.get('port'));
  });
});


module.exports = {
  app: app
};
