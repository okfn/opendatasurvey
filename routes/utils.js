'use strict';

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var config = require('../lib/config.js');
var util = require('../lib/util');
var model = require('../lib/model').OpenDataCensus;


var makeRedirect = function (dest) {
    return function (req, res) {
        res.redirect(dest);
    };
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

var canReview = function (user, place) {
    if (!user) {
        return false;
    }

    // Get both the main reviewers list...
    var reviewers = config.get('reviewers') || [];
    if (!!(~reviewers.indexOf(user.userid) || ~reviewers.indexOf(user.email))) {
        return true;
    }

    // ...and the local place reviewers
    if (place) {
        var localReviewers = _getLocalReviewers(place);
        return !!(~localReviewers.indexOf(user.userid) || ~localReviewers.indexOf(user.email));
    }

    return false;
};

var isAdmin = function (user) {
    return (config.get('admins').indexOf(user.userid) !== -1);
};

var requireLoggedIn = function (req, res) {
    if (!req.user) {
        res.redirect('/login/?next=' + encodeURIComponent(req.url));
        return true;
    }
};

var _getLocalReviewers = function (place) {
    // Get the local reviewers of a specific place.
    // Not all places have a reviewers column
    return (place.hasOwnProperty('reviewers')) ? place.reviewers.trim().split(/[\s,]+/) : [];
};


var setupAuth = function () {
    passport.use(
            new GoogleStrategy({
                clientID: config.get('google:app_id'),
                clientSecret: config.get('google:app_secret'),
                callbackURL: config.get('site_url').replace(/\/$/, '') + '/auth/google/callback',
                profileFields: ['id', 'displayName', 'name', 'username', 'emails', 'photos']
            },
            function (accessToken, refreshToken, profile, done) {
                var userobj = util.makeUserObject(profile);
                if (config.get('user_database_key')) {
                    model.backendUser.createUserIfNotExists(userobj, function (err) {
                        if (err)
                            console.error(err);
                        done(null, userobj);
                    });
                } else {
                    done(null, userobj);
                }
            }
            )
            );

    // At the moment we get all user info on auth and store to cookie so these are both no-ops ...
    passport.serializeUser(function (user, done) {
        done(null, user);
    });
    passport.deserializeUser(function (profile, done) {
        var err = null;
        done(err, profile);
    });
};


module.exports = {
    makeRedirect: makeRedirect,
    isAdmin: isAdmin,
    canReview: canReview,
    validateSubmitForm: validateSubmitForm,
    setupAuth: setupAuth,
    requireLoggedIn: requireLoggedIn
};
