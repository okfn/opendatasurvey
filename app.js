'use strict';

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
var config = require('./lib/config');
var i18n = require('./lib/i18n');
var env = require('./lib/templateenv');
var routes = require('./routes');

var app = express();
var cacheAge = 3600 * 1000; // in milliseconds
var staticRoot = path.join(__dirname, 'public');
var sessionSecret = process.env.SESSION_SECRET || 'dummysecret';
var viewPath = __dirname + '/templates';
var faviconPath = __dirname + '/public/favicon.ico';
var subDomainMiddleware = require('./middlewares/subDomain');
var reloadEntities = require('./middlewares/reloadEntities');

var subdomainOptions = {
  base: config.get('base_domain')
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

app.set('port', config.get('appconfig:port'));
app.set('views', viewPath);

app.use(express.static(staticRoot, {maxage: cacheAge}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({secret: sessionSecret, resave: true, saveUninitialized: true}));
app.use(flash());
app.use(expressValidator(validatorOptions));
app.use(cors());
app.use(compression());
app.use(favicon(faviconPath));
app.use(subdomain(subdomainOptions));
app.use(subDomainMiddleware.checkIfSubDomainExists);
app.use(reloadEntities.setConfigUrl);

if (!config.get('test:testing')) {
  app.use(logger('dev'));
}

i18n.init(app);
env.express(app);

app.all('*', routes.utils.setLocals);
app.use(routes.utils.scoped(''), routes.pages());
app.use(routes.utils.scoped('/admin'), routes.admin());
app.use(routes.utils.scoped('/auth'), routes.auth());
app.use(routes.utils.scoped('/census'), routes.census());
app.use(routes.utils.scoped('/api'), routes.api());
app.use(routes.utils.scoped(''), routes.redirects());

exports.app = app;
