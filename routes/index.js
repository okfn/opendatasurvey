'use strict';

var _ = require('underscore');
var config = require('../lib/config');
var env = require('../lib/templateenv');
var util = require('../lib/util');
var model = require('../lib/model').OpenDataCensus;
var marked = require('marked');
var csv = require('csv');
var routeUtils = require('./utils');
var indexLoader = require('../loaders/index');


var submit = function (req, res) {
  if (routeUtils.requireLoggedIn(req, res))
    return;

  var ynquestions = model.data.questions.slice(0, 9);
  var prefill = req.query;
  var year = prefill.year || config.get('submit_year');
  var submissionData = req.body,
    errors,
    reboundFormData,
    response_status = 200;

  function render(prefill_, status) {
    res.statusCode = status;
    res.render('submission/create.html', {
      canReview: true, // flag always on for submission
      submitInstructions: config.get('submit_page', req.locale),
      places: util.translateRows(model.data.places, req.locale),
      ynquestions: util.translateQuestions(ynquestions, req.locale),
      questions: util.translateQuestions(model.data.questions, req.locale),
      questionsById: util.translateObject(model.data.questionsById, req.locale),
      datasets: util.markupRows(util.translateRows(model.data.datasets, req.locale)),
      year: year,
      prefill: prefill_,
      currrecord: prefill_,
      errors: errors,
      formData: reboundFormData
    });
  }

  function insertSubmissionCallback(err, data) {
    var msg,
      msg_tmpl,
      redirect_path,
      submission_path;
    // TODO: Do flash messages properly
    if (err) {
      console.log(err);
      msg = 'There was an error! ' + err;
      req.flash('error', msg);
    } else {
      msg_tmpl = 'Thanks for your submission.REVIEWED You can check back here any time to see the current status.';
      if (!data.reviewed) {
        msg = msg_tmpl.replace('REVIEWED', ' It will now be reviewed by the editors.');
        submission_path = '/submission/' + data.submissionid;
        redirect_path = submission_path;
      } else {
        msg = msg_tmpl.replace('REVIEWED', '');
        submission_path = '/submission/' + data.submissionid;
        redirect_path = '/place/' + data.place;
      }
      req.flash('info', msg);
    }
    res.redirect(redirect_path + '?post_submission=' + submission_path);
  }

  // validate the POST data and put the results on `errors`
  if (req.method === 'POST') {
    errors = routeUtils.validateSubmitForm(req);
    if (errors) {
      reboundFormData = submissionData;
      response_status = 400;
    }
  }

  if (req.method === 'POST' && !errors) {
    model.backend.insertSubmission(submissionData, req.user,
      insertSubmissionCallback);

  } else if (prefill.dataset && prefill.place) {
    model.backend.getEntry({
      place: prefill.place,
      dataset: prefill.dataset,
      year: year
    }, function (err, entry) {
      // we allow query args to override entry values
      // might be useful (e.g. if we started having form errors and
      // redirecting here ...)
      if (entry) { // we might have a got a 404 etc
        prefill = _.extend(entry, prefill);
      }
      render(prefill, response_status);
    });

  } else {
    render(prefill, response_status);
  }

};

// Compare & update page
var submission = function (req, res) {
  var ynquestions = model.data.questions.slice(0, 9),
    reviewClosed;

  model.backend.getSubmission({submissionid: req.params.submissionid}, function (err, obj) {
    if (err) {
      res.send(500, 'There was an error ' + err);
    } else if (!obj) {
      res.send(404, 'There is no submission with id ' + req.params.submissionid);
    } else {

      if (obj.reviewresult) {
        // If the object has been reviewed, we close further reviews.
        reviewClosed = true;
      }

      // see if there is an entry
      model.backend.getEntry(obj, function (err, entry) {
        if (!entry) {
          entry = {};
        }
        var dataset = _.findWhere(model.data.datasets, {
          id: obj.dataset
        });
        var place = model.data.placesById[obj.place];

        res.render('submission/review.html', {
          canReview: routeUtils.canReview(req.user, place),
          reviewClosed: reviewClosed,
          reviewInstructions: config.get('review_page', req.locale),
          ynquestions: util.translateQuestions(ynquestions, req.locale),
          questions: util.translateQuestions(model.data.questions, req.locale),
          questionsById: util.translateObject(model.data.questionsById, req.locale),
          prefill: obj,
          currrecord: entry,
          dataset: util.markup(util.translate(dataset, req.locale)),
          place: util.translate(place, req.locale),
          disqus_shortname: config.get('disqus_shortname'),
          reviewState: true
        });
      });
    }
  });
};

