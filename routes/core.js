var fs = require('fs')
  , path = require('path')
  , csv = require('csv')
  , _ = require('underscore')
  , express = require('express')
  , flash = require('connect-flash')
  , scrypt = require('scrypt')
  , marked = require('marked')

  , config = require('../lib/config')
  , env = require('../lib/templateenv')
  , model = require('../lib/model').OpenDataCensus
  , util = require('../lib/util')
  ;

exports.overview = function(req, res) {
  // sort places by score
  var sortedPlaces = _.sortBy(model.data.places, function(place) {
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

exports.api = function(req, res) {
  var entries = model.data.entries.results;
  var headers = [];
  if (entries !== []) {
    // create a list of omitted keys
    var omissions = [];
    _.each(entries[0], function(v, k) {
      if (typeof v === 'function' || k[0] === '_' || _.contains(['content'], k)) {
        omissions.push(k);
      }
    });
    // remove omissions
    entries = _.map(entries, function(i) {
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

exports.about = function(req, res) {
  var text = config.get('about_page', req.locale);
  var content = marked(text);
  res.render('base.html', {
    content: content,
    title: 'About'
  });
};

exports.faq = function(req, res) {
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

exports.changes = function(req, res) {

    var changeItems = [];

    // fetch all submissions
    model.backend.getSubmissions({
      year: config.get('submit_year')
    }, function(err, submissions) {
        submissions = _.sortBy(submissions, function(submission) {
        return submission.timestamp;
    });

    // fetch all entries
    // var entries = _.sortBy(model.data.entries.results, function(entry) {
    //   return entry.timestamp;
    // });

    submissions = addPlaceAndName(submissions);
    // entries = addPlaceAndName(entries);

    submissions.forEach(function(submission) {
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
                  .replace('DATASET', obj.dataset)
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
    return _.each(entries, function(entry) {
      entry.dataset_title = util.translate(model.data.datasetsById[entry.dataset], req.locale).title;
      entry.place_name = util.translate(model.data.placesById[entry.place], req.locale).name;
      return entry;
    });
  }
};

exports.contribute = function(req, res) {
  var text = config.get('contribute_page', req.locale);
  var content = marked(text);
  res.render('base.html', {
    content: content,
    title: 'Contribute'
  });
};

exports.resultJson = function(req, res) {
  res.json(model.data.entries);
};

//Show details per country. Extra/different functionality for reviewers.
exports.place = function(req, res) {
  if (!(req.params.place) in model.data.placesById) {
    res.send(404, 'There is no place with ID ' + place + ' in our database. Are you sure you have spelled it correctly? Please check the <a href="/">overview page</a> for the list of places');
    return;
  }
  var place = model.data.placesById[req.params.place];

  model.backend.getPlace(place.id, function(err, info) {
    if (err) {
      res.send(500, err);
      return;
    }

    // TODO: move this to model
    var entrys = _.reduce(info.entrys, function(o, entry) {
      var existing = o[entry.dataset];
      // assign if no entry or year is later
      if (!existing || parseInt(entry.year, 10) >= parseInt(existing.year, 10)) {
        entry['ycount'] = util.scoreOpenness(model.data, entry);
        o[entry.dataset] = entry;
      }
      return o;
    }, {});

    var submissions = _.reduce(info.submissions, function(o, submission) {
      submission['ycount'] = util.scoreOpenness(model.data, submission);
      if (!(submission.dataset in o)) o[submission.dataset] = [];
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
exports.dataset = function(req, res) {
  var dataset = model.data.datasetsById[req.params.dataset];
  if (!dataset) {
    res.send(404, 'Dataset not found. Are you sure you have spelled it correctly?');
    return;
  }

  model.backend.getEntrys({
    dataset: req.params.dataset,
    year: {'<=': config.get('display_year')}
  }, function(err, entriesForThisDataset) {
    if (err) throw err;
    entriesForThisDataset.forEach(function(entry) {
      entry.ycount = util.scoreOpenness(model.data, entry);
    });
    res.render('country/dataset.html', {
      bydataset: entriesForThisDataset,
      placesById: util.translateObject(model.data.placesById, req.locale),
      scoredQuestions: util.translateRows(model.data.scoredQuestions, req.locale),
      dataset: util.markup(util.translate(dataset, req.locale))
    });
  });
};

/* Single Entry Page */
/* TODO: optimize/improve */
exports.entryByPlaceDataset = function(req, res) {
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
  }, function(err, obj) {
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
    }, function(err, obj) {
      // we allow query args to override entry values
      // might be useful (e.g. if we started having form errors and redirecting
      // here ...)
      if (obj) { // we might have a got a 404 etc
        prefill['reviewers'] = [];
        prefill['submitters'] = [];

        _.each(obj, function(val) {
          if (val['reviewer'] !== "") prefill['reviewers'].push(val['reviewer']);
          if (val['submitter'] !== "") prefill['submitters'].push(val['submitter']);
        });

        prefill['reviewers'] = _.uniq(prefill['reviewers']);
        prefill['submitters'] = _.uniq(prefill['submitters']);
        if (prefill['reviewers'].length === 0) prefill['noreviewers'] = true;
        if (prefill['submitters'].length === 0) prefill['nosubmitters'] = true;
        render(prefill);
      } else {
        res.send(404, 'There is no entry for ' + req.params.place + ' and ' + req.params.dataset);
        return;
      }
    });
  });
};

exports.setlocale = function(req, res) {
  var locale = req.params.locale;

  res.cookie('lang', locale);

  res.redirect(req.headers.referer || '/');
};
