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
var passport = require('passport');
var expressValidator = require('express-validator');
var config = require('./lib/config');
var i18n = require('./lib/i18n');
var env = require('./lib/templateenv');
var routes = require('./routes');
var routeUtils = require('./routes/utils');
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
},
authScope = {
  google: {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  }
},
authConfig = {
  google: {
    successRedirect: '/auth/loggedin',
    failureRedirect: '/login',
    failureFlash: true,
    successFlash: true
  }
};


function urlFor(name) {
  if (name === 'overview') {
    return '/';
  }
  return undefined;
}

function scopedPath(relativePath) {
  return '/subdomain/:domain{PATH}'.replace('{PATH}', relativePath);
}

app.set('port', config.get('appconfig:port'));
app.set('views', viewPath);

app.use(express.static(staticRoot, {maxage: cacheAge}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(session({secret: sessionSecret, resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
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

app.locals.urlFor = urlFor;
i18n.init(app);
env.express(app);

app.all('*', function (req, res, next) {
  if (config.get('test:testing') === true && !req.user && config.get('test:user')) {
    req.user = config.get('test:user');
  }
  if (req.cookies.lang) {
    req.locale = req.cookies.lang;
  }
  res.locals.currentUser = req.user ? req.user : null;

  if (config.get('appconfig:readonly')) {
    res.locals.readonly = true;
    // No session support in readonly mode, so fake it out:
    req.session = {};
    req.session.loggedin = false;
  }

  if (config.get('contribute_page') === '<h1>To set content for this page update your configuration file</h1>' ||
    config.get('contribute_page') === '' ||
    config.get('contribute_page') === undefined) {
    res.locals.has_contribute_page = false;
  } else {
    res.locals.has_contribute_page = true;
  }

  res.locals.locales = config.get('locales');
  res.locals.currentLocale = req.locale;
  res.locals.sitename = config.get('title', req.locale);
  res.locals.sitename_short = config.get('title_short', req.locale);
  res.locals.custom_css = config.get('custom_css');
  res.locals.google_analytics_key = config.get('google_analytics_key');
  res.locals.custom_footer = config.get('custom_footer', req.locale);
  res.locals.navbar_logo = config.get('navbar_logo', req.locale);
  res.locals.banner_text = config.get('banner_text', req.locale);
  res.locals.current_url = 'SCHEME://DOMAIN_PATH'.replace('SCHEME', req.protocol).replace('DOMAIN_', req.get('host')).replace('PATH', req.path);
  res.locals.current_domain = 'SCHEME://DOMAIN_'.replace('SCHEME', req.protocol).replace('DOMAIN_', req.get('host'));
  res.locals.post_submission_info = config.get('post_submission_info');
  res.locals.share_submission_template = config.get('share_submission_template', req.locale);
  res.locals.share_page_template = config.get('share_page_template', req.locale);
  res.locals.url_query = req.query;
  res.locals.error_messages = req.flash('error');
  res.locals.info_messages = req.flash('info');
  next();
});

// ADMIN ACTIONS
app.get(scopedPath('/admin/reload'), routes.reload);
app.get(scopedPath('/reload'), routes.loadReloadDashboard);
app.get(scopedPath('/reload/places'), routes.reloadPlaces);
app.get(scopedPath('/reload/datasets'), routes.reloadDatasets);
app.get(scopedPath('/reload/questions'), routes.reloadQuestions);
app.get(scopedPath('/reload/registry'), routes.reloadRegistry);
//app.get(scopedPath('/reload/config'), routes.reloadConfig);

// AUTH ENDPOINTS
app.get(scopedPath('/auth/google'), passport.authenticate('google', authScope.google));
app.get(scopedPath('/auth/google/callback'), passport.authenticate('google', authConfig.google));
app.get(scopedPath('/contribute'), routes.contribute);
app.get(scopedPath('/setlocale/:locale'), routes.setLocale);
app.get(scopedPath('/submit'), routes.submit);
app.post(scopedPath('/submit'), routes.submit);
app.get(scopedPath('/submission/:submissionid'), routes.submission);
app.post(scopedPath('/submission/:submissionid'), routes.reviewPost);
app.get(scopedPath('/login'), routes.login);
app.post(scopedPath('/login'), routes.anonLogin);
app.get(scopedPath('/auth/logout'), routes.logout);
app.get(scopedPath('/auth/loggedin'), routes.loggedin);
app.get(scopedPath('/'), routes.overview);
app.get(scopedPath('/about'), routes.about);
app.get(scopedPath('/api/entries.:format'), routes.api);
app.get(scopedPath('/faq'), routes.faq);
app.get(scopedPath('/changes'), routes.changes);
app.get(scopedPath('/overview.json'), routes.resultJson);
app.get(scopedPath('/place/:place'), routes.place);
app.get(scopedPath('/dataset/:dataset'), routes.dataset);
app.get(scopedPath('/entry/:place/:dataset'), routes.entryByPlaceDataset);

// REDIRECTS FROM PREVIOUS VERSIONS
app.get(scopedPath('/country'), routeUtils.makeRedirect(scopedPath('/')));
app.get(scopedPath('/country/results.json'), routeUtils.makeRedirect(scopedPath('/overview.json')));
app.get(scopedPath('/country/overview/:place'), function (req, res) {
  res.redirect(scopedPath('/place/' + req.params.place));
});
app.get(scopedPath('/country/dataset/:dataset'), function (req, res) {
  res.redirect(scopedPath('/dataset/' + req.params.dataset));
});
app.get(scopedPath('/country/review/:submissionid'), function (req, res) {
  res.redirect(scopedPath('/submission/' + req.params.submissionid));
});
app.get(scopedPath('/country/login'), function (req, res) {
  res.redirect(scopedPath('/login?next=' + req.query.next));
});
app.get(scopedPath('/country/submit'), routeUtils.makeRedirect('/submit'));
app.get(scopedPath('/country/submission/:id'), function (req, res) {
  res.redirect(scopedPath('/submission/' + req.params.id));
});
app.get(scopedPath('/country/:place/:dataset'), function (req, res) {
  res.redirect(scopedPath('/entry/' + req.params.place + '/' + req.params.dataset));
});
exports.app = app;