var reviewPost = function (req, res) {
  if (routeUtils.requireLoggedIn(req, res))
    return;
  // Get the submission's place, so we can find the local reviewers
  model.backend.getSubmission({submissionid: req.params.submissionid}, function (err, obj) {
    if (!routeUtils.canReview(req.user, model.data.placesById[obj.place])) {
      res.send(401, 'Sorry, you are not an authorized reviewer');
      return;
    }
  });

  var acceptSubmission = req.body['submit'] === 'Publish';
  model.backend.processSubmission(req.user, acceptSubmission, req.params.submissionid, req.body, function (err) {
    if (err) {
      if (err.code) {
        res.send(err.code, err.message);
      } else {
        res.send(500, err);
      }
    } else {
      if (acceptSubmission) {
        var msg = "Submission processed and entered into the census.";
        req.flash('info', msg);
      } else {
        var msg = "Submission marked as rejected.";
        req.flash('info', msg);
      }
      // TODO: find a better way to update cached data
      // model.load(function() {
      res.redirect('/');
      // });
    }
  });
};


var overview = function (req, res) {
  // sort places by score
  var sortedPlaces = _.sortBy(model.data.places, function (place) {
    return model.data.entries.byplace[place.id].score * -1;
  });

  var extraWidth = (model.data.datasets.length > 12);
  // note: model.data.places and model.data.entries.places are different
  // the latter only has places for which we have some actual results
  res.render('overview.html', {
    summary: model.data.entries.summary,
    extraWidth: extraWidth,
    places: util.translateRows(sortedPlaces, req.locale),
    byplace: model.data.entries.byplace,
    datasets: util.translateRows(model.data.datasets, req.locale),
    scoredQuestions: util.translateRows(model.data.scoredQuestions, req.locale),
    placesById: util.translateObject(model.data.placesById, req.locale),
    custom_text: config.get('overview_page', req.locale),
    missing_place_html: config.get('missing_place_html', req.locale)
  });
};

var api = function (req, res) {
  var entries = model.data.entries.results;
  var headers = [];
  if (entries !== []) {
    // create a list of omitted keys
    var omissions = [];
    _.each(entries[0], function (v, k) {
      if (typeof v === 'function' || k[0] === '_' || _.contains(['content'], k)) {
        omissions.push(k);
      }
    });
    // remove omissions
    entries = _.map(entries, function (i) {
      return _.omit(i, omissions);
    });
    // get a list of headers
    headers = _.keys(entries[0]);
  }

  if (req.params.format === 'json') {
    return res.json(entries);
  } else if (req.params.format === 'csv') {
    return csv()
      .from.array(entries, {columns: headers})
      .to.stream(res, {header: true})
      ;
  } else {
    return res.send(404);
  }
};

var about = function (req, res) {
  var text = config.get('about_page', req.locale);
  var content = marked(text);
  res.render('base.html', {
    content: content,
    title: 'About'
  });
};

