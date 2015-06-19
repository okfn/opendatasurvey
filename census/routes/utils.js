'use strict';

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var config = require('../config');


var makeRedirect = function (dest) {
  return function (req, res) {
    res.redirect(dest);
  };
};


var scopedPath = function(relativePath) {
  return '/subdomain/:domain{PATH}'.replace('{PATH}', relativePath);
};


var validateSubmitForm = function (req) {
  /**
   * Ensures validation data is submitted by checking the POST data on
   * req.body according to the declared validation logic.
   * Used for new data submissions, and revision proposals.
   */

  var errors,
    exists;

  // first check exists for a yes answer.
  if (req.body.hasOwnProperty('exists') && req.body.exists === 'Yes') {
    exists = true;
  }

  req.checkBody('place', 'You must select a Place').notEmpty();
  req.checkBody('dataset', 'You must select a Dataset').notEmpty();
  req.checkBody('exists', 'You must make a valid choice').isChoice();

  if (exists) {

    req.checkBody('digital', 'You must make a valid choice').isChoice();
    req.checkBody('public', 'You must make a valid choice').isChoice();
    req.checkBody('free', 'You must make a valid choice').isChoice();
    req.checkBody('online', 'You must make a valid choice').isChoice();
    req.checkBody('machinereadable', 'You must make a valid choice').isChoice();
    req.checkBody('bulk', 'You must make a valid choice').isChoice();
    req.checkBody('openlicense', 'You must make a valid choice').isChoice();
    req.checkBody('uptodate', 'You must make a valid choice').isChoice();

  }

  errors = req.validationErrors();

  return errors;
};

var _getLocalReviewers = function (place) {
  // Get the local reviewers of a specific place.
  // Not all places have a reviewers column
  return (place.hasOwnProperty('reviewers')) ? place.reviewers.trim().split(/[\s,]+/) : [];
};


var setupAuth = function () {
  passport.use(new GoogleStrategy({
    clientID: config.get('google:app_id'),
    clientSecret: config.get('google:app_secret'),
    callbackURL: config.get('site_url').replace(/\/$/, '') + '/auth/google/callback',
    profileFields: ['id', 'displayName', 'name', 'username', 'emails', 'photos']
  },
  function (accessToken, refreshToken, profile, done) {
    var userobj = profile;
    if (config.get('user_database_key')) {
      // model.backendUser.createUserIfNotExists(userobj, function (err) {
      //   if (err)
      //     console.error(err);
      //   done(null, userobj);
      // });
    } else {
      done(null, userobj);
    }
  }));

  /*
   * Facebook strategy
   */
//  passport.use(new FacebookStrategy({
//    clientID: '',
//    clientSecret: '',
//    callbackURL: ''
//  },
//  function (accessToken, refreshToken, profile, done) {
//    process.nextTick(function () {
//      var searchQuery = {};
//      model.User.findOne(searchQuery).then(function (user) {
//        if (user) {
//          if (!user.facebook_id) {
//            user.facebook_id = profile.id;
//            user.save().then(function (err) {
//              if (err)
//                throw err;
//              return done(null, user);
//            }).catch(function (err) {
//              return done(err);
//            });
//          }
//          return done(null, user);
//        } else {
//          return done(null, false);
//        }
//      }).catch(function (err) {
//        return done(err);
//      });
//    });
//  }));

  /*
   * local strategy
   */
//   passport.use('local', new LocalStrategy({
//     usernameField: 'email',
//     passwordField: 'password',
//     passReqToCallback: true
//   },
//   function (email, password, done) {
//     var searchQuery = {where: {email: email}};
//     models.User.findOne(searchQuery).then(function (user) {
//       if (!user) {
//         var message = 'user not found';
//         done(null, false, message);
//         return;
//       } else {
//         //add some encryption service (encrypt)
//         if(user.authentication_hash === password){
//           done(null, user);
//           return;
//         } else {
//           var message = 'login credentials not valid';
//           done(null, false, message);
//           return;
//         }

// //        user.validPassword(password).then(function () {
// //          if (!result) {
// //            var message = 'login credentials not valid';
// //            done(null, false, message);
// //            return;
// //          }
// //
// //          done(null, user);
// //          return;
// //        });

//       }
//     }).catch(function (err) {
//       done(err);
//       return;
//     });
//   }));

  // At the moment we get all user info on auth and store to cookie so these are both no-ops ...
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (profile, done) {
    var err = null;
    done(err, profile);
  });

};

var setLocals = function(req, res, next) {

  var config = req.app.get('config');

  if (config.get('test:testing') === true && !req.user && config.get('test:user')) {
    req.user = config.get('test:user');
  }
  if (req.cookies.lang) {
    req.locale = req.cookies.lang;
  }
  res.locals.currentUser = req.user ? req.user : null;

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

};


module.exports = {
  makeRedirect: makeRedirect,
  validateSubmitForm: validateSubmitForm,
  setupAuth: setupAuth,
  scoped: scopedPath,
  setLocals: setLocals
};
