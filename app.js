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

app.use([
  cookieParser(),
  bodyParser.urlencoded({extended: true}),
  bodyParser.json(),
  methodOverride(),
  session({secret: sessionSecret, resave: true, saveUninitialized: true}),
  flash()
])

var middlewares = [
  express.static(staticRoot, {maxage: cacheAge}),
  expressValidator(validatorOptions),
  cors(),
  compression(),
  favicon(faviconPath),
  subdomain(subdomainOptions),
  subDomainMiddleware.checkIfSubDomainExists,
  reloadEntities.setConfigUrl
];

i18n.init(app);
env.express(app);

app.all('*', routes.utils.setLocals);
app.use('/admin', routes.admin(middlewares));
app.use('/auth', routes.auth(middlewares));
app.use('/census', routes.census(middlewares));
app.use('/api', routes.api(middlewares));
app.use('', routes.pages(middlewares));
app.use('', routes.redirects(middlewares));

module.exports = {
  app: app
}