var faq = function (req, res) {
  var tmpl = env.getTemplate('_snippets/questions.html');
  var questionInfo = tmpl.render({
    gettext: res.locals.gettext,
    questions: util.translateQuestions(model.data.questions, req.locale)
  });
  var dataTmpl = env.getTemplate('_snippets/datasets.html');
  var dataInfo = dataTmpl.render({
    gettext: res.locals.gettext,
    datasets: util.markupRows(util.translateRows(model.data.datasets, req.locale))
  });
  var missingPageHtml = config.get('missing_place_html', req.locale);
  var content = marked(config.get('faq_page', req.locale))
    .replace('{{questions}}', questionInfo)
    .replace('{{datasets}}', dataInfo)
    .replace('{{missing_place}}', missingPageHtml);

  res.render('base.html', {
    content: content,
    title: 'FAQ - Frequently Asked Questions'
  });
};

var changes = function (req, res) {

  var changeItems = [];

  // fetch all submissions
  model.backend.getSubmissions({
    year: config.get('submit_year')
  }, function (err, submissions) {
    submissions = _.sortBy(submissions, function (submission) {
      return submission.timestamp;
    });

    // fetch all entries
    // var entries = _.sortBy(model.data.entries.results, function(entry) {
    //   return entry.timestamp;
    // });

    submissions = addPlaceAndName(submissions);
    // entries = addPlaceAndName(entries);

    submissions.forEach(function (submission) {
      changeItems.push(transformToChangeItem(submission, 'Submission'));
    });

    // entries.forEach(function(entry) {
    //     changeItems.push(transformToChangeItem(entry, 'Entry'));
    // });

    function transformToChangeItem(obj, type) {
      var url;
      if (obj.reviewresult === 'accepted') {
        url = '/entry/PLACE/DATASET'
          .replace('PLACE', obj.place)
          .replace('DATASET', obj.dataset);
      } else {
        url = obj.details_url || '/submission/ID'.replace('ID', obj.submissionid);
      }
      return {
        type: type,
        timestamp: obj.timestamp,
        dataset_title: obj.dataset_title,
        place_name: obj.place_name,
        url: url,
        status: obj.reviewresult,
        submitter: obj.submitter,
        reviewer: obj.reviewer
      };
    }

    function sortByDate(a, b) {
      var date_a = Date.parse(a.timestamp),
        date_b = Date.parse(b.timestamp);
      if (date_a > date_b) {
        return 1;
      }
      if (date_a < date_b) {
        return -1;
      }
      return 0;
    }

    res.render('changes.html', {
      changeitems: changeItems.sort(sortByDate).slice(-500).reverse()
    });
  });

  function addPlaceAndName(entries) {
    return _.each(entries, function (entry) {
      entry.dataset_title = util.translate(model.data.datasetsById[entry.dataset], req.locale).title;
      entry.place_name = util.translate(model.data.placesById[entry.place], req.locale).name;
      return entry;
    });
  }
};

var contribute = function (req, res) {
  var text = config.get('contribute_page', req.locale);
  var content = marked(text);
  res.render('base.html', {
    content: content,
    title: 'Contribute'
  });
};

var resultJson = function (req, res) {
  res.json(model.data.entries);
};

//Show details per country. Extra/different functionality for reviewers.
var place = function (req, res) {
  if (!(req.params.place) in model.data.placesById) {
    res.send(404, 'There is no place with ID ' + place + ' in our database. Are you sure you have spelled it correctly? Please check the <a href="/">overview page</a> for the list of places');
    return;
  }
  var place = model.data.placesById[req.params.place];

  model.backend.getPlace(place.id, function (err, info) {
    if (err) {
      res.send(500, err);
      return;
    }

    // TODO: move this to model
    var entrys = _.reduce(info.entrys, function (o, entry) {
      var existing = o[entry.dataset];
      // assign if no entry or year is later
      if (!existing || parseInt(entry.year, 10) >= parseInt(existing.year, 10)) {
        entry['ycount'] = util.scoreOpenness(model.data, entry);
        o[entry.dataset] = entry;
      }
      return o;
    }, {});

    var submissions = _.reduce(info.submissions, function (o, submission) {
      submission['ycount'] = util.scoreOpenness(model.data, submission);
      if (!(submission.dataset in o))
        o[submission.dataset] = [];
      o[submission.dataset].push(submission);
      return o;
    }, {});

    res.render('country/place.html', {
      info: model.data.entries,
      datasets: util.translateRows(model.data.datasets, req.locale),
      submissions: submissions,
      entrys: entrys,
      place: util.translate(place, req.locale),
      scoredQuestions: util.translateRows(model.data.scoredQuestions, req.locale),
      loggedin: req.session.loggedin,
      display_year: config.get('display_year')
    });
  });
};

//Show details per dataset
var dataset = function (req, res) {
  var dataset = model.data.datasetsById[req.params.dataset];

  function cleanResultSet(results) {
    var lookup = _.pluck(results, 'place'),
      redundants = findRedundants(lookup),
      clean_results = [];

    function sorter(a, b) {
      if (a.ycount > b.ycount)
        return -1;
      if (a.ycount < b.ycount)
        return 1;
      return 0;
    }

    function findRedundants(lookup) {
      var _redundants = [];
      _.each(lookup, function (key) {
        var r;
        r = _.filter(lookup, function (x) {
          if (x === key) {
            return x
          }
        });
        if (r.length > 1) {
          _redundants.push(key);
        }
      });
      return _redundants;
    }

    function removeRedundants(results) {
      _.each(results, function (entry) {
        if (_.contains(redundants, entry.place) &&
          entry.year !== config.get('submit_year')) {
          // dont want it!
        } else {
          clean_results.push(entry);
        }
      });
      return clean_results;
    }
    return removeRedundants(results).sort(sorter);
  }

  if (!dataset) {
    res.send(404, 'Dataset not found. Are you sure you have spelled it correctly?');
    return;
  }

  model.backend.getEntrys({
    dataset: req.params.dataset,
    year: {'<=': config.get('display_year')}
  }, function (err, entriesForThisDataset) {
    if (err)
      throw err;
    entriesForThisDataset.forEach(function (entry) {
      entry.ycount = util.scoreOpenness(model.data, entry);
    });
    res.render('country/dataset.html', {
      bydataset: cleanResultSet(entriesForThisDataset),
      placesById: util.translateObject(model.data.placesById, req.locale),
      scoredQuestions: util.translateRows(model.data.scoredQuestions, req.locale),
      dataset: util.markup(util.translate(dataset, req.locale))
    });
  });
};

/* Single Entry Page */
var entryByPlaceDataset = function (req, res) {
  var dataset = _.findWhere(model.data.datasets, {
    id: req.params.dataset
  });
  if (!dataset) {
    return res.send(404, res.locals.format('There is no entry for %(place)s and %(dataset)s', {
      place: req.params.place,
      dataset: req.params.dataset
    }, req.locale));
  }

  var place = model.data.placesById[req.params.place];
  var ynquestions = model.data.questions.slice(0, 9);

  function render(prefill_) {
    res.render('country/entry.html', {
      ynquestions: util.translateQuestions(ynquestions, req.locale),
      questions: util.translateQuestions(model.data.questions, req.locale),
      scoredQuestions: util.translateRows(model.data.scoredQuestions, req.locale),
      datasets: util.translateRows(model.data.datasets, req.locale),
      dataset: util.markup(util.translate(dataset, req.locale)),
      place: util.translate(place, req.locale),
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
  }, function (err, obj) {
    if (obj) { // we might have a got a 404 etc
      prefill = _.extend(obj, prefill);
    } else {
      return res.send(404, res.locals.format('There is no entry for %(place)s and %(dataset)s', {
        place: req.params.place,
        dataset: req.params.dataset
      }, req.locale));
    }

    model.backend.getSubmissions({
      place: req.params.place,
      dataset: req.params.dataset,
      //TODO: next year, extend to /2013/, etc.
      year: config.get('display_year')
    }, function (err, obj) {
      // we allow query args to override entry values
      // might be useful (e.g. if we started having form errors and redirecting
      // here ...)
      if (obj) { // we might have a got a 404 etc
        prefill['reviewers'] = [];
        prefill['submitters'] = [];

        _.each(obj, function (val) {
          if (val['reviewer'] !== "")
            prefill['reviewers'].push(val['reviewer']);
          if (val['submitter'] !== "")
            prefill['submitters'].push(val['submitter']);
        });

        prefill['reviewers'] = _.uniq(prefill['reviewers']);
        prefill['submitters'] = _.uniq(prefill['submitters']);
        if (prefill['reviewers'].length === 0)
          prefill['noreviewers'] = true;
        if (prefill['submitters'].length === 0)
          prefill['nosubmitters'] = true;
        render(prefill);
      } else {
        res.send(404, 'There is no entry for ' + req.params.place + ' and ' + req.params.dataset);
        return;
      }
    });
  });
};

var anonLogin = function (req, res) {
  if (config.get('anonymous_submissions') !== 'TRUE') {
    return res.send(405);
  }

  var name = req.body.displayName || 'Anonymous';
  var user = util.makeUserObject({
    id: 'anonymous',
    provider: 'okfn',
    username: 'anonymous',
    displayName: name
  });

  req.session.nextUrl = req.query.next;

  req.login(user, function (err) {
    if (err) {
      return res.send(err.code || 500, err.message || err);
    }

    loggedin(req, res);
  });
};

var login = function (req, res) {
  // TODO: use this stored next url properly ...
  req.session.nextUrl = req.query.next;
  res.render('login.html', {
    anonymous_submissions: config.get('anonymous_submissions') === 'TRUE'
  });
};

var logout = function (req, res) {
  req.logout();
  res.redirect('/');
};

var loggedin = function (req, res) {
  if (req.session.nextUrl) {
    res.redirect(req.session.nextUrl);
  } else {
    res.redirect('/');
  }
};


var reload = function (req, res) {
  model.load(function (err) {
    var msg = 'Reloaded OK &ndash; <a href="/">Back to home page</a>';
    if (err) {
      console.error('Failed to reload config info');
      msg = 'Failed to reload config etc. ' + err;
    }
    res.send(msg);
  });
};

/*
 * reload entities functionality
 */

//show reload dashboard
var loadReloadDashboard = function (req, res) {
  res.sendfile('./public/reloadDashboard.html');
};


var createReloadResultRepsonse = function (err, reloadResult) {
  var response = false;
  if (err) {
    response = {status: 'error', message: err};
  } else {
    response = {status: 'ok', data: 'ok'};
  }
  return response;
};
/*
 * reload places
 */
var reloadPlaces = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return indexLoader.loadPlaces(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload datasets
 */
var reloadDatasets = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return indexLoader.loadDatasets(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload Questions
 */
var reloadQuestions = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return indexLoader.loadQuestions(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload Registry
 */
var reloadRegistry = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return indexLoader.loadRegistry(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};

/*
 * reload Config
 */
var reloadConfig = function (req, res) {
  var params = {
    subDomain: req.subDomain,
    configUrl: req.registryConfig
  };

  return indexLoader.loadConfig(params).spread(function (err, reloadResult) {
    var reloadResponse = createReloadResultRepsonse(err, reloadResult);
    res.send(reloadResponse);
  });
};



var setLocale = function (req, res) {
  res.cookie('lang', req.params.locale);
  res.redirect(req.headers.referer || '/');
};

module.exports = {
  setLocale: setLocale,
  entryByPlaceDataset: entryByPlaceDataset,
  dataset: dataset,
  place: place,
  contribute: contribute,
  resultJson: resultJson,
  changes: changes,
  faq: faq,
  about: about,
  api: api,
  overview: overview,
  reload: reload,
  loadReloadDashboard: loadReloadDashboard,
  reloadPlaces: reloadPlaces,
  reloadDatasets: reloadDatasets,
  reloadQuestions: reloadQuestions,
  reloadRegistry: reloadRegistry,
  reloadConfig: reloadConfig,
  anonLogin: anonLogin,
  login: login,
  logout: logout,
  loggedin: loggedin,
  submit: submit,
  submission: submission,
  reviewPost: reviewPost
};
